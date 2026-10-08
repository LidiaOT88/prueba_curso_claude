import { Component, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { TableService } from '../../core/services/table.service'
import { TableSelectionStore } from '../../core/store/table-selection.store'
import { Table } from '../../core/models/table.model'

@Component({
  selector: 'app-table-select',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <a routerLink="/restaurants" class="back-link">← Volver a restaurantes</a>
          <h1>Elige tu mesa</h1>
          <p>Indica cuántas personas sois y selecciona una mesa libre</p>
        </div>
      </div>

      <div class="card people-form">
        <label for="people">Número de personas</label>
        <input id="people" type="number" class="form-control" min="1" step="1"
               [ngModel]="people()" (ngModelChange)="people.set($event)" name="people" />
        <button class="btn btn-primary" (click)="search()" [disabled]="loading()">Ver mesas</button>
      </div>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (searched() && tables().length === 0) {
        <div class="empty-state">
          <p>No hay mesas disponibles para {{ people() }} personas</p>
        </div>
      } @else {
        <div class="table-grid">
          @for (table of tables(); track table.id) {
            <button class="table-card card" [class.selected]="selected()?.id === table.id" (click)="choose(table)">
              <h3>Mesa {{ table.number }}</h3>
              <p>{{ table.capacity }} personas</p>
              @if (table.description) {
                <p class="description">{{ table.description }}</p>
              }
            </button>
          }
        </div>
      }

      <div class="actions">
        <button class="btn btn-primary continue" [disabled]="!selected() || occupying()" (click)="continue()">
          Continuar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .people-form {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .people-form input {
      width: 100px;
    }
    .table-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .table-card {
      padding: 16px;
      text-align: left;
      cursor: pointer;
      transition: all var(--transition);
    }
    .table-card:hover,
    .table-card.selected {
      border-color: var(--green-medium);
    }
    .table-card.selected {
      background: var(--bg-hover);
    }
    .description {
      font-size: 13px;
      color: var(--text-muted);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class TableSelectComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly tableService = inject(TableService)
  private readonly selection = inject(TableSelectionStore)

  private readonly restaurantId = this.route.snapshot.paramMap.get('id')!

  readonly people = signal(2)
  readonly tables = signal<Table[]>([])
  readonly selected = signal<Table | null>(null)
  readonly loading = signal(false)
  readonly occupying = signal(false)
  readonly searched = signal(false)
  readonly error = signal<string | null>(null)

  search(): void {
    const people = Number(this.people())
    if (!Number.isInteger(people) || people < 1) return

    this.loading.set(true)
    this.error.set(null)
    this.tableService.getAvailable(this.restaurantId, people).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        this.selected.set(null)
        this.searched.set(true)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('No se pudieron cargar las mesas.')
        this.loading.set(false)
      }
    })
  }

  choose(table: Table): void {
    this.selected.set(table)
  }

  continue(): void {
    const table = this.selected()
    if (!table) return

    this.occupying.set(true)
    this.error.set(null)
    this.tableService.occupy(this.restaurantId, table.id).subscribe({
      next: (occupied) => {
        this.selection.select(occupied)
        this.occupying.set(false)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err) => {
        this.occupying.set(false)
        if (err?.status === 409) {
          this.selected.set(null)
          this.search()
          this.error.set('La mesa ya no está disponible. Elige otra.')
        } else {
          this.error.set('No se pudo ocupar la mesa. Inténtalo de nuevo.')
        }
      }
    })
  }
}

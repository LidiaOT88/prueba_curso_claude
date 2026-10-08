import { Component, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import { TableStore } from '../../store/table.store'
import type { CreateTableDto } from '../../models/table.model'

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './table-form.component.html',
  styleUrl: './table-form.component.css'
})
export class TableFormComponent implements OnInit {
  private readonly store = inject(TableStore)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  isEditing = false
  tableId: string | null = null
  restaurantId = ''
  loading = signal(false)
  error = signal<string | null>(null)

  form: CreateTableDto = { number: 1, description: '', capacity: 2 }

  get pageTitle(): string {
    return this.isEditing ? 'Editar mesa' : 'Nueva mesa'
  }

  get listUrl(): string {
    return `/restaurants/${this.restaurantId}/tables`
  }

  async ngOnInit(): Promise<void> {
    this.restaurantId = this.route.parent?.snapshot.params['restaurantId'] ?? ''
    const id = this.route.snapshot.paramMap.get('id')
    if (!id || !this.restaurantId) return

    this.isEditing = true
    this.tableId = id
    if (!this.applyTable(id)) {
      this.loading.set(true)
      await this.store.loadByRestaurant(this.restaurantId)
      this.loading.set(false)
      if (!this.applyTable(id)) {
        this.error.set('No se pudo cargar la mesa.')
      }
    }
  }

  private applyTable(id: string): boolean {
    const table = this.store.tables().find(t => t.id === id)
    if (!table) return false
    this.form = { number: table.number, description: table.description, capacity: table.capacity }
    return true
  }

  async onSubmit(): Promise<void> {
    this.error.set(null)
    if (!Number.isInteger(this.form.capacity) || this.form.capacity < 1) {
      this.error.set('La capacidad debe ser un entero mayor que 0.')
      return
    }
    this.loading.set(true)
    try {
      if (this.isEditing && this.tableId) {
        await this.store.update(this.restaurantId, this.tableId, this.form)
      } else {
        await this.store.create(this.restaurantId, this.form)
      }
      this.router.navigate(['/restaurants', this.restaurantId, 'tables'])
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al guardar la mesa.')
    } finally {
      this.loading.set(false)
    }
  }
}

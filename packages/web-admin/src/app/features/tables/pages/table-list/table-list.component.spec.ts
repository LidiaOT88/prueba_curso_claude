import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { importProvidersFrom, signal } from '@angular/core'
import { LucideAngularModule, Plus, Edit, Trash2, Utensils } from 'lucide-angular'
import { TableListComponent } from './table-list.component'
import { TableStore } from '../../store/table.store'
import type { Table } from '../../models/table.model'

function makeTable(overrides: Partial<Table> = {}): Table {
  return {
    id: 't1', restaurantId: 'r1', number: 1, description: 'Ventana', capacity: 4,
    status: 'libre', createdAt: '', updatedAt: '', ...overrides
  }
}

describe('TableListComponent', () => {
  const tables = signal<Table[]>([])
  const store = {
    tables: tables.asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    loadByRestaurant: vi.fn(),
    delete: vi.fn()
  }

  beforeEach(() => {
    tables.set([])
    store.loadByRestaurant.mockReset()
    store.delete.mockReset()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Plus, Edit, Trash2, Utensils })),
        { provide: TableStore, useValue: store },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { restaurantId: 'r1' } } } } }
      ]
    })
  })

  function render() {
    const fixture = TestBed.createComponent(TableListComponent)
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('should load the tables of the restaurant on init', () => {
    render()
    expect(store.loadByRestaurant).toHaveBeenCalledWith('r1')
  })

  it('should show an empty state when there are no tables', () => {
    expect(render().textContent).toContain('No hay mesas')
  })

  it('should render a row per table with number, capacity and status', () => {
    tables.set([makeTable(), makeTable({ id: 't2', number: 2, capacity: 6, status: 'ocupada' })])
    const el = render()
    const rows = el.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[1]!.textContent).toContain('6')
    expect(rows[1]!.textContent).toContain('Ocupada')
  })

  it('should delete a table after confirmation', async () => {
    tables.set([makeTable()])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fixture = TestBed.createComponent(TableListComponent)
    fixture.detectChanges()
    await fixture.componentInstance.onDelete('t1')
    expect(store.delete).toHaveBeenCalledWith('r1', 't1')
  })

  it('should not delete when the user cancels', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const fixture = TestBed.createComponent(TableListComponent)
    fixture.detectChanges()
    await fixture.componentInstance.onDelete('t1')
    expect(store.delete).not.toHaveBeenCalled()
  })
})

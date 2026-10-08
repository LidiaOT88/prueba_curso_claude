import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router, provideRouter } from '@angular/router'
import { importProvidersFrom, signal } from '@angular/core'
import { LucideAngularModule, ChevronLeft } from 'lucide-angular'
import { TableFormComponent } from './table-form.component'
import { TableStore } from '../../store/table.store'
import type { Table } from '../../models/table.model'

describe('TableFormComponent', () => {
  const tables = signal<Table[]>([])
  const store = {
    tables: tables.asReadonly(),
    loadByRestaurant: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    update: vi.fn()
  }
  let routeId: string | null

  beforeEach(() => {
    routeId = null
    tables.set([])
    store.create.mockReset().mockResolvedValue(undefined)
    store.update.mockReset().mockResolvedValue(undefined)
    store.loadByRestaurant.mockClear()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ ChevronLeft })),
        { provide: TableStore, useValue: store },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { params: { restaurantId: 'r1' } } },
            snapshot: { paramMap: { get: () => routeId } }
          }
        }
      ]
    })
  })

  async function create() {
    const fixture = TestBed.createComponent(TableFormComponent)
    fixture.detectChanges()
    await fixture.whenStable()
    return fixture.componentInstance
  }

  it('should create a table and go back to the list', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    const cmp = await create()
    cmp.form = { number: 3, description: 'Terraza', capacity: 6 }
    await cmp.onSubmit()
    expect(store.create).toHaveBeenCalledWith('r1', { number: 3, description: 'Terraza', capacity: 6 })
    expect(navigate).toHaveBeenCalledWith(['/restaurants', 'r1', 'tables'])
  })

  it('should show the API error message and stay on the form', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    store.create.mockRejectedValue({ error: { message: 'A table with this number already exists in the restaurant' } })
    const cmp = await create()
    cmp.form = { number: 1, description: '', capacity: 2 }
    await cmp.onSubmit()
    expect(cmp.error()).toContain('already exists')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('should not submit an invalid capacity', async () => {
    const cmp = await create()
    cmp.form = { number: 1, description: '', capacity: 0 }
    await cmp.onSubmit()
    expect(store.create).not.toHaveBeenCalled()
    expect(cmp.error()).toBe('La capacidad debe ser un entero mayor que 0.')
  })

  it('should load the table in edit mode and update it', async () => {
    routeId = 't1'
    tables.set([{ id: 't1', restaurantId: 'r1', number: 4, description: 'Centro', capacity: 4, status: 'libre', createdAt: '', updatedAt: '' }])
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    const cmp = await create()
    expect(cmp.isEditing).toBe(true)
    expect(cmp.form).toEqual({ number: 4, description: 'Centro', capacity: 4 })
    cmp.form = { ...cmp.form, capacity: 8 }
    await cmp.onSubmit()
    expect(store.update).toHaveBeenCalledWith('r1', 't1', { number: 4, description: 'Centro', capacity: 8 })
  })
})

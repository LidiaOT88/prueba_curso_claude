import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { TableStore } from './table.store'
import { TableService } from '../services/table.service'
import type { Table } from '../models/table.model'

function makeTable(overrides: Partial<Table> = {}): Table {
  return {
    id: 't1', restaurantId: 'r1', number: 1, description: 'A', capacity: 4,
    status: 'libre', createdAt: '', updatedAt: '', ...overrides
  }
}

describe('TableStore', () => {
  let store: TableStore
  let service: { getAll: any; create: any; update: any; delete: any }

  beforeEach(() => {
    service = { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
    TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
    store = TestBed.inject(TableStore)
  })

  it('should load tables of a restaurant', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadByRestaurant('r1')
    expect(store.tables()).toHaveLength(1)
    expect(store.loading()).toBe(false)
    expect(store.error()).toBeNull()
  })

  it('should set an error when loading fails', async () => {
    service.getAll.mockReturnValue(throwError(() => new Error('boom')))
    await store.loadByRestaurant('r1')
    expect(store.error()).toBe('No se pudieron cargar las mesas.')
    expect(store.loading()).toBe(false)
  })

  it('should append a created table', async () => {
    service.create.mockReturnValue(of(makeTable({ id: 't2', number: 2 })))
    await store.create('r1', { number: 2, description: '', capacity: 2 })
    expect(store.tables().map(t => t.id)).toEqual(['t2'])
  })

  it('should replace an updated table', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadByRestaurant('r1')
    service.update.mockReturnValue(of(makeTable({ capacity: 8 })))
    await store.update('r1', 't1', { number: 1, description: 'A', capacity: 8 })
    expect(store.tables()[0]!.capacity).toBe(8)
  })

  it('should remove a deleted table', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadByRestaurant('r1')
    service.delete.mockReturnValue(of(undefined))
    await store.delete('r1', 't1')
    expect(store.tables()).toHaveLength(0)
  })

  it('should propagate API errors on create so the form can show them', async () => {
    service.create.mockReturnValue(throwError(() => new Error('409')))
    await expect(store.create('r1', { number: 1, description: '', capacity: 2 })).rejects.toThrow('409')
  })
})

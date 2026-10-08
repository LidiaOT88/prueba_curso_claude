import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { TableStore } from './table.store'
import { TableService } from '../services/table.service'
import type { Table } from '../models/table.model'

function makeTable(overrides: Partial<Table> = {}): Table {
  return { id: 't1', restaurantId: 'r1', number: 1, description: '', capacity: 4, status: 'libre', createdAt: '', updatedAt: '', ...overrides }
}

describe('TableStore', () => {
  let store: TableStore
  let service: { getAll: any; updateStatus: any }

  beforeEach(() => {
    service = { getAll: vi.fn(), updateStatus: vi.fn() }
    TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
    store = TestBed.inject(TableStore)
  })

  afterEach(() => {
    store.stopPolling()
    vi.useRealTimers()
  })

  it('should load the tables', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadTables('r1')
    expect(store.tables()).toHaveLength(1)
    expect(store.error()).toBeNull()
  })

  it('should keep previous data and set an error when loading fails', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadTables('r1')
    service.getAll.mockReturnValue(throwError(() => new Error('boom')))
    await store.loadTables('r1')
    expect(store.tables()).toHaveLength(1)
    expect(store.error()).toBe('No se pudieron cargar las mesas.')
  })

  it('should update the status of a table in place', async () => {
    service.getAll.mockReturnValue(of([makeTable(), makeTable({ id: 't2', number: 2 })]))
    await store.loadTables('r1')
    service.updateStatus.mockReturnValue(of(makeTable({ status: 'ocupada' })))
    await store.updateStatus('r1', 't1', 'ocupada')
    expect(service.updateStatus).toHaveBeenCalledWith('r1', 't1', 'ocupada')
    expect(store.tables().map(t => t.status)).toEqual(['ocupada', 'libre'])
  })

  it('should set an error when changing status fails', async () => {
    service.getAll.mockReturnValue(of([makeTable()]))
    await store.loadTables('r1')
    service.updateStatus.mockReturnValue(throwError(() => new Error('boom')))
    await store.updateStatus('r1', 't1', 'ocupada')
    expect(store.tables()[0]!.status).toBe('libre')
    expect(store.error()).toBe('No se pudo cambiar el estado de la mesa.')
  })

  it('should poll periodically until stopped', async () => {
    vi.useFakeTimers()
    service.getAll.mockReturnValue(of([]))
    store.startPolling('r1')
    expect(service.getAll).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30000)
    expect(service.getAll).toHaveBeenCalledTimes(2)
    store.stopPolling()
    await vi.advanceTimersByTimeAsync(60000)
    expect(service.getAll).toHaveBeenCalledTimes(2)
  })
})

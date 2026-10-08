import { TestBed } from '@angular/core/testing'
import { TableSelectionStore } from './table-selection.store'
import type { Table } from '../models/table.model'

const table: Table = { id: 't1', restaurantId: 'r1', number: 2, description: 'Centro', capacity: 4, status: 'ocupada' }

describe('TableSelectionStore', () => {
  let store: TableSelectionStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(TableSelectionStore)
  })

  it('should start without a selected table', () => {
    expect(store.table()).toBeNull()
    expect(store.tableFor('r1')).toBeNull()
  })

  it('should return the table only for its own restaurant', () => {
    store.select(table)
    expect(store.tableFor('r1')).toEqual(table)
    expect(store.tableFor('r2')).toBeNull()
  })

  it('should clear the selection', () => {
    store.select(table)
    store.clear()
    expect(store.table()).toBeNull()
  })
})

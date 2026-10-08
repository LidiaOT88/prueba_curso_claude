import { Injectable, signal } from '@angular/core'
import { Table } from '../models/table.model'

@Injectable({ providedIn: 'root' })
export class TableSelectionStore {
  private readonly _table = signal<Table | null>(null)

  readonly table = this._table.asReadonly()

  tableFor(restaurantId: string): Table | null {
    const table = this._table()
    return table && table.restaurantId === restaurantId ? table : null
  }

  select(table: Table): void {
    this._table.set(table)
  }

  clear(): void {
    this._table.set(null)
  }
}

import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Table, TableStatus } from '../models/table.model'
import { environment } from '../../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient)

  private buildUrl(restaurantId: string): string {
    return `${environment.apiUrl}/restaurants/${restaurantId}/tables`
  }

  getAll(restaurantId: string): Observable<Table[]> {
    return this.http.get<Table[]>(this.buildUrl(restaurantId))
  }

  updateStatus(restaurantId: string, tableId: string, status: TableStatus): Observable<Table> {
    return this.http.patch<Table>(`${this.buildUrl(restaurantId)}/${tableId}/status`, { status })
  }
}

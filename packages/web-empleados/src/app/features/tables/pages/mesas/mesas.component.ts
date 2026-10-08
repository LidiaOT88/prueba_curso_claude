import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { TableStore } from '../../store/table.store'
import { OrderStore } from '../../../orders/store/order.store'
import { Table, TableStatus } from '../../models/table.model'

@Component({
  selector: 'app-mesas',
  standalone: true,
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStore)
  readonly tableStore = inject(TableStore)
  readonly orderStore = inject(OrderStore)

  readonly statuses: TableStatus[] = ['libre', 'ocupada', 'reservada']

  private get restaurantId(): string | undefined {
    return this.authStore.user()?.restaurantId ?? undefined
  }

  ngOnInit(): void {
    const restaurantId = this.restaurantId
    if (restaurantId) {
      this.tableStore.startPolling(restaurantId)
      this.orderStore.startPolling(restaurantId)
    }
  }

  ngOnDestroy(): void {
    this.tableStore.stopPolling()
    this.orderStore.stopPolling()
  }

  ordersFor(table: Table) {
    return this.orderStore.orders().filter(order => order.tableId === table.id)
  }

  onStatusChange(table: Table, status: string): void {
    const restaurantId = this.restaurantId
    if (restaurantId) {
      this.tableStore.updateStatus(restaurantId, table.id, status as TableStatus)
    }
  }
}

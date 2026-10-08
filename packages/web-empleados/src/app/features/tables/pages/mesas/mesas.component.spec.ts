import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { MesasComponent } from './mesas.component'
import { TableStore } from '../../store/table.store'
import { OrderStore } from '../../../orders/store/order.store'
import type { Table } from '../../models/table.model'
import type { Order } from '../../../orders/models/order.model'

function makeTable(overrides: Partial<Table> = {}): Table {
  return { id: 't1', restaurantId: 'r1', number: 1, description: 'Ventana', capacity: 4, status: 'libre', createdAt: '', updatedAt: '', ...overrides }
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1', restaurantId: 'r1', tableId: 't1', clientId: 'c1', createdAt: '',
    items: [{ id: 'i1', dishId: 'd1', quantity: 1, notes: null, status: 'preparando', dishName: 'Pizza' }],
    ...overrides
  }
}

describe('MesasComponent', () => {
  const tables = signal<Table[]>([])
  const orders = signal<Order[]>([])
  const error = signal<string | null>(null)
  const tableStore = {
    tables: tables.asReadonly(), error: error.asReadonly(),
    startPolling: vi.fn(), stopPolling: vi.fn(), updateStatus: vi.fn()
  }
  const orderStore = { orders: orders.asReadonly(), startPolling: vi.fn(), stopPolling: vi.fn() }

  beforeEach(() => {
    tables.set([])
    orders.set([])
    error.set(null)
    Object.values(tableStore).forEach(v => typeof v === 'function' && (v as any).mockReset?.())
    Object.values(orderStore).forEach(v => typeof v === 'function' && (v as any).mockReset?.())
    TestBed.configureTestingModule({
      providers: [
        { provide: TableStore, useValue: tableStore },
        { provide: OrderStore, useValue: orderStore },
        { provide: AuthStore, useValue: { user: () => ({ restaurantId: 'r1' }) } }
      ]
    })
  })

  function render() {
    const fixture = TestBed.createComponent(MesasComponent)
    fixture.detectChanges()
    return fixture
  }

  describe('list', () => {
    it('should start polling tables and orders of the restaurant and stop on destroy', () => {
      const fixture = render()
      expect(tableStore.startPolling).toHaveBeenCalledWith('r1')
      expect(orderStore.startPolling).toHaveBeenCalledWith('r1')
      fixture.destroy()
      expect(tableStore.stopPolling).toHaveBeenCalled()
      expect(orderStore.stopPolling).toHaveBeenCalled()
    })

    it('should show a card per table with number, capacity and status', () => {
      tables.set([makeTable(), makeTable({ id: 't2', number: 2, capacity: 6, status: 'reservada' })])
      const cards = render().nativeElement.querySelectorAll('.table-card')
      expect(cards).toHaveLength(2)
      expect(cards[1].textContent).toContain('Mesa 2')
      expect(cards[1].textContent).toContain('6')
      expect(cards[1].querySelector('.badge-reservada')).toBeTruthy()
    })

    it('should show an empty message when there are no tables', () => {
      expect(render().nativeElement.textContent).toContain('No hay mesas')
    })

    it('should show the store error', () => {
      error.set('No se pudieron cargar las mesas.')
      expect(render().nativeElement.textContent).toContain('No se pudieron cargar las mesas.')
    })
  })

  describe('change status', () => {
    it('should ask the store to change the status when the employee picks another one', () => {
      tables.set([makeTable()])
      const fixture = render()
      const select = fixture.nativeElement.querySelector('select.status-select') as HTMLSelectElement
      select.value = 'ocupada'
      select.dispatchEvent(new Event('change'))
      expect(tableStore.updateStatus).toHaveBeenCalledWith('r1', 't1', 'ocupada')
    })
  })

  describe('orders of occupied tables', () => {
    it('should list the active orders of an occupied table with the status of each item', () => {
      tables.set([makeTable({ status: 'ocupada' })])
      orders.set([makeOrder(), makeOrder({ id: 'o2', tableId: 't9' })])
      const card = render().nativeElement.querySelector('.table-card') as HTMLElement
      expect(card.querySelectorAll('.order')).toHaveLength(1)
      expect(card.textContent).toContain('Pizza')
      expect(card.textContent).toContain('preparando')
    })

    it('should say there are no orders yet for an occupied table', () => {
      tables.set([makeTable({ status: 'ocupada' })])
      expect(render().nativeElement.textContent).toContain('Sin pedidos todavía')
    })

    it('should not show orders for tables that are not occupied', () => {
      tables.set([makeTable({ status: 'libre' })])
      orders.set([makeOrder()])
      expect(render().nativeElement.querySelectorAll('.order')).toHaveLength(0)
    })
  })
})

import { TestBed } from '@angular/core/testing'
import { Router, provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { of } from 'rxjs'
import { LucideAngularModule, ShoppingCart } from 'lucide-angular'
import { CartComponent } from './cart.component'
import { CartStore } from '../../core/store/cart.store'
import { OrderService } from '../../core/services/order.service'
import { TableSelectionStore } from '../../core/store/table-selection.store'

describe('CartComponent', () => {
  const orderService = { createOrder: vi.fn() }
  const dish = { id: 'd1', name: 'Pizza', description: null, price: 10, category: 'principal', available: true, restaurantId: 'r1', ingredients: [] }

  beforeEach(() => {
    orderService.createOrder.mockReset().mockReturnValue(of({ id: 'o1' }))
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ ShoppingCart })),
        { provide: OrderService, useValue: orderService }
      ]
    })
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    TestBed.inject(CartStore).addItem(dish, 2)
  })

  it('should send the selected table with the order', () => {
    TestBed.inject(TableSelectionStore).select({ id: 't1', restaurantId: 'r1', number: 1, description: '', capacity: 2, status: 'ocupada' })
    TestBed.createComponent(CartComponent).componentInstance.confirmOrder()
    expect(orderService.createOrder).toHaveBeenCalledWith('r1', [{ dishId: 'd1', quantity: 2, notes: null }], 't1')
  })

  it('should send a null table when none is selected for that restaurant', () => {
    TestBed.createComponent(CartComponent).componentInstance.confirmOrder()
    expect(orderService.createOrder.mock.calls[0]![2]).toBeNull()
  })
})

import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { OrderService } from './order.service'

describe('OrderService', () => {
  let service: OrderService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    service = TestBed.inject(OrderService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should send the table id with the order', () => {
    const items = [{ dishId: 'd1', quantity: 2, notes: null }]
    service.createOrder('r1', items, 't1').subscribe()
    const req = http.expectOne('/api/v1/orders')
    expect(req.request.body).toEqual({ restaurantId: 'r1', tableId: 't1', items })
    req.flush({})
  })
})

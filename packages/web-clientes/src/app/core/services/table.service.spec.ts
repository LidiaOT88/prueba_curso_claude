import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { TableService } from './table.service'

describe('TableService', () => {
  let service: TableService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' }
      ]
    })
    service = TestBed.inject(TableService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should request available tables for the number of people', () => {
    service.getAvailable('r1', 3).subscribe()
    const req = http.expectOne('/api/v1/public/restaurants/r1/tables/available?people=3')
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('should occupy a table', () => {
    service.occupy('r1', 't1').subscribe()
    const req = http.expectOne('/api/v1/restaurants/r1/tables/t1/occupy')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })
})

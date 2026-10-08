import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TableService } from './table.service'
import { environment } from '../../../../environments/environment'

describe('TableService', () => {
  let service: TableService
  let http: HttpTestingController
  const base = `${environment.apiUrl}/restaurants/r1/tables`

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    service = TestBed.inject(TableService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should GET the tables of a restaurant', () => {
    service.getAll('r1').subscribe()
    const req = http.expectOne(base)
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('should PATCH the status of a table', () => {
    service.updateStatus('r1', 't1', 'reservada').subscribe()
    const req = http.expectOne(`${base}/t1/status`)
    expect(req.request.method).toBe('PATCH')
    expect(req.request.body).toEqual({ status: 'reservada' })
    req.flush({})
  })
})

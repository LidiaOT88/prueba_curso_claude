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

  it('should GET all tables of a restaurant', () => {
    service.getAll('r1').subscribe()
    const req = http.expectOne(base)
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('should POST a new table', () => {
    const dto = { number: 1, description: 'A', capacity: 4 }
    service.create('r1', dto).subscribe()
    const req = http.expectOne(base)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(dto)
    req.flush({})
  })

  it('should PUT an existing table', () => {
    const dto = { number: 1, description: 'A', capacity: 4 }
    service.update('r1', 't1', dto).subscribe()
    const req = http.expectOne(`${base}/t1`)
    expect(req.request.method).toBe('PUT')
    req.flush({})
  })

  it('should DELETE a table', () => {
    service.delete('r1', 't1').subscribe()
    const req = http.expectOne(`${base}/t1`)
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})

import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router'
import { tableSelectedGuard } from './table-selected.guard'
import { TableSelectionStore } from '../store/table-selection.store'

function routeFor(id: string): ActivatedRouteSnapshot {
  return { paramMap: { get: () => id } } as unknown as ActivatedRouteSnapshot
}

describe('tableSelectedGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }))

  it('should allow entering the menu when a table of that restaurant is selected', () => {
    TestBed.inject(TableSelectionStore).select({ id: 't1', restaurantId: 'r1', number: 1, description: '', capacity: 2, status: 'ocupada' })
    const result = TestBed.runInInjectionContext(() => tableSelectedGuard(routeFor('r1'), {} as any))
    expect(result).toBe(true)
  })

  it('should redirect to the table selection when there is no table', () => {
    const result = TestBed.runInInjectionContext(() => tableSelectedGuard(routeFor('r1'), {} as any))
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/restaurants', 'r1', 'tables']))
  })

  it('should redirect when the selected table belongs to another restaurant', () => {
    TestBed.inject(TableSelectionStore).select({ id: 't9', restaurantId: 'r2', number: 1, description: '', capacity: 2, status: 'ocupada' })
    const result = TestBed.runInInjectionContext(() => tableSelectedGuard(routeFor('r1'), {} as any))
    expect(result).not.toBe(true)
  })
})

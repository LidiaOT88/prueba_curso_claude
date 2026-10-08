import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { of } from 'rxjs'
import { LucideAngularModule, Utensils } from 'lucide-angular'
import { RestaurantListComponent } from './restaurant-list.component'
import { RestaurantService } from '../../core/services/restaurant.service'

describe('RestaurantListComponent', () => {
  it('should link each restaurant to its table selection step', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Utensils })),
        { provide: RestaurantService, useValue: { getAll: () => of([{ id: 'r1', name: 'La Trattoria', address: 'A', phone: '1', logoUrl: null }]) } }
      ]
    })
    const fixture = TestBed.createComponent(RestaurantListComponent)
    fixture.detectChanges()
    const link = (fixture.nativeElement as HTMLElement).querySelector('a.restaurant-card')
    expect(link?.getAttribute('href')).toBe('/restaurants/r1/tables')
  })
})

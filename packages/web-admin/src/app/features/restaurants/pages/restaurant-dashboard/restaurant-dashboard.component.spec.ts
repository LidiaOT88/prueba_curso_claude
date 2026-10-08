import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { LucideAngularModule, Utensils, Package, Users, LayoutDashboard } from 'lucide-angular'
import { RestaurantDashboardComponent } from './restaurant-dashboard.component'
import { RestaurantStore } from '../../store/restaurant.store'

describe('RestaurantDashboardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Utensils, Package, Users, LayoutDashboard })),
        { provide: RestaurantStore, useValue: { getById: () => ({ name: 'La Trattoria' }) } },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { restaurantId: 'r1' } } } } }
      ]
    })
  })

  it('should offer a card that links to the tables management', () => {
    const fixture = TestBed.createComponent(RestaurantDashboardComponent)
    fixture.detectChanges()
    const cards = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.dash-card'))
    const tables = cards.find(a => a.textContent?.includes('Mesas'))
    expect(tables).toBeTruthy()
  })
})

import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { LucideAngularModule, Flame, Beer, Armchair, LogOut, AlertCircle, Utensils } from 'lucide-angular'
import { AuthService, AuthStore } from '@resttek/web-shared'
import { ShellComponent } from './shell.component'

describe('ShellComponent navigation', () => {
  function render(role: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Flame, Beer, Armchair, LogOut, AlertCircle, Utensils })),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: AuthStore, useValue: { user: () => ({ firstName: 'A', lastName: 'B', restaurantId: 'r1' }), userRole: () => role } }
      ]
    })
    const fixture = TestBed.createComponent(ShellComponent)
    fixture.detectChanges()
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.nav-item')).map(a => a.getAttribute('href'))
  }

  it('should show the Mesas link to waiters', () => {
    expect(render('camarero')).toContain('/mesas')
  })

  it('should show the Mesas link to managers', () => {
    expect(render('manager')).toContain('/mesas')
  })

  it('should not show the Mesas link to cooks', () => {
    expect(render('cocinero')).not.toContain('/mesas')
  })
})

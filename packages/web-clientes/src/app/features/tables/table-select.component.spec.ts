import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router, provideRouter } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TableSelectComponent } from './table-select.component'
import { TableService } from '../../core/services/table.service'
import { TableSelectionStore } from '../../core/store/table-selection.store'
import type { Table } from '../../core/models/table.model'

function makeTable(overrides: Partial<Table> = {}): Table {
  return { id: 't1', restaurantId: 'r1', number: 1, description: 'Ventana', capacity: 4, status: 'libre', ...overrides }
}

describe('TableSelectComponent', () => {
  const service = { getAvailable: vi.fn(), occupy: vi.fn() }

  beforeEach(() => {
    service.getAvailable.mockReset()
    service.occupy.mockReset()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TableService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'r1' } } } }
      ]
    })
  })

  function create() {
    const fixture = TestBed.createComponent(TableSelectComponent)
    fixture.detectChanges()
    return fixture
  }

  describe('search', () => {
    it('should not search until the people count is valid', () => {
      const cmp = create().componentInstance
      cmp.people.set(0)
      cmp.search()
      expect(service.getAvailable).not.toHaveBeenCalled()
    })

    it('should list the available tables for the people count', () => {
      service.getAvailable.mockReturnValue(of([makeTable(), makeTable({ id: 't2', number: 2, capacity: 6 })]))
      const fixture = create()
      fixture.componentInstance.people.set(3)
      fixture.componentInstance.search()
      fixture.detectChanges()
      expect(service.getAvailable).toHaveBeenCalledWith('r1', 3)
      expect(fixture.componentInstance.tables()).toHaveLength(2)
      expect(fixture.nativeElement.querySelectorAll('.table-card')).toHaveLength(2)
    })

    it('should tell the user when there are no tables for that many people', () => {
      service.getAvailable.mockReturnValue(of([]))
      const fixture = create()
      fixture.componentInstance.people.set(12)
      fixture.componentInstance.search()
      fixture.detectChanges()
      expect(fixture.nativeElement.textContent).toContain('No hay mesas disponibles para 12 personas')
    })

    it('should show an error when the request fails', () => {
      service.getAvailable.mockReturnValue(throwError(() => new Error('boom')))
      const fixture = create()
      fixture.componentInstance.search()
      expect(fixture.componentInstance.error()).toBe('No se pudieron cargar las mesas.')
    })

    it('should keep Continuar disabled until a table is selected', () => {
      service.getAvailable.mockReturnValue(of([makeTable()]))
      const fixture = create()
      fixture.componentInstance.search()
      fixture.detectChanges()
      const button = fixture.nativeElement.querySelector('button.continue') as HTMLButtonElement
      expect(button.disabled).toBe(true)
      fixture.componentInstance.choose(makeTable())
      fixture.detectChanges()
      expect(button.disabled).toBe(false)
    })
  })

  describe('continue', () => {
    it('should occupy the table, remember it and go to the menu', async () => {
      const table = makeTable()
      service.occupy.mockReturnValue(of({ ...table, status: 'ocupada' }))
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
      const fixture = create()
      fixture.componentInstance.choose(table)
      fixture.componentInstance.continue()
      expect(service.occupy).toHaveBeenCalledWith('r1', 't1')
      expect(TestBed.inject(TableSelectionStore).tableFor('r1')?.id).toBe('t1')
      expect(navigate).toHaveBeenCalledWith(['/restaurants', 'r1'])
    })

    it('should warn and reload the list when the table was taken (409)', () => {
      service.occupy.mockReturnValue(throwError(() => ({ status: 409 })))
      service.getAvailable.mockReturnValue(of([]))
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
      const fixture = create()
      fixture.componentInstance.people.set(2)
      fixture.componentInstance.choose(makeTable())
      fixture.componentInstance.continue()
      expect(fixture.componentInstance.error()).toBe('La mesa ya no está disponible. Elige otra.')
      expect(fixture.componentInstance.selected()).toBeNull()
      expect(service.getAvailable).toHaveBeenCalledWith('r1', 2)
      expect(navigate).not.toHaveBeenCalled()
    })

    it('should show a generic error for other failures', () => {
      service.occupy.mockReturnValue(throwError(() => ({ status: 500 })))
      const fixture = create()
      fixture.componentInstance.choose(makeTable())
      fixture.componentInstance.continue()
      expect(fixture.componentInstance.error()).toBe('No se pudo ocupar la mesa. Inténtalo de nuevo.')
    })
  })
})

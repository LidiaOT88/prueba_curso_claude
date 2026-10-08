import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { TableSelectionStore } from '../store/table-selection.store'

export const tableSelectedGuard: CanActivateFn = (route) => {
  const restaurantId = route.paramMap.get('id')!
  if (inject(TableSelectionStore).tableFor(restaurantId)) {
    return true
  }
  return inject(Router).createUrlTree(['/restaurants', restaurantId, 'tables'])
}

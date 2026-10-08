# Gestión de mesas — web-admin

| | |
|---|---|
| **Issue** | [#5](https://github.com/LidiaOT88/prueba_curso_claude/issues/5) |
| **Estado** | Borrador |
| **Autor de la issue** | @LidiaOT88 |
| **Fecha** | 2026-10-08 |
| **Etiquetas** | `feature`, `proyecto:web-admin` |

Plan 2 de 4. Depende de la [API](feat-gestion-mesas-api.md) (tareas 1-7 como mínimo).

## 1. Contexto

El administrador debe gestionar las mesas de cada restaurante (CRUD) con id, número, descripción, capacidad y estado.

## 2. Alcance

**Incluido:** listado, alta, edición y borrado de mesas dentro de `restaurants/:restaurantId/tables`; enlace en el menú del restaurante.
**Excluido:** vista de pedidos por mesa (es de empleados); cambios en `web-shared`.

## 3. Comportamiento esperado

### 3.1 Listar
**Dado** un admin en un restaurante **Cuando** abre `Mesas` **Entonces** ve tabla con número, descripción, capacidad y estado, con botones editar/borrar y «Nueva mesa».

### 3.2 Crear / editar
**Cuando** guarda el formulario válido **Entonces** vuelve al listado con la mesa visible. Si el número está repetido muestra el error de la API.

### 3.3 Borrar
**Cuando** confirma borrar **Entonces** desaparece; si está ocupada muestra el error y no se elimina.

## 4. Diseño técnico

Igual que la feature `dishes` en `features/dishes/` (`models`, `services`, `store` con signals + `firstValueFrom`, `pages`, `*.routes.ts` lazy).

| Archivo (`packages/web-admin/src/app`) | Cambio |
|---|---|
| `features/tables/models/table.model.ts` | Nuevo — `Table`, `TableStatus` |
| `features/tables/services/table.service.ts` | Nuevo — HTTP CRUD |
| `features/tables/store/table.store.ts` | Nuevo — signals |
| `features/tables/pages/table-list/*` | Nuevo |
| `features/tables/pages/table-form/*` | Nuevo — alta/edición |
| `features/tables/tables.routes.ts` | Nuevo — `TABLE_ROUTES` |
| `app.routes.ts` | Ruta `tables` bajo `restaurants/:restaurantId` |
| `features/restaurants/pages/restaurant-dashboard/*` o `core/layout/shell.component.html` | Enlace a Mesas (donde estén los de platos/ingredientes) |

## 5. Casos borde

| Situación | Comportamiento |
|---|---|
| Capacidad < 1 | Validación en formulario, no envía |
| Error 409/400 de la API | Mensaje en el formulario/listado |
| Lista vacía | Estado vacío con botón «Nueva mesa» |

## 6. Plan de implementación

Runner: Vitest vía `ng test` (`npm test -w @resttek/web-admin`), añadido a los tres frontends en esta feature (`@angular/build:unit-test`, `vitest` + `jsdom`). Cada tarea: test rojo → mínimo código → verde + build.

- [x] 1. Modelo y `TableService` HTTP. Test: `table.service.spec.ts` (HttpTestingController). Ficheros: `table.model.ts`, `table.service.ts`.
- [x] 2. `TableStore` (load, create, update, remove, error/loading). Test: `table.store.spec.ts`.
- [x] 3. Página `table-list` + `tables.routes.ts` + ruta en `app.routes.ts`. Test: `table-list.component.spec.ts` (carga, vacío, filas, borrado) y build.
- [x] 4. Página `table-form` (crear/editar con validación). Test: `table-form.component.spec.ts`.
- [x] 5. Borrado con confirmación (en `table-list`, ya cubierto por su spec) y enlace «Mesas» en navegación y dashboard. Test: `restaurant-dashboard.component.spec.ts`.

## 7. Criterios de aceptación

- [x] CRUD completo desde la UI.
- [x] Errores de la API visibles.
- [x] `npm run build -w @resttek/web-admin` sin errores.

## 8. Impacto y riesgos

Sin cambios en código existente salvo rutas y navegación. Si se toca `web-shared`, reiniciar dev server.

## 9. Suposiciones y preguntas abiertas

- Suposición: el estado se puede editar también en el formulario del admin.
- Decidido: se añade Vitest a los frontends y la liberación de mesas es manual por empleados.

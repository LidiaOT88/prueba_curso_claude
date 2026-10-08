# Gestión de mesas — API

| | |
|---|---|
| **Issue** | [#5](https://github.com/LidiaOT88/prueba_curso_claude/issues/5) |
| **Estado** | Borrador |
| **Autor de la issue** | @LidiaOT88 |
| **Fecha** | 2026-10-08 |
| **Etiquetas** | `feature`, `proyecto:api` |

Plan 1 de 4. Los otros: [admin](feat-gestion-mesas-admin.md), [clientes](feat-gestion-mesas-clientes.md), [empleados](feat-gestion-mesas-empleados.md). **Este plan va primero**: los frontends dependen de sus endpoints.

## 1. Contexto

Hoy los pedidos tienen `tableId` pero no existe el concepto de mesa. La issue pide mesas por restaurante, con CRUD para admin, cambio de estado para empleados y ocupación automática cuando el cliente elige mesa.

## 2. Alcance

**Incluido**
- Entidad `Table` (id, restaurantId, number, description, capacity, status `libre|ocupada|reservada`).
- CRUD admin, listado y cambio de estado para empleados, consulta de mesas disponibles por nº de personas y ocupación por el cliente.

**Excluido**
- Reservas con fecha/hora (`reservada` es solo un estado manual).
- Liberación automática al terminar el pedido (la hacen los empleados a mano).
- Validar que `tableId` del pedido exista (se puede añadir luego).

## 3. Comportamiento esperado

| Endpoint | Rol | Resultado |
|---|---|---|
| `POST /api/v1/restaurants/:rid/tables` | admin | 201 mesa (estado inicial `libre`) |
| `GET /api/v1/restaurants/:rid/tables` | autenticado | 200 lista ordenada por `number` |
| `PUT /api/v1/restaurants/:rid/tables/:id` | admin | 200 mesa actualizada |
| `DELETE /api/v1/restaurants/:rid/tables/:id` | admin | 204; 400 si está `ocupada` |
| `PATCH /api/v1/restaurants/:rid/tables/:id/status` | admin, empleados | 200 con nuevo estado |
| `GET /api/v1/public/restaurants/:rid/tables/available?people=N` | público | 200 mesas `libre` con `capacity >= N`, por capacidad asc |
| `POST /api/v1/restaurants/:rid/tables/:id/occupy` | autenticado | 200 mesa `ocupada`; 409 si ya no está `libre` |

## 4. Diseño técnico

Estilo **por capas** (como `dish`/`ingredient`): `models` → `repositories` (+`mocks`) → `services` → `controllers` → `routes`. Precedente: `restaurant.*` y `ingredient.routes.ts` (rutas anidadas bajo `:restaurantId`).

| Archivo (`packages/api/src`) | Cambio |
|---|---|
| `models/table.model.ts` | Nuevo — tipo `Table`, `TableStatus`, `normalizeTableStatus` |
| `errors/DomainErrors.ts` | `TableNotFoundError`, `InvalidTableStatusError`, `InvalidTableCapacityError`, `InvalidTableNumberError`, `DuplicatedTableNumberError`, `TableNotAvailableError`, `TableOccupiedError` |
| `contexts/shared/infrastructure/http/errorHandler.ts` | `TableNotFoundError` → 404; `DuplicatedTableNumberError`, `TableNotAvailableError` → 409 |
| `config/database.ts` | `CREATE TABLE IF NOT EXISTS tables` (`UNIQUE(restaurant_id, number)`) |
| `repositories/table.repository.ts` | Nuevo — interfaz + `SqliteTableRepository` |
| `repositories/mocks/MockTableRepository.ts` | Nuevo |
| `services/table.service.ts` | Nuevo — reglas |
| `controllers/table.controller.ts` | Nuevo |
| `routes/table.routes.ts`, `routes/table.public.routes.ts` | Nuevos |
| `app.ts` | Montar rutas |
| `scripts/seed.ts` | Mesas de prueba (idempotente) |
| `docs/dominio/`, `docs/arquitectura/` | Documentar mesas y endpoints |

Ocupar es atómico: `UPDATE tables SET status='ocupada' WHERE id=? AND status='libre'`; si `changes=0` → 409 (evita que dos clientes cojan la misma mesa).

## 5. Casos borde

| Situación | Comportamiento |
|---|---|
| `capacity` < 1 o no entero | 400 `InvalidTableCapacityError` |
| `number` repetido en el restaurante | 409 |
| `people` ausente o < 1 en `available` | 400 |
| Mesa de otro restaurante | 404 |
| Estado fuera de `libre/ocupada/reservada` | 400 |
| Borrar mesa ocupada | 400 `TableOccupiedError` |

## 6. Plan de implementación

Runner: vitest (`npm test` desde la raíz). Cada tarea: test rojo → mínimo código → refactor → suite completa.

- [x] 1. Modelo `Table` + `normalizeTableStatus` y errores de dominio. Test: `models/table.model.test.ts` (estados válidos/ inválidos). Ficheros: `models/table.model.ts`, `errors/DomainErrors.ts`.
- [x] 2. Tabla `tables` + `SqliteTableRepository` con `save`, `findById`, `findByRestaurant`, `delete`. Test: `repositories/table.repository.test.ts` (SQLite en memoria). Ficheros: `config/database.ts`, `repositories/table.repository.ts`.
- [x] 3. Repositorio: `findAvailable(restaurantId, people)` y `occupyIfFree(id)` atómico. Test: mismo fichero (segunda ocupación devuelve `false`). Ficheros: `table.repository.ts`.
- [x] 4. `MockTableRepository` + `TableService.create/update` con validaciones (capacidad, número, duplicado). Test: `services/table.service.test.ts`. Ficheros: mock, `table.service.ts`.
- [x] 5. `TableService.getByRestaurant/getById/delete` (rechaza ocupada, 404). Test: `table.service.test.ts`.
- [x] 6. `TableService.changeStatus`, `listAvailable(people)`, `occupy`. Test: `table.service.test.ts`.
- [x] 7. Controlador + rutas CRUD admin/lectura, montadas en `app.ts`, y mapeo de errores HTTP. Test: `controllers/table.controller.test.ts` (controlador con `req`/`res` simulados y mapeo de `errorHandler`; no hay supertest). Ficheros: controller, `table.routes.ts`, `errorHandler.ts`, `app.ts`.
- [x] 8. Endpoints `PATCH status`, `occupy` y ruta pública `available`. Test: mismo fichero de rutas/controlador (roles 403, 409 al ocupar dos veces).
- [x] 9. Seed de mesas (idempotente) y documentación en `docs/`. Test: ejecutar `npm run seed` dos veces sin error.

## 7. Criterios de aceptación

- [x] Admin hace CRUD de mesas con los campos de la issue.
- [x] Empleados ven y cambian estados; no pueden crear/borrar.
- [x] `available?people=N` solo devuelve mesas libres con capacidad suficiente.
- [x] `occupy` es atómico y devuelve 409 si ya está ocupada.
- [x] `npm test` en verde.

## 8. Impacto y riesgos

- **Retrocompatibilidad:** solo añade tabla y rutas; no cambia las existentes.
- **Seguridad:** `authorize` en escritura; `available` público solo expone número, capacidad y descripción.
- **Operación:** sin variables nuevas.

## 9. Suposiciones y preguntas abiertas

**Suposiciones**
- `occupy` lo puede llamar cualquier usuario autenticado del restaurante (cliente).
- Mesa `reservada` no se ofrece al cliente.

**Preguntas abiertas**
- ¿Hay que liberar la mesa automáticamente cuando todos los ítems del pedido estén `entregado`?

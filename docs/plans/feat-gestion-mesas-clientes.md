# Gestión de mesas — web-clientes

| | |
|---|---|
| **Issue** | [#5](https://github.com/LidiaOT88/prueba_curso_claude/issues/5) |
| **Estado** | Borrador |
| **Autor de la issue** | @LidiaOT88 |
| **Fecha** | 2026-10-08 |
| **Etiquetas** | `feature`, `proyecto:web-clientes` |

Plan 4 de 4. Depende de la [API](feat-gestion-mesas-api.md) (tareas 1-8).

## 1. Contexto

Hoy el cliente elige restaurante y va directo a la carta; el pedido se envía con `tableId: null`. La issue pide: indicar nº de personas → ver mesas disponibles → elegir y continuar (la mesa pasa a ocupada) → carta → enviar pedido a cocina/barra.

## 2. Alcance

**Incluido:** paso de selección de mesa entre lista de restaurantes y carta; enviar `tableId` en el pedido.
**Excluido:** reservas; liberar la mesa desde el cliente.

## 3. Comportamiento esperado

### 3.1 Indicar personas
**Cuando** elige restaurante **Entonces** va a `/restaurants/:id/tables` y se le pide nº de personas (≥ 1).

### 3.2 Elegir mesa
**Cuando** confirma personas **Entonces** ve mesas libres con capacidad suficiente. Con mesa elegida, «Continuar» la ocupa y lleva a la carta.

### 3.3 Mesa tomada por otro
**Cuando** la API responde 409 **Entonces** aviso «La mesa ya no está disponible» y se recarga la lista.

### 3.4 Enviar pedido
**Cuando** envía el carrito **Entonces** el pedido lleva el `tableId` elegido.

## 4. Diseño técnico

Estilo de `web-clientes`: modelos/servicios/store en `core/`, componente suelto en `features/` con `.subscribe()`. Precedente: `cart.store.ts` para guardar estado.

| Archivo (`packages/web-clientes/src/app`) | Cambio |
|---|---|
| `core/models/table.model.ts` | Nuevo |
| `core/services/table.service.ts` | Nuevo — `getAvailable(restaurantId, people)`, `occupy(restaurantId, tableId)` |
| `core/store/table-selection.store.ts` | Nuevo — mesa elegida (signal) |
| `features/tables/table-select.component.ts` | Nuevo |
| `features/restaurants/restaurant-list.component.ts` | Enlace a `/restaurants/:id/tables` |
| `app.routes.ts` | Ruta `restaurants/:id/tables` |
| `features/menu/restaurant-menu.component.ts` | Si no hay mesa elegida, redirigir a selección |
| `core/services/order.service.ts` | `createOrder` envía `tableId` |
| `features/cart/cart.component.ts` | Pasa `tableId` del store |

## 5. Casos borde

| Situación | Comportamiento |
|---|---|
| Sin mesas para ese nº | «No hay mesas disponibles para N personas» |
| Entrar a la carta sin mesa | Redirige a selección |
| Recarga de página | Mesa se pierde del store → vuelve a selección |
| Personas no válido | Botón deshabilitado |

## 6. Plan de implementación

Runner: Vitest vía `ng test` (`npm test -w @resttek/web-clientes`). Cada tarea: test rojo → mínimo código → verde + build.

- [x] 1. Modelo y `TableService` (available, occupy). Test: `table.service.spec.ts`.
- [x] 2. `TableSelectionStore`. Test: `table-selection.store.spec.ts`.
- [x] 3. Componente `table-select`: input personas + lista de mesas + ruta. Test: `table-select.component.spec.ts` (bloque `search`).
- [x] 4. Botón «Continuar»: ocupa, guarda en store, navega a carta; manejo del 409. Test: `table-select.component.spec.ts` (bloque `continue`).
- [x] 5. Enlazar desde la lista de restaurantes y guard `tableSelectedGuard` en la carta. Test: `restaurant-list.component.spec.ts`, `table-selected.guard.spec.ts`.
- [x] 6. `createOrder` y carrito envían `tableId`. Test: `order.service.spec.ts`, `cart.component.spec.ts`.

## 7. Criterios de aceptación

- [x] Flujo personas → mesas → continuar → carta → pedido funciona.
- [x] La mesa elegida queda `ocupada` y el pedido lleva su `tableId`.
- [x] Build sin errores.

## 8. Impacto y riesgos

Cambia el flujo principal del cliente: ya no se llega a la carta sin mesa. Si el cliente abandona tras ocupar, la mesa queda ocupada hasta que un empleado la libere.

## 9. Suposiciones y preguntas abiertas

- Suposición: cada visita ocupa una sola mesa.
- Pregunta: ¿permitir «Cambiar de mesa»? ¿liberar si el cliente sale antes de pedir?

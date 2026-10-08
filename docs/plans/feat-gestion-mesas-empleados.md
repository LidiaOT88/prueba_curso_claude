# Gestión de mesas — web-empleados

| | |
|---|---|
| **Issue** | [#5](https://github.com/LidiaOT88/prueba_curso_claude/issues/5) |
| **Estado** | Borrador |
| **Autor de la issue** | @LidiaOT88 |
| **Fecha** | 2026-10-08 |
| **Etiquetas** | `feature`, `proyecto:web-empleados` |

Plan 3 de 4. Depende de la [API](feat-gestion-mesas-api.md) (tareas 1-8).

## 1. Contexto

Los empleados deben ver el estado de las mesas, cambiarlo, y ver los pedidos de las mesas ocupadas.

## 2. Alcance

**Incluido:** página `Mesas` con tarjetas por mesa, cambio de estado y pedidos activos de las mesas ocupadas.
**Excluido:** crear/borrar mesas; liberar automáticamente.

## 3. Comportamiento esperado

### 3.1 Ver mesas
**Cuando** abre `/mesas` **Entonces** ve cada mesa con número, capacidad, descripción y estado (colores libre/ocupada/reservada).

### 3.2 Cambiar estado
**Cuando** elige otro estado en una mesa **Entonces** se actualiza sin recargar; si falla muestra error.

### 3.3 Pedidos de mesa ocupada
**Dado** una mesa `ocupada` **Entonces** la tarjeta lista los pedidos activos con `tableId` igual a la mesa y el estado de cada ítem (pendiente/preparando/listo/entregado).

## 4. Diseño técnico

Igual que `features/orders` (store con signals, `firstValueFrom`, polling como `OrderStore`). Reutiliza `OrderStore.orders` filtrando por `tableId`.

| Archivo (`packages/web-empleados/src/app`) | Cambio |
|---|---|
| `features/tables/models/table.model.ts` | Nuevo |
| `features/tables/services/table.service.ts` | Nuevo — `getTables`, `updateStatus` |
| `features/tables/store/table.store.ts` | Nuevo — signals + polling |
| `features/tables/pages/mesas/mesas.component.*` | Nuevo |
| `app.routes.ts` | Ruta `mesas` |
| `core/layout/shell.component.{ts,html}` | Enlace «Mesas» (visible según roles, como `canSeeCocina`) |
| `features/orders/models/order.model.ts` | Comprobar que `tableId` esté en `Order` |

## 5. Casos borde

| Situación | Comportamiento |
|---|---|
| Mesa ocupada sin pedidos | «Sin pedidos todavía» |
| Dos empleados cambian a la vez | Gana el último; el polling refresca |
| Fallo de red | Mensaje de error, mantiene datos previos |

## 6. Plan de implementación

Runner: Vitest vía `ng test` (`npm test -w @resttek/web-empleados`). Cada tarea: test rojo → mínimo código → verde + build.

- [x] 1. Modelo y `TableService`. Test: `table.service.spec.ts`. Además `tsconfig.spec.json` pasa de jasmine a vitest/globals.
- [x] 2. `TableStore` (carga, cambio de estado, polling con limpieza). Test: `table.store.spec.ts`.
- [x] 3. Componente `mesas` con listado y estado + ruta + enlace en shell. Test: `mesas.component.spec.ts` (bloque `list`), `shell.component.spec.ts`.
- [x] 4. Selector de cambio de estado conectado al store. Test: `mesas.component.spec.ts` (bloque `change status`).
- [x] 5. Pedidos activos por mesa ocupada (cruce `OrderStore` × `tableId`). Test: `mesas.component.spec.ts` (bloque `orders of occupied tables`).

## 7. Criterios de aceptación

- [x] Se ven y cambian estados.
- [x] Mesas ocupadas muestran sus pedidos y el estado de cada ítem.
- [x] Build sin errores.

## 8. Impacto y riesgos

El polling añade peticiones periódicas; usar el mismo intervalo que `OrderStore` y pararlo en `ngOnDestroy`.

## 9. Suposiciones y preguntas abiertas

- Suposición: todos los roles de empleado ven Mesas; cocina/barra podrían no necesitarlo (confirmar).
- Pregunta: ¿qué roles pueden cambiar estados?

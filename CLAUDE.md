# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Resttek: plataforma de gestión de restaurantes. Monorepo con **npm workspaces** (`packages/*`): una API Node.js (`api`) y cuatro paquetes Angular 21 (`web-admin` :4200, `web-empleados` :4201, `web-clientes` :4202 y la librería `web-shared`). Requiere Node 22+ y npm 10+. La documentación detallada está en `docs/` (arquitectura, dominio, revisiones); el README de la raíz tiene el setup y las credenciales de prueba.

## Comandos (desde la raíz)

```bash
npm install            # instala todos los workspaces
npm run seed           # puebla SQLite (idempotente, INSERT OR IGNORE)
npm run dev:api        # API con tsx watch en :3000 (GET /health)
npm run dev:admin      # también dev:empleados, dev:clientes
npm test               # solo tests de la API (vitest run)
```

- Test único / watch (desde `packages/api`): `npx vitest run src/ruta/Fichero.test.ts`, `npx vitest run -t "nombre del test"`, `npm run test:watch`.
- Los frontends tienen tests con Vitest vía `ng test` (`npm test -w @resttek/web-<nombre>`); no hay lint. El build es `npm run build -w @resttek/web-<nombre>`.
- Credenciales de seed: la contraseña de cada usuario es su propio email (ej. `admin@resttek.com`).

## Arquitectura

### API (`packages/api`, Express 5 + TypeScript, ESM, SQLite)

Conviven **dos estilos**; identifica cuál aplica antes de tocar código:

- **Hexagonal + DDD** solo en `src/contexts/employee/` (`domain` → `application` use cases → `infrastructure` con repositorio SQLite, bcrypt y `http/` con controladores/rutas/`dependencies.ts` para el cableado). `src/contexts/shared/` contiene el value object `Email`, middlewares (`authenticate` JWT, `authorize` por roles) y `errorHandler`.
- **Por capas** en `restaurant`, `dish`, `ingredient` y `order`: carpetas transversales `models/`, `repositories/` (con `mocks/`), `services/`, `controllers/`, `routes/`. El acceso a datos queda detrás de una interfaz de repositorio.

Errores en `src/errors/` (`AppError`, `DomainErrors`). Las tablas se crean en código al arrancar (`src/config/database.ts`); con `NODE_ENV=test` se usa SQLite en memoria. Fichero de BD: `packages/api/resttek.db`. Auth: JWT en `Authorization: Bearer`, rutas bajo `/api/v1`.

### Frontends

Angular 21 con standalone components, signals y **zoneless** (sin zone.js). RxJS solo para HTTP. Estructura distinta por app:

- `web-admin` y `web-empleados`: `features/<feature>/{models,pages,services,store}`, stores con signals que envuelven HTTP con `firstValueFrom`, rutas con lazy loading.
- `web-clientes`: más pequeña; modelos/servicios/store en `core/`, features como componentes sueltos que usan `.subscribe()` directamente; el componente raíz se llama `App`.
- `web-shared` (`@resttek/web-shared`, `main: src/index.ts`, sin build): auth, interceptors y componentes comunes. Es la única dependencia compartida entre frontends. Los cambios en ella no se reflejan en caliente: reinicia el dev server.
- Cada frontend tiene `proxy.conf.json` que redirige `/api` a `http://localhost:3000`; accede por el puerto del frontend, no directo a la API.

## Otros

- `scripts/seed-issues.sh` crea issues de GitHub desde `scripts/issues.json` (requiere `gh` y `jq`; ver `scripts/README.md`).
- `docs/revisiones/` registra auditorías de consistencia entre docs y código; si cambias comportamiento documentado, actualiza `docs/`.
- La documentación y los textos del proyecto están en español; el código en inglés.

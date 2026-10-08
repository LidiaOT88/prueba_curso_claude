# Resumen de Resttek

Guía pensada para un desarrollador Android con poca experiencia en web y backend.

## 1. ¿Qué es Resttek?

Plataforma para gestionar restaurantes. Tiene tres aplicaciones web que hablan con un mismo servidor (API) y una base de datos.

```
 Admin ─┐
 Empleados ─┼──► API (Node.js) ──► SQLite
 Clientes ─┘
```

Es un **monorepo**: un solo repositorio con 5 paquetes. Es parecido a un proyecto Gradle multi-módulo.

| Paquete | Qué es | Equivalente en Android |
| --- | --- | --- |
| `api` | Servidor REST (puerto 3000) | El backend al que llama tu Retrofit |
| `web-admin` | App de administración (puerto 4200) | Una app / flavor |
| `web-empleados` | App de cocina, barra y salón (puerto 4201) | Una app / flavor |
| `web-clientes` | App de pedidos (puerto 4202) | Una app / flavor |
| `web-shared` | Librería común (auth, interceptors, componentes) | Módulo `:core` / `:common` |

## 2. Para qué sirve cada app

### Panel de administración (`web-admin`)
- **Usuarios:** administrador y gerentes.
- **Qué hacen:** ver restaurantes, crear y editar platos con sus ingredientes, gestionar ingredientes y empleados.
- Es la parte de configuración del negocio.

### App de empleados (`web-empleados`)
- **Usuarios:** cocineros, camareros y gerentes.
- **Cocina:** el cocinero ve los pedidos pendientes y marca cada ítem como "Preparando" y luego "Listo".
- **Barra y salón:** el camarero ve los ítems listos y los entrega al cliente.
- Es la parte operativa del día a día.

### App de clientes (`web-clientes`)
- **Usuarios:** clientes finales.
- **Qué hacen:** registrarse, ver restaurantes y su carta, añadir platos al carrito, hacer el pedido y consultar su estado en "Mis Pedidos".

### Flujo completo de un pedido
1. El cliente pide desde `web-clientes`.
2. La cocina lo prepara desde `web-empleados`.
3. El camarero lo entrega desde `web-empleados`.
4. El cliente ve el estado actualizado en `web-clientes`.
5. El admin configura platos e ingredientes desde `web-admin`.

## 3. Tecnologías

### Backend (`packages/api`)
| Tecnología | Para qué |
| --- | --- |
| Node.js + Express 5 | Servidor HTTP y API REST (`/api/v1/...`) |
| TypeScript | JavaScript con tipos (similar a Kotlin) |
| SQLite | Base de datos en un archivo (`resttek.db`), como Room |
| JWT | Token de login enviado en cada petición (Bearer token) |
| bcrypt | Cifrado de contraseñas |
| Vitest + Supertest | Tests unitarios y de integración |

### Frontend (Angular 21)
| Tecnología | Para qué |
| --- | --- |
| Angular | Framework web de Google, el más parecido a Android |
| Standalone components | Componentes sin módulos |
| Signals | Estado reactivo, parecido a `StateFlow` o `mutableStateOf` |
| Zoneless | Sin `zone.js`, detección de cambios moderna |
| RxJS | Solo para peticiones HTTP |
| Lucide | Iconos |
| npm workspaces | Gestión de dependencias del monorepo (como Gradle) |

## 4. Arquitectura

### 4.1 Visión general
- Los frontends **no se comunican entre sí**. Solo usan `web-shared` y llaman a la API.
- En desarrollo, cada frontend tiene un **proxy** que reenvía `/api` a `localhost:3000`. Así se evitan problemas de CORS.
- La autenticación usa **JWT**: el login devuelve un token y el frontend lo guarda en `localStorage`. Un *interceptor* lo añade a cada petición, como en OkHttp. Un *guard* protege las rutas.
- En la API, el middleware `authenticate` valida el token y `authorize` comprueba el rol.

### 4.2 Backend: dos estilos conviven

**Hexagonal + DDD** (solo el contexto `employee`). Es parecido a Clean Architecture en Android:

```
domain/          → entidades, reglas, interfaces (lógica pura)
application/     → casos de uso (LoginUseCase, CreateEmployeeUseCase...)
infrastructure/  → SQLite, bcrypt, controladores y rutas HTTP
```

**Por capas** (`restaurant`, `dish`, `ingredient`, `order`). Es el patrón clásico y más simple:

```
routes → controllers → services → repositories → SQLite
              (models: tipos y normalización)
```

En ambos estilos, el acceso a datos queda detrás de una **interfaz de repositorio**. Eso permite usar *mocks* en los tests.

### 4.3 Frontend
Las tres apps son **feature-based**, pero con estructura distinta:

- **`web-admin` y `web-empleados`:** cada feature tiene `models/`, `pages/`, `services/` y `store/`. El store usa signals y envuelve HTTP con `firstValueFrom`. Es como ViewModel + Repository.
- **`web-clientes`:** más pequeña. Modelos, servicios y store viven en `core/`, y los componentes usan `.subscribe()` directamente.
- Las rutas usan *lazy loading*: cada pantalla se carga cuando hace falta.

## 5. Estándares y buenas prácticas observadas
- API REST con JSON y verbos HTTP.
- Control de acceso por roles: admin, gerente, cocinero, camarero y cliente.
- Patrón repository con interfaces y mocks.
- Arquitectura hexagonal en una parte y por capas en el resto.
- Organización por features en el frontend.
- Inyección de dependencias, guards e interceptors funcionales.
- Tests en la API (Vitest). Los frontends no tienen tests ni lint configurados.
- Documentación en `docs/`, con revisiones de consistencia entre docs y código.

**Ojo:** que convivan dos arquitecturas en la API y tres estructuras en los frontends es una inconsistencia. La propia documentación lo reconoce.

## 6. Cómo arrancarlo

```bash
npm install            # instala todo
npm run seed           # datos de prueba
npm run dev:api        # API en :3000
npm run dev:admin      # o dev:empleados / dev:clientes
npm test               # tests de la API
```

Las credenciales de prueba tienen la contraseña igual al email. Ejemplo: `admin@resttek.com` / `admin@resttek.com`.

## 7. Por dónde empezar a leer
1. `docs/dominio/glosario.md` y `docs/dominio/modelo-datos.md`: conceptos y tablas.
2. `docs/arquitectura/`: arquitectura general, API y frontend.
3. `packages/api/src/contexts/employee/application/LoginUseCase.ts`: ejemplo limpio de caso de uso.
4. `packages/web-clientes/src/app/`: el frontend más pequeño y fácil de seguir.

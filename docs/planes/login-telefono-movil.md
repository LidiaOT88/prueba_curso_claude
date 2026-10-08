# Plan: login con teléfono móvil

## Objetivo

Permitir iniciar sesión con número de teléfono móvil y contraseña, manteniendo el login actual por email.

## Alcance

Incluye:
- Campo `phone` opcional y único en `Employee` (los clientes son empleados con rol `cliente`).
- `POST /api/v1/auth/login` acepta `email` o `phone`.
- `POST /api/v1/auth/register` acepta `phone` opcional.
- Pantalla de login compartida (`web-shared`) con selector email/teléfono; la reutilizan admin, empleados y clientes.

No incluye: SMS/OTP, verificación del teléfono, recuperación de contraseña, rate limiting.

## Estilo aplicable

Contexto `employee`: hexagonal + DDD (`domain` → `application` → `infrastructure`).

## Ficheros a crear o modificar

API (`packages/api/src`):
- `contexts/shared/domain/value-objects/Phone.ts` (nuevo): valida y normaliza a formato internacional sin espacios (`+34600000001`).
- `contexts/employee/domain/Employee.ts`: propiedad `phone: string | null`.
- `contexts/employee/domain/IEmployeeRepository.ts`: método `findByPhone`.
- `contexts/employee/infrastructure/SqliteEmployeeRepository.ts`: columna `phone` en todos los SELECT/INSERT/UPDATE y `findByPhone`.
- `config/database.ts`: columna `phone` en `employees`; `ALTER TABLE ... ADD COLUMN` idempotente y `CREATE UNIQUE INDEX IF NOT EXISTS`, porque no hay sistema de migraciones.
- `contexts/employee/application/LoginUseCase.ts`: recibe un identificador (email o teléfono) y busca por el campo correspondiente; error genérico `InvalidCredentialsError`.
- `contexts/employee/application/RegisterClientUseCase.ts`: teléfono opcional y comprobación de duplicados.
- `errors/DomainErrors.ts` y `contexts/shared/infrastructure/http/errorHandler.ts`: `InvalidPhoneError` (400) y `DuplicatedPhoneError` (409).
- `contexts/employee/infrastructure/http/AuthController.ts`: lee `email` o `phone` del body.
- `contexts/employee/application/mocks/MockDependencies.ts`: `findByPhone` en el repositorio mock.
- `scripts/seed.ts`: teléfonos de prueba para los clientes.

Frontend:
- `web-shared/src/lib/auth/auth.service.ts`: login por teléfono.
- `web-shared/src/lib/components/login/`: selector email/teléfono.
- `web-shared/src/lib/components/register/`: campo teléfono opcional.
- Modelos `LoginResponse` (web-shared) y `employee.model.ts` (web-admin): campo `phone`.

Documentación:
- `docs/` (dominio y arquitectura) y README (credenciales de seed con teléfono).

## Tests a escribir antes del código (TDD, vitest)

1. `Phone`: normaliza `+34 600 000 001` a `+34600000001`.
2. `Phone`: rechaza vacío, letras, demasiado corto y demasiado largo.
3. `Employee`: se crea con teléfono válido y con `null`; rechaza teléfono inválido.
4. `SqliteEmployeeRepository`: guarda y recupera `phone`; `findByPhone` devuelve el empleado o `null`; un teléfono duplicado falla.
5. `Login`: teléfono + contraseña correctos devuelven token y datos del usuario.
6. `Login`: teléfono inexistente o contraseña errónea lanzan `InvalidCredentialsError`.
7. `Login`: el login por email sigue funcionando.
8. `RegisterClient`: registra con teléfono; lanza `DuplicatedPhoneError` si ya existe; sin teléfono sigue funcionando.
9. `database.initialize()`: sobre una BD con la tabla antigua añade `phone` sin perder datos y puede ejecutarse varias veces.
10. Opcional: test HTTP de `POST /auth/login` con `phone`.

Frontends: sin tests; validar con `npm run build -w @resttek/web-admin`, `-w @resttek/web-empleados` y `-w @resttek/web-clientes`.

## Orden de implementación

`Phone` → `Employee` → esquema y `ALTER` → repositorio → `LoginUseCase` → `RegisterClientUseCase` → errores y controlador → seed → frontend → docs.

## Riesgos

- Enumeración de cuentas: mismo error para teléfono o contraseña incorrectos.
- BD existente: SQLite no admite `ADD COLUMN ... UNIQUE`; usar columna más índice único.
- Normalización: guardar y buscar siempre en formato normalizado.
- El teléfono no se verifica; no debe tratarse como factor de confianza.
- Sin rate limiting: el login por teléfono añade otra vía de fuerza bruta.
- `web-shared` no recarga en caliente; reiniciar los dev servers.

## Decisiones pendientes

1. Confirmar teléfono + contraseña (este plan) frente a código por SMS.
2. Prefijo por defecto (+34) u obligatorio siempre.
3. Teléfono solo para clientes o también para empleados.

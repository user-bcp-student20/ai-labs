# Proposal

Referencia: [Issue #24 "HU-01"](https://github.com/user-bcp-student20/ai-labs/issues/24). Hallazgo origen: H-WEB-01 (token de sesión en `localStorage`, estado Pendiente). Evidencia citada en el issue: `web/src/app/services/auth.service.ts:22-38` y `web/src/app/dashboard/dashboard.component.ts:45-46,78-80`.

## Why

El token de sesión y los datos del usuario se leen y escriben directamente desde varios componentes del frontend, lo que dispersa el acceso a la sesión y dificulta revisar, probar y endurecer el manejo de credenciales en el futuro. Centralizar el acceso en `AuthService` reduce esa dispersión sin cambiar el mecanismo de almacenamiento. El riesgo de `localStorage` se mantiene aceptado en este cambio y H-WEB-01 permanece Pendiente.

## What Changes

- `AuthService` pasa a ser el único punto que guarda, lee y limpia el token y los datos del usuario de la sesión.
- El flujo de login delega el guardado de la sesión en `AuthService` tras un inicio de sesión exitoso y navega al dashboard.
- El dashboard obtiene el token a través de `AuthService` y lo pasa a `TasksService` para consultar tareas. Sin token, no consulta tareas y redirige a `/login`.
- El cierre de sesión invoca `AuthService.clearSession()` antes de navegar a `/login`.
- Los componentes dejan de leer y escribir `localStorage` directamente.
- Se mantienen las claves de almacenamiento existentes (`workshop_token`, `workshop_user`) y el mecanismo `localStorage`.

No hay cambios incompatibles (**BREAKING**) previstos para los contratos externos.

## Capabilities

### New Capabilities

- `web-session`: gestión de la sesión del usuario en el frontend web (almacenamiento, lectura y limpieza del token y del usuario, y las reglas de acceso a rutas protegidas que dependen de la sesión).

### Modified Capabilities

Ninguna. No existe una capacidad previa en `openspec/specs/` que cambie sus requisitos.

## Alcance

Dentro de alcance:

- Centralización del acceso a token y usuario en `AuthService` (guardar, leer, limpiar).
- Delegación del guardado tras login exitoso, obtención del token en el dashboard y limpieza en logout.
- Pruebas unitarias para `AuthService`, `LoginComponent` y `DashboardComponent` según la evidencia esperada del issue.

Fuera de alcance:

- Cambiar el mecanismo de almacenamiento (por ejemplo, a cookies `HttpOnly` o memoria).
- Resolver H-WEB-01 o modificar su estado.
- Firma, claims, expiración o validación del token.
- Cambios en el backend `auth/` o `api/`, incluido el contrato de `POST /auth/login` y `GET /api/tasks`.
- Nuevas dependencias.
- Diseño técnico detallado de la implementación (se difiere a una fase posterior).

## Comportamiento que debe preservarse

Según [docs/ENDPOINTS.md](../../../docs/ENDPOINTS.md), que se usa como baseline del contrato observado por el cliente:

- `POST http://localhost:8080/auth/login` con cuerpo `username`, `password`, `client="angular-workshop"`; respuesta exitosa con `token` y `user`.
- `GET http://localhost:8000/api/tasks?owner=<username>` con cabecera `Authorization: Bearer <token>`; respuesta como arreglo de tareas.
- El manejo de mensajes de error existente (`utils/http-error-message.ts`) no cambia.
- Las claves `workshop_token` y `workshop_user` se mantienen para no invalidar sesiones existentes.

Nota: ENDPOINTS.md indica que es un contrato observado por el cliente y no uno confirmado por el backend. Los puntos abiertos (códigos HTTP exactos, campo `user` obligatorio, autorización por `owner`, timeouts, exposición de mensajes de error) no se resuelven en este cambio; el spec debe preservar el comportamiento actual sin asumirlos.

## Impact

- Código afectado (solo frontend, `web/`): `src/app/services/auth.service.ts`, `src/app/login/login.component.ts`, `src/app/dashboard/dashboard.component.ts`, y los componentes de logout correspondientes.
- Pruebas nuevas o ampliadas: `auth.service.spec.ts`, `login.component.spec.ts`, `dashboard.component.spec.ts`, ejecutadas con `npm test` en `web/`.
- APIs externas: sin cambios.
- Dependencias: sin cambios.
- Cobertura objetivo del código modificado: 85% o superior (AGENTS.md).

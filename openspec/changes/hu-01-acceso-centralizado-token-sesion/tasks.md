# Tasks

Componente: `web/`. Comandos desde `web/`. No se modifica `auth/` ni `api/`.

## 1. Línea base

- [x] 1.1 Ejecutar `npx vitest run --coverage` en `web/` y registrar el porcentaje de `auth.service.ts`, `login.component.ts` y `dashboard.component.ts`; si falta el proveedor de cobertura, detenerse y reportarlo sin añadir dependencias.
- [x] 1.2 Ejecutar `npm test` en `web/` y confirmar 6 archivos y 29 pruebas en verde antes de cualquier cambio.

## 2. Pruebas de caracterización (sin cambios de código fuente)

- [x] 2.1 En `auth.service.spec.ts`, caracterizar el comportamiento actual de `getUser()` con `workshop_user` en JSON inválido y verificar que la prueba pasa sobre el código actual.
- [x] 2.2 En `auth.service.spec.ts`, caracterizar `saveSession()` con token vacío y verificar que la prueba pasa sobre el código actual.
- [x] 2.3 En `auth.service.spec.ts`, verificar que `clearSession()` no elimina `workshop_preferences` y que la prueba pasa.
- [x] 2.4 En `dashboard.component.spec.ts`, verificar que con token presente y usuario ausente no hay redirección a `/login` y que la prueba pasa.

## 3. Endurecimiento de sesión (cambio funcional mínimo)

- [x] 3.1 Actualizar la prueba 2.1 al comportamiento aprobado: `getUser()` devuelve `null` y elimina `workshop_user` inválido; verificar que la prueba falla antes del cambio.
- [x] 3.2 Implementar en `auth.service.ts` la validación de `getUser()` con una constante para la clave y sin cambiar la firma; verificar con `npm test` que todas las pruebas pasan.

## 4. Centralización de acceso en componentes

- [x] 4.1 Verificar que `login.component.ts` solo usa `AuthService` para token, usuario y preferencias; si ya cumple, no cambiar código y confirmar con la prueba existente de no uso de `localStorage`.
- [x] 4.2 Verificar que `dashboard.component.ts` solo usa `AuthService` en `ngOnInit()` y `logout()`; confirmar con `npm test`.

## 5. Validación

- [x] 5.1 Ejecutar `npm test` en `web/` y confirmar que todas las pruebas pasan.
- [x] 5.2 Ejecutar `npx vitest run --coverage` y confirmar 85% o más en el código modificado; si no se cumple, añadir pruebas hasta alcanzarlo.
- [x] 5.3 Ejecutar `npm run build` en `web/` y confirmar salida con código 0.
- [x] 5.4 Buscar `localStorage` en `web/src` y confirmar que solo aparece en `auth.service.ts` y en specs.
- [x] 5.5 Confirmar que `/auth/login` y `/api/tasks` no cambiaron en `auth.service.ts` ni `tasks.service.ts`.

## Workflow follow-up

- Revisión humana del diff y del reporte de cobertura antes de integrar.
- Sin push, tags ni PR durante el Día 1.
- Archivar el cambio tras la revisión.

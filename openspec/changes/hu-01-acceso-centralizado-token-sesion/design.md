# Diseño: acceso centralizado a token y sesión (web)

Componente: `web/` (Angular). Hallazgo H-WEB-01. Issue #24.
Fuentes: `proposal.md` y `specs/web-session/spec.md` de este cambio.

## 1. Contexto técnico

Estado verificado en el código actual (sin modificaciones):

- `web/src/app/services/auth.service.ts` ya centraliza el acceso a sesión: `saveSession(response)`, `getToken()`, `getUser()`, `clearSession()`, además de `getPreferences()`, `savePreferences()` y `login(credentials)` (axios, `timeout: 5000`). Las claves `workshop_token`, `workshop_user` y `workshop_preferences` están definidas como constantes en ese servicio.
- Búsqueda de `localStorage` en `web/src/**`: solo aparece en `auth.service.ts` (y en los specs). Ni `login.component.ts` ni `dashboard.component.ts` lo usan directamente.
- `login.component.ts` llama `authService.login`, valida `response?.token`, invoca `saveSession` y `savePreferences`, y navega a `/dashboard`. Ante error no guarda sesión.
- `dashboard.component.ts` en `ngOnInit()` lee `getToken()` y `getUser()`; sin token navega a `/login`; con token llama `tasksService.listTasks(user?.username || '', token)`. `logout()` llama `clearSession()` y navega a `/login`.
- `tasks.service.ts` hace `GET ${environment.tasksUrl}?owner=<owner>` con cabecera `Authorization: Bearer <token>`. No accede a almacenamiento.
- Pruebas existentes: `auth.service.spec.ts`, `login.component.spec.ts`, `dashboard.component.spec.ts` ya son pruebas de caracterización y cubren login exitoso, token vacío, error, timeout, redirección sin token, carga/filtrado de tareas, logout y la regla "sin acceso directo a localStorage en componentes".
- Línea base ejecutada en esta fase con `npm test` en `web/`: 6 archivos de prueba, 29 pruebas, todas en verde. No se ejecutó cobertura (el script `test` es `vitest run` sin cobertura), por lo que no hay porcentaje medido para los archivos afectados.

Conclusión: la mayor parte del comportamiento de la HU ya existe. El trabajo real es cerrar brechas puntuales y verificar la meta de cobertura, no rediseñar la capa de sesión.

## 2. Objetivos

- Mantener un único punto de acceso a token, usuario y preferencias: `AuthService`.
- Verificar con pruebas que login, dashboard y logout usan solo ese servicio.
- Cerrar brechas de caracterización identificadas en la sección 6 antes de cualquier cambio de comportamiento.
- Medir cobertura de los archivos modificados y alcanzar 85% o más.

## 3. No objetivos

- No cambiar el contrato de `POST /auth/login` ni de `GET /api/tasks`.
- No cambiar las claves de `localStorage` ni el formato del valor (`workshop_user` sigue siendo JSON).
- No migrar a cookies, memoria, `sessionStorage` ni a un store global.
- No añadir validación de expiración, firma, claims ni refresco de token (H-WEB-01 sigue Pendiente en cuanto a seguridad del token).
- No modificar el backend ni `auth/` o `api/`.
- No renombrar métodos públicos del servicio en esta HU.
- No crear `tasks.md` en esta fase.

## 4. Contratos protegidos

| Contrato | Detalle que debe conservarse |
|---|---|
| `POST {authUrl}/auth/login` | Body `{ username, password, client: 'angular-workshop' }`, timeout 5000 ms, respuesta `{ token, user }`. |
| `GET {tasksUrl}?owner=<username>` | Cabecera `Authorization: Bearer <token>`. Owner vacío si no hay usuario guardado. |
| Claves de almacenamiento | `workshop_token` (string), `workshop_user` (JSON), `workshop_preferences` (JSON). |
| Mensajes de error de login | `No se pudo autenticar a <usuario>.` con detalle vía `getHttpErrorMessage`; `El backend respondió sin token.`. |
| Comportamiento de navegación | Éxito en login navega a `/dashboard`; sin token en dashboard o logout navega a `/login`. |
| Métodos públicos de `AuthService` | `saveSession`, `getToken`, `getUser`, `clearSession`, `login`, `getPreferences`, `savePreferences`. |

## 5. Componentes afectados

| Archivo | Impacto previsto |
|---|---|
| `web/src/app/services/auth.service.ts` | Revisión sin cambio de contrato. Posible endurecimiento de `getUser()` ante JSON inválido (ver sección 6). |
| `web/src/app/login/login.component.ts` | Sin cambio funcional previsto. Ya usa el servicio. |
| `web/src/app/dashboard/dashboard.component.ts` | Sin cambio funcional previsto. Ya usa el servicio. |
| `web/src/app/services/tasks.service.ts` | Sin cambios. |
| Specs de `services`, `login`, `dashboard` | Añadir casos de caracterización faltantes. |

Nota: el proposal menciona "componentes de logout" en plural; en el código solo existe logout en `DashboardComponent`. Se trata como un único punto de logout.

## 6. Decisiones técnicas y alternativas

1. **Mantener `localStorage` con las mismas claves.** Alternativas: cookies `HttpOnly` (requieren backend, fuera de alcance), memoria (se pierde al recargar), `sessionStorage` (cambia la persistencia). Se descartan por alcance y por la regla de no cambiar el contrato de almacenamiento.
2. **Extender `AuthService` existente en lugar de crear un `SessionService` nuevo.** El servicio ya cumple el rol; crear otro duplicaría responsabilidades y aumentaría el diff.
3. **Conservar los nombres actuales (`saveSession`, `clearSession`).** La spec usa términos genéricos de "guardar". Se decide mapear la spec a los nombres existentes para evitar renombrado innecesario.
4. **`workshop_preferences` queda dentro de `AuthService` y fuera del alcance de token/usuario.** Se mantiene su acceso en el mismo servicio para que ningún componente toque `localStorage`, pero su contrato no cambia.
5. **No añadir validación de expiración ni firma.** Son parte de H-WEB-01 completo, no de esta HU.

## 7. Pruebas de caracterización necesarias antes de modificar comportamiento

Ya existen y deben mantenerse en verde: login exitoso con guardado de sesión, login sin token, login con error de backend, error de red, timeout, dashboard sin token, carga/filtrado/orden de tareas, error de backend en tareas, 401 sin limpiar sesión, logout, y la regla de no usar `localStorage` en componentes.

Brechas a cubrir antes de cualquier cambio:

- `getUser()` con JSON malformado en `workshop_user`: decisión aprobada: devuelve `null` y elimina la clave `workshop_user` inválida. La prueba de caracterización se actualiza a ese comportamiento antes del cambio.
- `saveSession()` con token vacío: fijar el comportamiento actual del servicio (la validación hoy está en el componente).
- Dashboard con token presente pero usuario ausente: ya cubierto por la prueba de owner vacío; confirmar que no redirige.
- Medición de cobertura: ejecutar `vitest run --coverage` (o el comando equivalente ya configurado en `vitest.config.ts`) y registrar el porcentaje de los tres archivos antes de tocar código. Si no hay proveedor de cobertura configurado, no se añade dependencia nueva sin justificación; se reporta como pendiente.

## 8. Estrategia incremental

1. Medir línea base de cobertura y registrar el resultado (sin cambios de código).
2. Añadir las pruebas de brecha de la sección 7 y confirmar que pasan sobre el código actual.
3. Si se decide endurecer `getUser()`, hacerlo en un cambio separado y revisable, con su prueba ya existente.
4. Verificar que login y dashboard no tengan acceso directo a almacenamiento (ya cumplido; mantener la prueba).
5. Revisión humana del diff y del porcentaje de cobertura. Sin push ni PR en el Día 1.

Cada paso debe poder revisarse de forma independiente.

## 9. Riesgos y trade-offs

- **XSS y token en `localStorage`:** el token sigue accesible desde JavaScript. Riesgo aceptado por alcance; se documenta como limitación de H-WEB-01.
- **Líneas citadas en el issue #24 no coinciden con el código actual.** Antes de citar líneas, verificar contra el archivo vigente.
- **Dependencia del comportamiento de `NgZone.run` en el dashboard:** un cambio de carga de tareas podría alterar la detección de cambios. Mantener la prueba de `detectChanges`.
- **Cobertura no medida:** sin un número base no se puede demostrar el 85%. Riesgo de reportar un cumplimiento no verificado.
- **Sobrealcance:** tentación de rediseñar el flujo completo. Se evita manteniendo los cambios en los archivos de la sección 5.

## 10. Rollback

- Cada paso es un commit independiente; revertir el commit correspondiente restablece el comportamiento anterior.
- Las claves de `localStorage` no cambian, por lo que no hay migración de datos ni sesiones huérfanas.
- Si el endurecimiento de `getUser()` causa regresiones, revertir solo ese cambio; las pruebas de caracterización permanecen.

## 11. Puntos abiertos

- Confirmar si la cobertura debe medirse con un script específico (el `test` actual no la genera).
- Confirmar si `workshop_preferences` debe permanecer en el alcance de esta HU o pasar a otra.
- Manejo de JSON malformado en `workshop_user`: resuelto. `getUser()` devuelve `null` y elimina la clave inválida.

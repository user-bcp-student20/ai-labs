# Evidencia de pruebas

## Web

**Componente e IDs:** web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06 y H-WEB-07. Esta ejecucion amplia la caracterizacion de login/tareas relacionada principalmente con H-WEB-06. No modifica contratos ni codigo de produccion. Los tests de componentes y servicios usan mocks; no se conectaron a los servicios reales.

Los comportamientos y ejemplos se limitan al contrato observado en `docs/ENDPOINTS.md`. Los caminos felices, validaciones vacias, respuesta sin token, ausencia de sesion y carga/filtrado de tareas ya estaban cubiertos. En esta ejecucion se añadieron casos de servicio no disponible, timeout de login, token invalido, rechazo por timeout de tareas y body de exito que no es un arreglo.

### Casos

| flujo | caso | tipo | resultado esperado |
|---|---|---|---|
| `POST /auth/login` | Credenciales validas | Camino feliz | Envia username/password/client, guarda token/usuario/preferencias y navega a `/dashboard`. |
| `POST /auth/login` | Username vacio o contraseña vacia | Borde | Muestra la validacion correspondiente; no llama al servicio. |
| `POST /auth/login` | Respuesta sin token | Borde | Muestra `El backend respondió sin token.`; no guarda sesion ni navega. |
| `POST /auth/login` | Servicio de autenticacion no disponible | Error | Muestra el titulo de fallo y el mensaje de red; limpia `busy`, no guarda sesion ni navega. |
| `POST /auth/login` | Timeout configurado de 5000 ms | Error | Muestra el titulo de fallo y el mensaje de timeout; limpia `busy`, no guarda sesion ni navega. |
| `POST /auth/login` | Rechazo HTTP con `response.data.message` | Error | Muestra el detalle de autenticacion recibido y limpia `busy`. |
| `GET /api/tasks` | Token ausente | Borde | No consulta tareas y navega a `/login`. |
| `GET /api/tasks` | Tareas validas | Camino feliz | Consulta con `owner` y Bearer, oculta archivadas, etiqueta/ordena las visibles y termina la carga. |
| `GET /api/tasks` | Token invalido (401 con `detail`) | Error | Muestra el `detail`, termina la carga y no limpia sesion ni redirige automaticamente. |
| `GET /api/tasks` | La promesa de consulta rechaza por timeout | Error | Muestra el mensaje recibido y termina la carga. El cliente no configura timeout para este endpoint; el test simula el rechazo. |
| `GET /api/tasks` | Respuesta 2xx cuyo body no es un arreglo | Error de respuesta inesperada | El error de `.filter()` se captura, aparece en el estado de error y termina la carga. El mensaje interno que se presenta es comportamiento actual, no un contrato aprobado. |
| `GET /api/tasks` | Usuario local ausente con token presente | Borde | Envia `owner=` y conserva `user` como nulo. |

### Codigo de los tests añadidos

Estos tests se incorporaron a las specs existentes. Las pruebas completas de camino feliz y borde permanecen en `web/src/app/login/login.component.spec.ts` y `web/src/app/dashboard/dashboard.component.spec.ts`.

```typescript
it('shows a network error when the authentication service is unavailable', async () => {
  vi.mocked(authService.login).mockRejectedValueOnce(new Error('Network Error'));
  const component = new LoginComponent(authService, router);
  component.username = 'student';
  component.password = 'Workshop123!';

  await component.login();

  expect(component.messageTitle).toBe('No se pudo autenticar a student.');
  expect(component.messageDetail).toBe('Network Error');
  expect(component.busy).toBe(false);
  expect(authService.saveSession).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});

it('shows the timeout message and clears the busy state', async () => {
  vi.mocked(authService.login).mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));
  const component = new LoginComponent(authService, router);
  component.username = 'student';
  component.password = 'Workshop123!';

  await component.login();

  expect(component.messageTitle).toBe('No se pudo autenticar a student.');
  expect(component.messageDetail).toBe('timeout of 5000ms exceeded');
  expect(component.busy).toBe(false);
  expect(authService.saveSession).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});
```

```typescript
it('shows the invalid-token error without retrying or clearing the session', async () => {
  vi.mocked(tasksService.listTasks).mockRejectedValueOnce({
    response: { status: 401, data: { detail: 'Token invalido' } }
  });
  const { component, router } = createComponent(authService, tasksService);

  await component.ngOnInit();

  expect(component.error).toBe('Token invalido');
  expect(component.loading).toBe(false);
  expect(authService.clearSession).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});

it('shows a request timeout and stops loading tasks', async () => {
  vi.mocked(tasksService.listTasks).mockRejectedValueOnce(new Error('timeout waiting for tasks'));
  const { component, changeDetector } = createComponent(authService, tasksService);

  await component.ngOnInit();

  expect(component.error).toBe('timeout waiting for tasks');
  expect(component.loading).toBe(false);
  expect(changeDetector.detectChanges).toHaveBeenCalled();
});

it('shows the thrown error when a successful response is not an array', async () => {
  vi.mocked(tasksService.listTasks).mockResolvedValueOnce({ tasks: [] } as never);
  const { component } = createComponent(authService, tasksService);

  await component.ngOnInit();

  expect(component.error.toLowerCase()).toContain('filter');
  expect(component.loading).toBe(false);
});
```

### Ejecuciones

Fecha de ejecucion: 2026-10-26. Directorio de trabajo para todos los comandos: `web/`.

| componente e IDs | comando | codigo de salida | resultado |
|---|---|---:|---|
| web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npx vitest run src/app/login/login.component.spec.ts src/app/dashboard/dashboard.component.spec.ts` | 0 | PASS: 2 archivos, 16 tests. |
| web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npm test` | 0 | PASS: 6 archivos, 27 tests. |
| web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npm run test:coverage` | 0 | PASS: 6 archivos, 27 tests. Vitest 3.2.4 con provider V8 produjo el reporte de texto y `web/coverage/coverage-summary.json`. |

### Cobertura

Metodo: Vitest 3.2.4 con `@vitest/coverage-v8`, ejecutado mediante `npm run test:coverage`. Se sumaron los campos `lines` de `coverage-summary.json` para los archivos de logica/configuracion incluidos en el flujo; tests y modelos TypeScript sin codigo ejecutable no se cuentan como lineas instrumentables.

| alcance | lineas cubiertas / instrumentables | cobertura |
|---|---:|---:|
| Logica/configuracion de login y tareas: `login.component.ts`, `dashboard.component.ts`, `auth.service.ts`, `tasks.service.ts`, `http-error-message.ts`, `legacy-format.ts`, `environment.ts` | 209 / 215 | 97.21% |
| Global del proyecto web, todos los archivos instrumentables incluidos por Vitest | 209 / 243 | 86.00% |

La cobertura global adicional fue: statements 209/243 (86.00%), ramas 67/74 (90.54%) y funciones 19/22 (86.36%). La cobertura de flujo indicada arriba es una suma selectiva de archivos enumerados, no el porcentaje global ni un gate configurado por Vitest. En este incremento solo cambiaron specs; no se modifico codigo de produccion.

### Fallos

- Ninguna de las tres ejecuciones de esta evidencia fallo; todas terminaron con codigo 0.
- Las pruebas de red, timeout y token invalido son unitarias con promesas/respuestas simuladas. No prueban disponibilidad real de auth/API ni el reloj de Axios.
- `GET /api/tasks` no configura timeout. El caso de timeout prueba como la UI maneja una promesa rechazada, no que el cliente interrumpa una solicitud lenta.

### Pendientes

- H-WEB-09 sigue Pendiente en `HALLAZGOS.md`: `AuthService.getUser()` puede lanzar al parsear JSON corrupto, antes de que el `try` de Dashboard capture el error (`web/src/app/services/auth.service.ts:31-33`, `web/src/app/dashboard/dashboard.component.ts:45-52`). No se escribio un test que espere que la UI trate esto correctamente porque el comportamiento esperado aun no esta acordado; no se hizo pasar un test adaptandolo al defecto.
- La respuesta de login con token pero `user` ausente/mal formado esta señalada en `docs/ENDPOINTS.md` como contrato no validado. No se declara cubierta ni se atribuye una politica de UI que el codigo no implementa.
- No se probaron respuestas ni codigos de estado contra servicios reales.

### Pruebas propuestas

1. Tras decidir la politica para JSON de usuario corrupto, agregar una prueba de regresion para H-WEB-09 que exija esa politica; actualmente `getUser()` puede rechazar antes del `try` de Dashboard.
2. Cuando haya servicios de laboratorio disponibles, ejecutar una prueba de integracion que confirme el status/body real de login, la respuesta real de tareas y el rechazo real de un token invalido. Mantener separados esos resultados de los mocks unitarios.

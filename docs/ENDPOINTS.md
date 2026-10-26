# Contratos externos de web

## Alcance y estado del contrato

Este documento describe lo que consume la interfaz Angular, segun el codigo y los tests del frontend. `docs/ENDPOINTS.md` no existia antes de este registro. El contrato observado es el del cliente; no hay aqui evidencia de un contrato acordado y confirmado con los servicios backend. Los ejemplos son fixtures comprobados por los tests, no capturas de respuestas reales. El cliente no valida un codigo HTTP exacto ni todos los campos de las respuestas en runtime. Los tipos TypeScript expresan expectativas del frontend, no sustituyen un contrato confirmado entre servicios.

Las URLs observadas estan en `web/src/environments/environment.ts:1-4`. Los endpoints usan HTTP en localhost para este laboratorio.

## POST /auth/login

### 1. Quien lo llama

`LoginComponent.login()` llama a `AuthService.login()`. El servicio ejecuta el POST y devuelve `response.data`; el componente guarda la sesion y preferencias y navega a `/dashboard` solo si la respuesta contiene un token. Referencias: `web/src/app/login/login.component.ts:28-53`, `web/src/app/services/auth.service.ts:17-19`.

### 2. Que envia

URL: `http://localhost:8080/auth/login`  
Metodo: `POST`  
Timeout configurado: 5000 ms.  
Query params: ninguno.  
Body: objeto `LoginRequest`, definido en `web/src/app/models/auth.models.ts:1-5`.

| Campo | Tipo esperado por TypeScript | Uso observado |
|---|---|---|
| `username` | `string` | Usuario escrito en el login. |
| `password` | `string` | Contraseña escrita en el login. |
| `client` | `string` | Valor fijo `angular-workshop`. |

| Header | Valor / comportamiento |
|---|---|
| `Authorization` | No se envia en el login. |
| `Content-Type` | El servicio no configura headers manualmente; entrega a Axios un objeto JavaScript como body. El header de cable no se afirma como parte de un contrato probado por el frontend. |

Ejemplo de body basado en `web/src/app/services/auth.service.spec.ts:43-50` y `web/src/app/login/login.component.spec.ts:45-58`:

```json
{
  "username": "student",
  "password": "Workshop123!",
  "client": "angular-workshop"
}
```

### 3. Que espera recibir en exito

Axios resuelve normalmente respuestas 2xx. El servicio no inspecciona `response.status`; solo devuelve `response.data`. El codigo exacto esperado por el backend no esta especificado ni comprobado por estos tests.

| Campo de `response.data` | Tipo TypeScript | Requerido por el flujo de UI |
|---|---|---|
| `token` | `string` | Si falta o esta vacio, el login muestra un mensaje y no guarda sesion ni navega. |
| `user` | `AuthenticatedUser` | La interfaz declara `username`, `displayName` y `role`, todos `string`; el cliente no comprueba esos campos en runtime antes de guardar el objeto. |

Ejemplo basado en el fixture de `web/src/app/services/auth.service.spec.ts:41-42`:

```json
{
  "token": "test-token",
  "user": {
    "username": "student",
    "displayName": "Student",
    "role": "STUDENT"
  }
}
```

El ejemplo muestra el body de respuesta esperado por el servicio; no acredita que un backend real lo haya devuelto ni fija un codigo HTTP concreto.

### 4. Como reacciona ante errores

| Situacion | Reaccion observable de la UI |
|---|---|
| Usuario o contraseña vacios | No se envia la solicitud. El login muestra `Ingrese un usuario.` o `Ingrese una contraseña.`. |
| Credenciales rechazadas u otro HTTP no 2xx | Axios rechaza la llamada. El titulo es `No se pudo autenticar a <username>.`; el detalle usa `response.data.message` si es string no vacio, luego `error.message`, y finalmente `Error desconocido`. El boton vuelve a estado no ocupado. El cliente no exige un status especifico para credenciales invalidas. |
| Timeout | Axios esta configurado con 5000 ms. Si rechaza por timeout, se usa la misma ruta de error anterior; no hay mensaje especial para timeout. |
| Respuesta exitosa sin token | Se muestra `El backend respondió sin token.`; no se guarda la sesion ni se navega. El estado ocupado se limpia. |
| Respuesta con token pero con `user` ausente o mal formado | No hay validacion runtime de `user`: el componente llama a `saveSession()` y sigue hacia `/dashboard`. Es una pregunta abierta de contrato. |
| Fallo de red u otro error sin `response.data.message` | Se muestra `error.message` si existe; si no, `Error desconocido`. |

La seleccion del detalle se implementa en `web/src/app/utils/http-error-message.ts:7-25`; el flujo de login esta en `web/src/app/login/login.component.ts:28-62`.

### 5. Notas de seguridad

- La contraseña se envia en el body; el frontend no adjunta token de autorizacion a este endpoint.
- `AuthService` centraliza token, usuario y preferencias, pero token y usuario siguen en `localStorage` bajo `workshop_token` y `workshop_user` (`web/src/app/services/auth.service.ts:6-8,22-34`). JavaScript del mismo origen puede leer el token; el frontend no elimina ese riesgo.
- Los mensajes se representan mediante interpolacion Angular (`web/src/app/login/login.component.html:39-43`); no se usa `[innerHTML]` para el texto dinamico.
- El error `message` que devuelve el backend puede aparecer en pantalla. Queda por confirmar que el servicio no incluya detalles internos sensibles en ese campo.
- La URL esta configurada para localhost y usa HTTP (`web/src/environments/environment.ts:1-4`); no se documenta aqui un endpoint de produccion.

## GET /api/tasks

### 1. Quien lo llama

`DashboardComponent.ngOnInit()` obtiene el token y usuario de `AuthService` y llama a `TasksService.listTasks(owner, token)`. El servicio retorna `response.data`; el componente filtra tareas `ARCHIVED`, calcula etiquetas, ordena por prioridad y las presenta. Referencias: `web/src/app/dashboard/dashboard.component.ts:45-69`, `web/src/app/services/tasks.service.ts:7-14`.

### 2. Que envia

URL base: `http://localhost:8000/api/tasks`  
Metodo: `GET`  
Timeout configurado por la aplicacion: ninguno.  
Body: ninguno.

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <token>` obtenido mediante `AuthService.getToken()`. |

| Query param | Tipo esperado | Valor |
|---|---|---|
| `owner` | `string` | `user.username`; si no hay usuario guardado, el componente pasa una cadena vacia. El servicio concatena el valor directamente a la URL, sin codificacion explicita. |

Ejemplo basado en `web/src/app/services/tasks.service.spec.ts:22-29`:

```http
GET /api/tasks?owner=student HTTP/1.1
Host: localhost:8000
Authorization: Bearer test-token
```

El test verifica la URL completa `http://localhost:8000/api/tasks?owner=student` y el header Bearer.

### 3. Que espera recibir en exito

Axios resuelve normalmente respuestas 2xx. `TasksService` no inspecciona `response.status` y entrega directamente `response.data`. El dashboard espera que esos datos permitan llamar a `.filter()`, es decir, que sean un arreglo. El codigo HTTP exacto no esta fijado por el frontend.

| Campo por tarea | Tipo en `Task` | Uso observado |
|---|---|---|
| `id` | `number`, opcional | Identificador tipado; no se usa para transformar la respuesta. |
| `title` | `string`, opcional | Titulo mostrado. |
| `description` | `string`, opcional | Descripcion mostrada. |
| `status` | `string`, opcional | Se filtra `ARCHIVED` y se convierte a etiqueta de estado. |
| `priority` | `string`, opcional | Se usa para ordenar y generar etiqueta. |
| `owner` | `string`, opcional | Se usa para generar etiqueta; el query `owner` proviene del usuario almacenado. |
| `label` | `string`, opcional | Lo calcula el frontend para tareas visibles; no es necesario que venga en la respuesta. |

La interfaz esta en `web/src/app/models/task.model.ts:1-9`. Ejemplo de elemento basado en `web/src/app/services/tasks.service.spec.ts:21`:

```json
[
  {
    "id": 1,
    "title": "Requirement",
    "status": "TODO",
    "priority": "HIGH",
    "owner": "student"
  }
]
```

### 4. Como reacciona ante errores

| Situacion | Reaccion observable de la UI |
|---|---|
| No hay token local | No se envia GET; Dashboard navega a `/login`. |
| Token invalido o respuesta HTTP no 2xx | Axios rechaza la llamada. Dashboard muestra `response.data.detail` si es texto; si falta, usa `error.message`; si tampoco existe, `No se pudo cargar el dashboard`. Detiene el indicador de carga. No limpia la sesion ni redirige automaticamente. El frontend no verifica que el status sea especificamente 401. |
| Timeout o error de red | `TasksService` no configura timeout; si Axios u otra capa rechaza la promesa, se aplica el mismo mensaje de error y se detiene la carga. No hay un mensaje separado para timeout. Si la solicitud queda pendiente, el componente no tiene cancelacion ni limite de tiempo propio y sigue mostrando carga. |
| Respuesta 2xx con body que no es un arreglo | No hay validacion de esquema. La llamada a `.filter()` falla dentro del `try`; el `catch` muestra el `error.message` si esta disponible y detiene la carga. |
| Usuario ausente pero token presente | Se envia `owner=` junto con el Bearer; esto esta cubierto por el test `requests tasks with an empty owner when no user is stored` de `web/src/app/dashboard/dashboard.component.spec.ts:74-82`. |

La normalizacion de errores y el estado visual estan en `web/src/app/utils/http-error-message.ts:7-25` y `web/src/app/dashboard/dashboard.component.ts:45-73`.

### 5. Notas de seguridad

- El Bearer se lee a traves de `AuthService`, pero el token permanece en `localStorage` y es accesible para JavaScript del mismo origen (`web/src/app/services/auth.service.ts:22-34`).
- `owner` se envia como query param controlado por el estado local del cliente; no es prueba de identidad ni autorizacion. El frontend no puede asegurar por este request que el servidor limite las tareas al usuario autenticado. Queda por confirmar que el backend autorice por la identidad del token y no confie solo en `owner`.
- Los campos de tarea y el mensaje de error se muestran con interpolacion Angular en `web/src/app/dashboard/dashboard.component.html:15-23`; el template no usa `[innerHTML]` para esos valores.
- `response.data.detail` puede mostrarse al usuario. Queda por confirmar que el servidor use `detail` generico y no exponga trazas o datos internos.
- La URL observada es HTTP en localhost (`web/src/environments/environment.ts:1-4`). No se infiere una configuracion de transporte para despliegues fuera del laboratorio.

## Preguntas abiertas de contrato

1. Que codigo HTTP exacto devuelve cada endpoint en exito y ante credenciales invalidas/token invalido? El cliente solo depende del comportamiento 2xx/no 2xx de Axios y los tests no fijan `status`.
2. `user` y sus campos (`username`, `displayName`, `role`) son obligatorios en login? El tipo los declara requeridos, pero el componente solo verifica `token`.
3. Cual es el esquema completo de cada tarea y puede haber campos adicionales? La interfaz local solo enumera los campos anteriores y todos son opcionales.
4. `owner` debe codificarse en URL y el servidor deriva/autoriza al usuario desde el token, o trata el query como filtro no confiable?
5. Hay un timeout contractual para GET de tareas? El cliente no configura uno.
6. Los campos de error `message` y `detail` son aptos para mostrar directamente al usuario, sin informacion interna?

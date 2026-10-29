# Spec Delta

## Purpose

Define el comportamiento observable de la gestión de sesión del frontend web: almacenamiento, lectura y limpieza del token y del usuario autenticado, y el acceso a datos protegidos que depende de la sesión.

## ADDED Requirements

### Requirement: Centralized session storage

El frontend SHALL concentrar en `AuthService` el guardado, la lectura y la limpieza del token de sesión y de los datos del usuario. Los componentes SHALL NOT leer ni escribir directamente el almacenamiento del navegador para estos datos.

#### Scenario: Session is saved through the service
- **WHEN** `AuthService` recibe un token y un usuario válidos para guardarlos
- **THEN** el token y el usuario quedan disponibles para lectura posterior a través de `AuthService`

#### Scenario: Session is read through the service
- **WHEN** existe una sesión guardada previamente
- **THEN** `AuthService` devuelve el token y el usuario almacenados

#### Scenario: Session is cleared through the service
- **WHEN** se invoca `AuthService.clearSession()`
- **THEN** el token y el usuario dejan de estar disponibles, y las lecturas posteriores no devuelven sesión

#### Scenario: Components do not access browser storage directly
- **WHEN** se revisan los componentes de login y dashboard
- **THEN** ninguno lee ni escribe directamente las claves de sesión del almacenamiento del navegador

### Requirement: Storage keys and mechanism are preserved

El almacenamiento SHALL seguir usando `localStorage` con las claves `workshop_token` (token) y `workshop_user` (usuario). Este cambio NO SHALL modificar el mecanismo de almacenamiento ni los nombres de las claves.

#### Scenario: Existing session remains valid after the change
- **GIVEN** un usuario tiene una sesión guardada con las claves `workshop_token` y `workshop_user`
- **WHEN** la aplicación se carga con esta versión
- **THEN** la sesión existente se lee sin requerir un nuevo inicio de sesión

### Requirement: Successful login stores the session and opens the dashboard

Tras una respuesta exitosa de `POST /auth/login`, el componente de login SHALL delegar el guardado del token y del usuario en `AuthService` y SHALL navegar al dashboard. La petición SHALL mantener el contrato observado: cuerpo con `username`, `password` y `client="angular-workshop"`.

#### Scenario: Login success
- **GIVEN** el backend responde con un `token` y un `user` válidos
- **WHEN** el usuario envía credenciales correctas en la pantalla de login
- **THEN** `AuthService` guarda el token y el usuario
- **AND** la aplicación navega a la ruta del dashboard

#### Scenario: Login request body is unchanged
- **WHEN** el usuario envía el formulario de login
- **THEN** la petición a `POST /auth/login` incluye `username`, `password` y `client` con el valor `angular-workshop`

#### Scenario: Login failure does not store a session
- **GIVEN** el backend responde con error de autenticación
- **WHEN** el usuario envía credenciales incorrectas
- **THEN** no se guarda ningún token ni usuario
- **AND** el mensaje de error se muestra con el manejo de errores existente

### Requirement: Dashboard obtains the token through the session service

Con una sesión activa, el dashboard SHALL obtener el token a través de `AuthService` y SHALL pasarlo a `TasksService` para consultar `GET /api/tasks?owner=<username>` con la cabecera `Authorization: Bearer <token>`.

#### Scenario: Dashboard loads tasks with an active session
- **GIVEN** existe una sesión activa con token y usuario
- **WHEN** el usuario abre el dashboard
- **THEN** el dashboard obtiene el token desde `AuthService`
- **AND** `TasksService` consulta `GET /api/tasks?owner=<username>` con cabecera `Authorization: Bearer <token>`

### Requirement: Dashboard requires a session

Sin token de sesión, el dashboard SHALL NOT consultar tareas y SHALL redirigir a `/login`.

#### Scenario: Dashboard without token
- **GIVEN** no existe token de sesión guardado
- **WHEN** el usuario intenta abrir el dashboard
- **THEN** no se realiza ninguna petición a `GET /api/tasks`
- **AND** la aplicación navega a `/login`

### Requirement: Logout clears the session through the service

Al cerrar sesión, la aplicación SHALL invocar `AuthService.clearSession()` antes de navegar a `/login`.

#### Scenario: User logs out
- **GIVEN** existe una sesión activa
- **WHEN** el usuario cierra sesión desde el dashboard
- **THEN** se invoca `AuthService.clearSession()`
- **AND** la aplicación navega a `/login`
- **AND** una lectura posterior de la sesión no devuelve token ni usuario

### Requirement: Existing HTTP contracts are preserved

La capacidad SHALL preservar el contrato observado en `docs/ENDPOINTS.md` para `POST http://localhost:8080/auth/login` y `GET http://localhost:8000/api/tasks?owner=<username>`. Los puntos abiertos de ese documento (códigos HTTP exactos, campo `user` obligatorio, autorización por `owner`, timeouts, exposición de mensajes de error) NO SHALL resolverse ni cambiarse por este requisito.

#### Scenario: Task query keeps the owner parameter and bearer header
- **WHEN** el dashboard consulta tareas con sesión activa
- **THEN** la URL incluye el parámetro `owner` con el nombre de usuario de la sesión
- **AND** la cabecera `Authorization` usa el esquema `Bearer` con el token de la sesión

# Plan

## Alcance y criterios

- Seleccionados todos los hallazgos `web` con estado `Pendiente`: H-WEB-01 a H-WEB-07. El pedido no especifico IDs; se excluye H-WEB-08 porque esta `No encontrado`.
- Aprobacion humana recibida el 2026-10-26 para H-WEB-01 a H-WEB-07. Para H-WEB-01 se aprobo centralizar `localStorage` sin cambiar su persistencia; no mover secretos al frontend ni cambiar a `sessionStorage`.
- `docs/ENDPOINTS.md` no existe. Se preservara el contrato observado: `POST http://localhost:8080/auth/login` con `username`, `password` y `client`; respuesta con `token` y `user`; `GET http://localhost:8000/api/tasks?owner=<username>` con `Authorization: Bearer <token>`; navegacion a dashboard/login y salida actuales.
- Se preservan las validaciones y mensajes de login, el filtro de tareas archivadas, el formato/orden visible, el manejo de errores y la limpieza de sesion. Los cambios de almacenamiento que alteren persistencia quedan sujetos a decision antes de implementarse.
- Escribir las pruebas de caracterizacion antes de modificar codigo. Ninguna prueba ni auditoria se ejecuto como parte de este plan.
- Meta de cobertura: al menos 85% del codigo modificado, sin reducir quality gates.
- `web/package-lock.json` aparecio con cambios locales en el estado Git previo. Conservarlos; revisar ese diff antes de cualquier instalacion o actualizacion de dependencias.

## H-WEB-01: Token en localStorage

**Hallazgo:** Token de sesion almacenado en `localStorage` (HALLAZGOS.md, estado Pendiente).

**Problema:** El token queda disponible para JavaScript del mismo origen. El login guarda token/usuario; dashboard lee el token para enviar el Bearer y logout elimina la sesion.

**Cambio propuesto:** Centralizar login, lectura/escritura de sesion y logout en `AuthService`; los componentes no acceden al almacenamiento. Mantener `localStorage` para preservar el comportamiento aprobado. No afirmar que centralizar el acceso elimina el riesgo de exposición del token a JavaScript del mismo origen.

**Archivos a tocar:** `web/src/app/login/login.component.ts`, `web/src/app/dashboard/dashboard.component.ts`, nuevo `web/src/app/services/auth.service.ts`, y pruebas de login/dashboard/servicio.

**Caracterizacion antes de tocar codigo:** Probar que login guarda token y usuario, que dashboard envia exactamente `Authorization: Bearer <token>`, que ausencia de token navega a `/login`, y que logout limpia token/usuario y navega a `/login`. Registrar aparte el comportamiento de persistencia tras recargar para resolver la decision sobre `sessionStorage`.

## H-WEB-02: Mensaje dinamico con innerHTML

**Hallazgo:** El mensaje combina texto de usuario/error del backend y se enlaza mediante `[innerHTML]` (HALLAZGOS.md, estado Pendiente). Angular sanitiza el binding por defecto; no se ha confirmado explotacion.

**Problema:** Se construye HTML con datos dinamicos. Depender de sanitizacion para representar texto permite que contenido del backend altere el marcado permitido y complica razonar sobre la salida.

**Cambio propuesto:** Representar el mensaje como texto/datos tipados y usar interpolacion. Mantener el formato visual con elementos estaticos del template (por ejemplo, prefijo destacado y separacion) y nunca insertar como HTML el usuario ni el error recibido. Mantener los mismos mensajes observables.

**Archivos a tocar:** `web/src/app/login/login.component.ts`, `web/src/app/login/login.component.html` y `web/src/app/login/login.component.spec.ts`.

**Caracterizacion antes de tocar codigo:** Cubrir usuario/contraseña vacios, respuesta sin token y error del backend; comprobar que el texto mostrado se conserva. Agregar caso con texto que parezca etiqueta HTML y verificar que se presenta como texto, no como elemento. El harness Vitest actual usa entorno Node; confirmar soporte DOM antes de escribir la asercion de renderizado. Si requiere una dependencia DOM de prueba, justificarla y revisar el cambio local existente en `package-lock.json` antes de incorporarla.

## H-WEB-03: Responsabilidades mezcladas en componentes

**Hallazgo:** Login/dashboard manejan HTTP, URL, sesion y navegacion directamente (HALLAZGOS.md, estado Pendiente).

**Problema:** Los componentes coordinan transporte, persistencia y UI, haciendo mas costosos el aislamiento de pruebas y los cambios de configuracion.

**Cambio propuesto:** Crear `AuthService` para login/sesion y `TasksService` para consulta de tareas; dejar a los componentes validacion/presentacion y navegacion. Centralizar las URLs actuales en `web/src/environments/environment.ts`, sin cambiar rutas, query, payload, timeout ni header. Extraer unicamente logica repetida real; no crear abstracciones sin uso.

**Archivos a tocar:** `web/src/app/login/login.component.ts`, `web/src/app/dashboard/dashboard.component.ts`, nuevos `web/src/app/services/auth.service.ts`, `web/src/app/services/tasks.service.ts` y `web/src/environments/environment.ts`, mas specs de ambos componentes y servicios.

**Caracterizacion antes de tocar codigo:** Verificar por mocks que login llama al endpoint actual con el cuerpo y timeout observados; dashboard solicita el owner actual con el Bearer; ambos errores conservan sus mensajes; filtro, etiquetas, orden, rutas y logout no cambian.

## Item: H-WEB-04 - Dependencias con advisories

**Seleccion y hallazgo:** Seleccionado como el hallazgo `web` Pendiente de mayor severidad (Alta). `HALLAZGOS.md` registra advisories altos para `axios` 0.31.0 y `lodash` 4.17.21. La auditoria tambien reporto vulnerabilidades transitivas en Angular/Vitest/tooling; `npm audit` termino con codigo 1 y 25 advisories. No se debe presentar la lista completa como riesgo de runtime de produccion: varias afectan herramientas de desarrollo.

**Problema:** Las versiones directas señaladas tienen correcciones publicadas, pero actualizar deps tambien puede afectar lockfile y compatibilidad. La resolucion previa con npm fallo con `ERESOLVE` porque el arbol instalado y el lockfile contienen Angular 21.2.19, y ya hay un diff local del usuario en `web/package-lock.json` que elimina entradas `extraneous`.

**Cambio propuesto:** En una tanda exclusiva para H-WEB-04, actualizar Axios a una version corregida compatible con las llamadas actuales; retirar `lodash` y `@types/lodash` del manifiesto porque ya no existe import de Lodash en la aplicacion y `AuthService` combina preferencias con spread tipado. No agregar paquetes. No usar `npm audit fix --force` ni `--legacy-peer-deps`. Para advisories transitivos, actualizar Angular/Vitest solo como conjuntos coordinados y despues de revisar una propuesta de diff del lockfile que conserve el cambio local. Si npm vuelve a fallar, detenerse y dejar H-WEB-04 Pendiente hasta acordar una estrategia de instalacion/lockfile; no dejar manifiesto y lockfile desalineados.

**Archivos de este item:** `web/package.json`, `web/package-lock.json`. Los tests existentes que caracterizan contratos son `web/src/app/services/auth.service.spec.ts`, `web/src/app/services/tasks.service.spec.ts` y `web/src/app/login/login.component.spec.ts`; no se modifican salvo que la actualizacion demuestre una regresion concreta.

**Prueba antes de tocar dependencias:** Mantener/verificar primero los tests existentes: (1) `AuthService` envia el POST con URL, cuerpo y timeout actuales; (2) `TasksService` conserva GET, query `owner` y header Bearer; (3) login mantiene preferencias por defecto, guardadas y fallback de JSON invalido. Ejecutar `npm test` antes del cambio y guardar el resultado. Registrar tambien `npm run audit:workshop` como baseline. Despues de actualizar, repetir esos tests, `npm run build`, `npm run test:coverage` y audit. No declarar H-WEB-04 resuelto hasta que el lockfile sea coherente y la auditoria no reporte los advisories directos tratados; los advisories transitorios restantes se documentan con severidad/origen.

## H-WEB-05: Uso de any

**Hallazgo:** Estado, respuestas y errores usan `any` en login/dashboard (HALLAZGOS.md, estado Pendiente).

**Problema:** Se pierden comprobaciones estaticas sobre credenciales, respuesta de login, usuario y tareas; errores de forma pueden manifestarse en ejecucion.

**Cambio propuesto:** Definir tipos/interfaces para `LoginRequest`, respuesta de login, usuario, tarea y preferencias; tipar estado, respuestas Axios y manejo de errores con `unknown` y una normalizacion acotada. Mantener los campos y formatos HTTP observados; no introducir modelos de respuesta incompatibles.

**Archivos a tocar:** `web/src/app/login/login.component.ts`, `web/src/app/dashboard/dashboard.component.ts`, nuevos tipos bajo `web/src/app/models/` y los servicios de H-WEB-03; specs de componentes/servicios.

**Caracterizacion antes de tocar codigo:** Probar campos usados de la respuesta de login y tareas, estados de carga/error, tareas archivadas, etiquetas, orden y usuario ausente. Ejecutar build para detectar incompatibilidades de tipos despues de la tipificacion.

## H-WEB-06: Pruebas limitadas a una utilidad

**Hallazgo:** La especificacion existente prueba `formatTaskLabel`; no hay caracterizacion visible del flujo login/dashboard (HALLAZGOS.md, estado Pendiente).

**Problema:** Sin pruebas de flujo, una refactorizacion puede cambiar el contrato de login, persistencia, autorizacion de tareas o logout sin detectarlo.

**Cambio propuesto:** Ampliar Vitest con pruebas de componentes/servicios utilizando respuestas Axios y almacenamiento/ruteo controlados. Reutilizar estas pruebas para H-WEB-01 a H-WEB-05 y H-WEB-07 en vez de duplicar casos.

**Archivos a tocar:** Nuevos `web/src/app/login/login.component.spec.ts`, `web/src/app/dashboard/dashboard.component.spec.ts` y specs de servicios si se separan; actualizar `web/vitest.config.ts` solo si el harness actual no puede ejecutar la prueba necesaria.

**Caracterizacion antes de tocar codigo:** Cubrir login valido, usuario/contraseña vacios, respuesta sin token, error de login, dashboard sin sesion, GET autenticado, filtro/orden/etiquetas, error al cargar y logout. Registrar resultados reales por ID al ejecutar `npm test` y `npm run test:coverage`; no declarar cobertura sin salida medida.

## H-WEB-07: Condicionales anidados en login

**Hallazgo:** La validacion de usuario/contraseña anida condiciones en `login()` (HALLAZGOS.md, estado Pendiente).

**Problema:** La anidacion dificulta seguir las salidas de validacion, carga, exito y error.

**Cambio propuesto:** Usar retornos anticipados para usuario/contraseña vacios y separar validacion/presentacion del envio HTTP mediante H-WEB-03. Mantener los textos de validacion y no duplicar reglas entre componente y servicio.

**Archivos a tocar:** `web/src/app/login/login.component.ts` y `web/src/app/login/login.component.spec.ts`.

**Caracterizacion antes de tocar codigo:** Probar por separado usuario vacio, contraseña vacia, credenciales completas, respuesta sin token y fallo HTTP; verificar mensaje, estado `busy`, llamadas y navegacion esperados.

## Secuencia y puertas

1. Aprobacion humana registrada para H-WEB-01 a H-WEB-07; H-WEB-01 conserva `localStorage`.
2. Revisar los cambios locales existentes de `web/package-lock.json`; no reemplazarlos.
3. Escribir primero la caracterizacion compartida de H-WEB-06 y los casos especificos indicados por cada hallazgo.
4. Implementar por responsabilidad: servicios/configuracion; tipos/errores; cambios de presentacion; dependencias solo con evidencia SCA.
5. Ejecutar desde `web/`: `npm test`, `npm run build`, `npm run test:coverage` y, para H-WEB-04, `npm run audit:workshop`. Registrar comandos, resultados y cobertura por IDs en `docs/TESTING.md` cuando ese artefacto se solicite.
6. Mantener los endpoints y formatos observados. H-WEB-01 conserva `localStorage` por decision aprobada; H-WEB-04 queda pendiente hasta resolver el conflicto de peers sin forzar ni sobrescribir el lockfile local. No afirmar que H-WEB-02 es explotable sin evidencia.

La aprobacion humana indicada arriba se recibio en la conversacion. Los comandos ejecutados constan en la tabla; el build paso con un aviso CommonJS de Axios y la cobertura global medida alcanzo 86%.

## Ejecuciones

| fecha | componente e IDs | comando | resultado real |
|---|---|---|---|
| 2026-10-26 | web; H-WEB-01 a H-WEB-07 | `npm test` (linea base, antes de agregar caracterizaciones) | PASS: 1 archivo, 1 test. Solo se ejecuto `legacy-format.spec.ts`. |
| 2026-10-26 | web; H-WEB-04 | `npm run audit:workshop` | FAIL, codigo 1: 25 advisories (10 moderados, 9 altos, 6 criticos). El informe incluye `axios` y `lodash`, y vulnerabilidades transitivas de Angular/Vitest y tooling. No se aplico `npm audit fix --force`. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npx vitest run src/app/login/login.component.spec.ts` (antes del cambio H-WEB-02) | 5 PASS y 1 FAIL esperado: el template contenia `[innerHTML]`. Primer intento no ejecuto tests por falta de carga de `@angular/compiler`; se corrigio el setup del spec y se repitio. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npx vitest run src/app/login/login.component.spec.ts` (despues del cambio H-WEB-02) | PASS: 1 archivo, 6 tests. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03, H-WEB-05, H-WEB-06 | `npx vitest run src/app/dashboard/dashboard.component.spec.ts` | PASS: 1 archivo, 4 tests; captura redireccion, GET Bearer/owner, filtro/orden, error y logout. |
| 2026-10-26 | web; H-WEB-02 | `npx vitest run src/app/login/login.component.spec.ts` | PASS: 6 tests tras retirar `[innerHTML]`; H-WEB-02 se marco Resuelto en HALLAZGOS.md. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03, H-WEB-05 | `npx vitest run src/app/services/auth.service.spec.ts src/app/services/tasks.service.spec.ts` (antes de crear servicios) | FAIL esperado: ambos modulos aun no existian; no se ejecuto ningun test. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03 | `npx vitest run src/app/services/auth.service.spec.ts src/app/services/tasks.service.spec.ts` (despues de crear servicios) | PASS: 2 archivos, 5 tests. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03, H-WEB-05 | `npx vitest run src/app/login/login.component.spec.ts` (spec adaptado antes del cambio de componente) | FAIL: se ejercito el componente antiguo, que intento `localhost:8080`; `ECONNREFUSED`, sin servicio local. Luego el spec se cambio para inyectar servicio. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02 | `npx vitest run src/app/login/login.component.spec.ts -t "renders dynamic messages"` | PASS: 1 test; 5 omitidos por filtro. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03, H-WEB-05, H-WEB-06 | `npm test` (refactor inicial) | PASS: 5 archivos, 16 tests. |
| 2026-10-26 | web; H-WEB-01, H-WEB-03, H-WEB-05, H-WEB-06 | `npm run build` | PASS; aviso CommonJS para Axios. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npm test` | PASS: 6 archivos, 22 tests. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npm run test:coverage` (antes de casos de borde) | PASS: 16 tests; cobertura global 83.95%, insuficiente para la meta. |
| 2026-10-26 | web; H-WEB-01, H-WEB-02, H-WEB-03, H-WEB-05, H-WEB-06, H-WEB-07 | `npm run test:coverage` (tras agregar casos de borde) | PASS: 22 tests; cobertura global 86%, statements/lineas 86%, ramas 92.85%, funciones 86.36%. |
| 2026-10-26 | web; H-WEB-04 | npm installs con `--package-lock-only`, normal y versiones explicitas | FAIL, `ERESOLVE`: npm detecta Angular 21.2.19 instalado/bloqueado como peer mientras se solicitaba 21.2.25. No se uso `--force` ni `--legacy-peer-deps`; se restauraron mis cambios de `package.json` y no se modifico el lockfile. |
| 2026-10-26 | web; H-WEB-04 | `npm ls @angular/common @angular/core @angular/forms @angular/platform-browser @angular/router --depth=0` | FAIL, `ELSPROBLEMS`: árbol instalado en Angular 21.2.19 durante el intento; se restauraron las versiones del manifiesto. |
| 2026-10-26 | web; H-WEB-04 | `npm view` Axios/Lodash/Angular/Vitest | Registry confirma Axios 1.20.0, Lodash 4.18.1, Angular runtime 21.2.25, CLI/build 21.2.28 y Vitest/coverage 3.2.7; `@angular/core@21.2.28` no existe. |
| 2026-10-26 | web; H-WEB-01 a H-WEB-07 | `npm test` (manifiesto restaurado) | PASS: 6 archivos, 22 tests. |
| 2026-10-26 | web; H-WEB-03, H-WEB-05, H-WEB-06 | `npx vitest run src/app/dashboard/dashboard.component.spec.ts` | PASS: 1 archivo, 5 tests tras tipar prioridades opcionales. |
| 2026-10-26 | web; H-WEB-01 a H-WEB-07 | `npm test` (validacion final) | PASS: 6 archivos, 22 tests. |
| 2026-10-26 | web; H-WEB-01 a H-WEB-07 | `npm run build` (validacion final) | PASS; permanece aviso CommonJS para Axios. |
| 2026-10-26 | web; H-WEB-01 a H-WEB-07 | `npm run test:coverage` (validacion final) | PASS: 22 tests; cobertura global Statements/Lines 86%, Branches 90.27%, Functions 86.36%. Los componentes/servicios/utilidades modificados quedan sobre 85% en statements/lines. |
| 2026-10-26 | web; H-WEB-01 | `npx vitest run src/app/services/auth.service.spec.ts src/app/login/login.component.spec.ts src/app/dashboard/dashboard.component.spec.ts` | PASS: 3 archivos, 15 tests; localStorage, login, lectura del token/Bearer, ausencia de token y logout. Riesgo residual de storage aceptado; hallazgo sigue Pendiente. |
| 2026-10-26 | web; H-WEB-04 | `npx vitest run src/app/services/auth.service.spec.ts src/app/services/tasks.service.spec.ts src/app/login/login.component.spec.ts` (antes del upgrade directo) | PASS: 3 archivos, 11 tests; conserva POST/GET, preferencias y UI de login antes de tocar Axios. |
| 2026-10-26 | web; H-WEB-04 | `npm install --save-exact axios@1.20.0 --ignore-scripts --no-audit` | FAIL: npm termino con error interno `Cannot read properties of null (reading 'children')`. No modifico `package.json`; el diff preexistente de `package-lock.json` se mantuvo sin cambios. |
| 2026-10-26 | web; H-WEB-04 | `npx vitest run src/app/services/auth.service.spec.ts src/app/services/tasks.service.spec.ts src/app/login/login.component.spec.ts` (despues del intento fallido) | PASS: 3 archivos, 11 tests con las versiones instaladas originales. No prueba la version corregida; H-WEB-04 sigue Pendiente. |

El audit propone upgrades forzados fuera de los rangos fijados. Las versiones corregidas se identificaron, pero npm no pudo resolver Angular con el árbol/lockfile existente sin aceptar overrides de peer. No se modificó el lockfile local, cuyo diff previo elimina entradas `extraneous`. H-WEB-04 sigue Pendiente hasta actualizarlo con una resolución revisada.
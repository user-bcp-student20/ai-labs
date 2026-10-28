---
name: release-notes-from-integrated-prs
description: "Redacta notas de versión verificables para cambios integrados entre dos referencias GitHub. Úsalo para release notes, changelog o resumen de PR entre ramas, tags o SHA; verifica la integración mediante GitHub MCP y guarda el resultado localmente sin publicar una release."
---

# Notas de versión desde PR integrados

## Cuándo usar

- Preparar notas de versión entre dos referencias de un repositorio.
- Resumir cambios de PR para personas usuarias, sin inferir beneficios ni publicar una release.

## Procedimiento

1. Identifica el repositorio y las referencias inicial y final. Si no se indican, elige referencias que delimiten claramente el intervalo deseado (por ejemplo, el SHA de la última release y la rama de destino actual) e informa cuáles elegiste. Si el repositorio o el intervalo no se pueden determinar sin ambigüedad, pregunta antes de continuar.
2. Usa GitHub MCP `get_commit` para resolver cada referencia a su SHA completo. Registra el nombre original y el SHA de ambas.
3. Usa `list_commits` desde la referencia final y pagina el historial hasta encontrar el SHA inicial. Define el intervalo como exclusivo del SHA inicial e inclusivo del final. Si no puedes confirmar que el SHA inicial es alcanzable desde el final, no infieras un intervalo: informa el bloqueo y solicita referencias compatibles.
4. Identifica PR candidatos a partir de los commits del intervalo y cruza cada uno con GitHub MCP `pull_request_read` (`get`). Considera integrado un PR solo si GitHub confirma `merged: true` y su commit de merge está dentro del intervalo, ya sea mediante el SHA de merge del PR o mediante un commit de merge en el historial que lo identifique inequívocamente. Un PR abierto, cerrado sin merge o mencionado solo en documentación no califica.
5. Si no puedes demostrar la integración o la ubicación del merge en el intervalo, excluye el PR de las notas y registra la incertidumbre en la evidencia. No sustituyas la verificación por el estado `closed` ni por una mención textual.
6. Para cada PR integrado, revisa su título, descripción, commits y archivos/diff con `pull_request_read` (`get_diff`, `get_files` o `get_commits`, según se necesite). Resume solo efectos que esas fuentes respalden. Distingue cambios implementados de especificaciones, pruebas y configuración. Incluye acciones para quien usa el producto únicamente cuando las fuentes indiquen que son necesarias.
7. Redacta notas concisas y centradas en el efecto observable. No inventes beneficios, métricas, correcciones, comportamiento, compatibilidad o instrucciones. No presentes documentación o pruebas como una funcionalidad ya implementada.
8. Guarda las notas en un archivo Markdown local dentro del repositorio. Incluye el repositorio, fecha de elaboración, referencias originales y sus SHA, definición de límites, enlaces a todos los PR incluidos y una sección de evidencia con exclusiones e incertidumbres relevantes.
9. No crees ni publiques una GitHub Release, tag, PR, push u otra publicación. Entrega el archivo local y resume qué intervalo y PR fueron verificados.

## Formato sugerido

```markdown
# Notas de versión

**Repositorio:** owner/repo
**Intervalo:** `ref-inicial` (`sha-inicial`, exclusivo) → `ref-final` (`sha-final`, inclusivo)
**Fecha:** YYYY-MM-DD

## Cambios

### [Categoría]
- **Efecto:** descripción demostrable. [PR #N](URL)
- **Acción necesaria:** indicar pasos respaldados por la evidencia, o eliminar esta línea si no aplica.

## Evidencia y límites
- PR integrados verificados y commits de merge dentro del intervalo.
- Candidatos excluidos o incertidumbre que afecte la cobertura de las notas.
```

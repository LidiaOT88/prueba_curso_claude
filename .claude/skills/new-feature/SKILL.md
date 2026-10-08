---
name: new-feature
description: Recibe el número de una issue, la lee con GitHub CLI (gh), crea una rama de trabajo a partir de development (o master si no existe), publica un plan por tareas pequeñas como comentario de esa issue y lo implementa con TDD estricto. Úsala cuando se pida planificar o implementar una issue.
---

# new-feature

Número de la issue a planificar: $ARGUMENTS

`$ARGUMENTS` debe ser el número de una issue del repositorio (admite `123` o `#123`). Si está vacío o no es un número, pregunta al usuario qué issue quiere planificar antes de continuar.

## 0. Leer la issue

1. Comprueba que `gh` está instalado y autenticado (`gh auth status`). Si no lo está, avisa al usuario y para.
2. Lee la issue completa, con comentarios: `gh issue view <numero> --comments`. Para datos estructurados usa `gh issue view <numero> --json number,title,body,labels,author,state,comments,url`.
3. Si la issue no existe o está cerrada, avisa al usuario antes de seguir.
4. Los comentarios pueden cambiar el planteamiento inicial: tenlos en cuenta.

## 1. Crear la rama

1. Deduce el `<tipo>` de la tarea a partir de la issue (título, cuerpo y etiquetas): `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, etc. (mismos tipos que Conventional Commits).
2. Deduce una `<descripcion>` corta en kebab-case a partir del título de la issue (por ejemplo `anadir-filtro-por-canal`), sin tildes ni espacios.
3. El nombre de la rama es `<tipo>/<descripcion>`.
4. Elige la rama base:
   - Si existe `development` (`git rev-parse --verify --quiet development`, o `origin/development`), úsala como base.
   - Si no existe, usa `master`.
5. Crea la rama desde la base: `git switch -c <tipo>/<descripcion> <base>`.
   - Si hay cambios sin commitear que puedan interferir, avisa al usuario antes de cambiar de rama; no los descartes.
   - Si la rama ya existe, avisa al usuario en lugar de sobrescribirla.

## 2. Crear el plan

El plan se escribe en español, con la estructura definida en `assets/TEMPLATE.md`, rellenando la cabecera con los datos reales de la issue (número, enlace, autor, etiquetas). **No se guarda como fichero**: se publica como comentario de la issue.

Para publicarlo, escribe el plan en un fichero temporal fuera del repositorio y ejecuta:

```bash
gh issue comment <numero> --body-file <fichero-temporal>
```

Usa `--body-file` (no `--body`) para conservar el formato Markdown. Después comprueba que se publicó y muestra al usuario la URL del comentario que devuelve `gh`.

Reglas para las tareas:

- Cada tarea debe poder implementarse en **5-10 minutos como máximo**. Si es más grande, divídela.
- Cada tarea describe un único cambio verificable, indicando el test que lo cubre y los ficheros que toca.
- Ordénalas para que el proyecto funcione tras cada una.
- Respeta la arquitectura del proyecto (`routes` → `controllers` → `services` → `repositories` → `db.js`) y las convenciones de `CLAUDE.md`.
- Antes de escribir el plan, explora el código relevante para que las tareas sean realistas.

Muestra el plan al usuario junto con el enlace al comentario y espera su confirmación antes de implementar. Si el usuario pide cambios, actualiza el comentario con `gh issue comment <numero> --edit-last --body-file <fichero-temporal>` en lugar de publicar uno nuevo.

## 3. Implementar con TDD estricto

Para **cada** tarea, en orden, sigue el ciclo completo sin saltarte ningún paso:

1. **Red**: escribe primero el test que describe el comportamiento esperado. Ejecútalo y comprueba que **falla** por el motivo correcto. Si pasa sin código nuevo, el test no sirve: corrígelo.
2. **Green**: escribe el mínimo código de producción necesario para que el test pase. Nada más.
3. **Refactor**: limpia el código y los tests manteniendo todo en verde.
4. Ejecuta la **suite completa** y comprueba que todo pasa.
5. Marca la tarea en el plan (`- [ ]` → `- [x]`) **inmediatamente**, antes de empezar la siguiente, actualizando el comentario de la issue con `gh issue comment <numero> --edit-last --body-file <fichero-temporal>`.

Notas:

- No escribas código de producción sin un test en rojo que lo justifique.
- No avances a la siguiente tarea si la suite no está en verde.
- El proyecto no tiene test runner configurado. Si aún no hay tests, la primera tarea del plan debe preparar la infraestructura de tests usando el runner integrado de Node (`node --test`, módulo `node:test`), sin añadir dependencias, y añadir el script `npm test`.
- Los tests no deben tocar la base de datos real: usa `DB_PATH` apuntando a una base temporal o `:memory:`.
- El código y los tests se escriben en inglés; el plan y los mensajes al usuario, en español.

## 4. Cierre

Cuando todas las tareas estén marcadas, ejecuta la suite completa una última vez y resume al usuario qué se ha hecho. No hagas commit ni push salvo que el usuario lo pida (para commits está la skill `commit`).

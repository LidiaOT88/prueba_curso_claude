---
name: implement-issue
description: Implementa el plan comentado en una issue de GitHub indicada por su número. Trabaja en un git worktree propio (uno por agente si la feature afecta a varios paquetes), aplica TDD estricto y hace un commit por cada tarea completada. Úsala cuando el usuario pida implementar una issue y dé su número.
---

# implement-issue

Issue a implementar: $ARGUMENTS

`$ARGUMENTS` debe contener el **número** de la issue (por ejemplo `42` o `#42`). Si está vacío o no es un número, pregunta al usuario qué issue es y no continúes sin él.

## 1. Leer la issue y su plan

1. Obtén la issue con comentarios: `gh issue view <n> --comments` (usa `--json title,body,comments,labels` si necesitas procesarla).
2. Localiza el **plan** en los comentarios (normalmente una lista de tareas). Si hay varios comentarios con plan, usa el más reciente y avisa al usuario.
3. Si no hay plan en la issue, o es ambiguo, **para y pregunta** al usuario. No inventes el plan.
4. Extrae la lista ordenada de tareas. Si una tarea es demasiado grande (más de ~10 minutos), divídela y dilo al usuario.
5. Muestra al usuario un resumen: título de la issue, tareas, y qué agentes/paquetes afecta (ver sección 2). Espera confirmación antes de implementar.

## 2. Decidir agentes y worktrees

Un **agente** es cada paquete del monorepo afectado por la feature: `api`, `web-admin`, `web-empleados`, `web-clientes`, `web-shared`.

1. Clasifica cada tarea del plan por paquete según los ficheros que toca.
2. **Un solo paquete afectado**: un único worktree, trabajas tú.
3. **Varios paquetes afectados**: un worktree **propio por agente**, y cada agente solo toca ficheros de su paquete. Lanza un subagente por paquete (herramienta `Agent`, en paralelo si no hay dependencias entre ellos). Dale en el prompt: número de issue, ruta de su worktree, sus tareas, el contrato con los otros paquetes (endpoints, tipos) y estas mismas reglas de TDD y commits.
   - Si un paquete depende de otro (p. ej. frontend necesita endpoint de la API), ordena: primero el productor, luego el consumidor, o fija el contrato antes de empezar.
   - `web-shared` es dependencia de los frontends: impleméntalo antes de ellos.

## 3. Crear los worktrees

Rama base: `development` si existe (`git rev-parse --verify --quiet development`), si no `main` (o `master`).

- Nombre de rama: `<tipo>/<n>-<descripcion>` (`feat`, `fix`, `refactor`... deducido de la issue; descripción en kebab-case sin tildes).
- Un agente: `git worktree add .claude/worktrees/issue-<n> -b <rama> <base>`
- Varios agentes: `git worktree add .claude/worktrees/issue-<n>-<paquete> -b <rama>-<paquete> <base>` por cada paquete.
- Si la rama o la ruta ya existen, avisa al usuario; no sobrescribas.
- Si hay cambios sin commitear en el árbol principal, no los toques ni los arrastres.
- Dentro de cada worktree ejecuta `npm install` si hace falta.
- **Todo el trabajo se hace dentro del worktree**, nunca en el árbol principal.

## 4. Implementar con TDD estricto

Para **cada** tarea, en orden, ciclo completo sin saltar pasos:

1. **Red**: escribe primero el test. Ejecútalo y comprueba que **falla por el motivo correcto**. Si pasa sin código nuevo, el test no sirve: corrígelo.
2. **Green**: escribe el mínimo código de producción para que pase. Nada más.
3. **Refactor**: limpia código y tests manteniendo todo en verde.
4. Ejecuta la **suite completa** del paquete (`npm test` en la API, que usa vitest; test único con `npx vitest run <fichero>`) y comprueba que todo pasa.
5. **Commit** de la tarea (ver sección 5).
6. Marca la tarea como hecha (casilla `- [x]` en tu seguimiento; no edites la issue salvo que el usuario lo pida).

Reglas:

- Prohibido código de producción sin un test en rojo que lo justifique.
- No avances si la suite no está en verde.
- Los frontends no tienen runner de tests: si una tarea de frontend lo necesita y no existe, avisa al usuario antes de añadir dependencias; si no, verifica con `npm run build -w @resttek/web-<nombre>` y deja constancia de que no hay test automatizado.
- Respeta el estilo arquitectónico de la zona que tocas (hexagonal en `employee`, por capas en el resto) y `CLAUDE.md`.
- Si cambias comportamiento documentado, actualiza `docs/`.
- Código y tests en inglés; mensajes y documentación en español.

## 5. Un commit por tarea

- Haz **un commit por cada tarea completada**, justo al terminar su ciclo (tras suite en verde). Test y código de la tarea van en el mismo commit.
- Sigue Conventional Commits (skill `commit`): `<tipo>(<ámbito>): <descripción>`, referenciando la issue en el cuerpo (`Refs #<n>`).
- Añade al final del mensaje la línea de coautoría que indique el entorno.
- Añade solo los ficheros de la tarea (`git add <ficheros>`), nunca `git add -A` a ciegas.
- Nunca `--no-verify`. Si un hook falla, arregla la causa.
- **No hagas push ni abras PR** salvo que el usuario lo pida.

## 6. Cierre

1. Cuando todas las tareas estén hechas, ejecuta una última vez la suite completa (y el build de los frontends afectados) en cada worktree.
2. Si hubo varios worktrees, comprueba la integración entre paquetes y avisa al usuario de cómo juntar las ramas (no las fusiones sin que lo pida).
3. Informa al usuario: issue, ramas y rutas de worktree creadas, tareas con su commit (`git log --oneline`), resultado de tests, y qué quedó pendiente.
4. No elimines los worktrees; ofrece al usuario limpiarlos (`git worktree remove <ruta>`) cuando termine con ellos.

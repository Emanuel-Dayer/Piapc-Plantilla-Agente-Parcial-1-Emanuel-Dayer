# Matriz de permisos

Completa esta matriz antes de habilitar acciones de un agente. Una accion no declarada debe considerarse prohibida hasta consultar.

Las decisiones de esta tabla corresponden a la sesion del 2026-09-26 y a las autorizaciones posteriores del estudiante.

| Accion | Estado | Alcance o justificacion |
|---|---|---|
| Leer archivos del proyecto | Permitida | Autorizado desde la instruccion inicial. Se leyeron `README.md`, `AGENTS.md`, `GDD.md`, `docs/`, `Centipede/src/`, `Centipede/package.json`, `Centipede/index.html`, `Centipede/vite/` y el codigo de Phaser 4 en `Centipede/node_modules/phaser/src/` |
| Buscar rutas y simbolos | Permitida | Autorizado desde la instruccion inicial. Se uso busqueda de texto y listado de directorios |
| Editar archivos previstos | Permitida | Autorizado de forma expresa con la instruccion "solo analiza y arregla el bug" y luego "rellena todos los documentos que falten". El alcance se limito a `Centipede/src/game/objects/CentipedeManager.js` y a los documentos de `docs/`. No se toco `MushroomManager.js` porque no fue necesario |
| Ejecutar scripts documentados | Prohibida | No se autorizo en ningun momento. No se ejecuto `npm run dev`, `npm run build` ni ninguna otra orden de build o ejecucion. La verificacion en ejecucion la realizo el estudiante de forma manual |
| Instalar dependencias | Prohibida | No se solicito. `Centipede/node_modules/` ya estaba presente y no se modifico |
| Usar red | Prohibida | No se solicito. No se realizo ninguna consulta de red |
| Publicar o subir cambios | Prohibida | No se solicito. No se ejecuto `git add`, `git commit`, `git push` ni ningun comando de git. No se crearon ramas ni etiquetas |
| Acceder a secretos o credenciales | Prohibida | No corresponde al trabajo. |

Ademas quedo prohibida por omision, al no estar declarada: la eliminacion de archivos, la creacion de archivos nuevos, la modificacion de `GDD.md`, la modificacion de `Centipede/package.json` y la modificacion de la configuracion de Vite.

## Condiciones de detencion

- Si la correccion del hongo exigiera modificar archivos fuera de `CentipedeManager.js`, se detuvo la intervencion y se consulto, porque el alcance aprobado era un unico archivo.
- Si se hubiera necesario ejecutar el juego para obtener evidencia, se detuvo y se pidio autorizacion, en lugar de ejecutar el comando.
- Ante una primera intervencion que no resolvio el problema, se detuvo el avance, se reporto el sintoma persistente al estudiante y se pidio una revision del diagnostico antes de seguir.
- Si aparecian cambios en archivos que no habian sido modificados por el agente, se detuvo la herramienta antes de escribir.
- Si una validacion fallaba sin causa comprendida, se detuvo en lugar de iterar a ciegas.
- Si el motor declarado y la version instalada no coincidian, se consulto en lugar de asumir cual era la correcta.
- No se completo ningun documento con informacion inventada: los datos que no pudieron verificarse quedaron marcados como pendientes de aporte del estudiante.

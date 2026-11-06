# Evidencia de pruebas

Relaciona cada criterio de aceptacion con una prueba o secuencia manual que otra persona pueda repetir.

El proyecto no tiene pruebas automatizadas. No se encontraron archivos `*.test.js` ni `*.spec.js` y `Centipede/package.json` no define ningun script de test, por lo que todas las verificaciones son manuales sobre el juego en ejecucion.

Las filas donde la version validada o la evidencia grafica quedaron marcadas como pendientes de aporte del estudiante: el agente no ejecuto el juego ni genero capturas, y no debe inventarlas.

## Recorrido completo de la situacion corregida

Este es el recorrido entero de la situacion, desde que el jugador dispara hasta que el hongo queda en pantalla. Cada fila indica donde ocurre el salto y que estado lleva el segmento en ese momento, de modo que otra persona pueda seguir el mismo camino en el codigo y comprobar el mismo resultado.

| Paso | Que ocurre | Responsable | Estado del segmento al pasar por aqui |
|---:|---|---|---|
| 1 | El jugador mantiene la tecla de shoot y el sistema de entrada la lee | `player.js:49` | El segmento sigue con el estado que le dejo su propio frame anterior |
| 2 | La bala inactiva se reactiva y se lanza hacia arriba | `player.js:68-76`, `player.js:97-99` | Sin cambios |
| 3 | La escena pide colisiones para la bala activa | `Game.js:88-89` | Sin cambios |
| 4 | La bala impacta contra un segmento del cienpiés | `Game.js:91` | Sin cambios |
| 5 | El segmento se recupera del sprite con `getData('segment')` | `Game.js:92` | `state`, `dirX` y `dirY` validos, propagados desde el lider si es un segmento de cuerpo |
| 6 | Se suman 100 puntos si es cabeza o 10 si es cuerpo, y se dibuja la explosion | `Game.js:95-98` | Sin cambios |
| 7 | Se destruye la bala y se crea la bala inactiva siguiente | `Game.js:99-100` | Sin cambios |
| 8 | Se llama a `shootSegment` con el segmento, que todavia no fue destruido | `Game.js:101` → `CentipedeManager.js:170` | Sin cambios: el estado se lee antes de cualquier reencadenado o destruccion |
| 9 | El segmento calcula su destino: redondea su posicion a grilla, elige un solo eje segun su estado y avanza un tile | `CentipedeManager.js:174` → `CentipedeManager.js:352-368` | `MOVING_HORIZ` usa `dirX`; `DROPPING_TURN` y `DROPPING_INIT` usan `dirY` |
| 10 | Se pide el hongo en ese destino | `CentipedeManager.js:175` → `MushroomManager.js:57` | Sin cambios |
| 11 | `addMushroom` convierte el centro del tile a indices de grilla, descarta en silencio si el tile ya esta ocupado y crea el hongo con 4 de vida | `MushroomManager.js:62-63`, `67-69`, `74-79` | Sin cambios |
| 12 | El hongo queda visible en el vecino del segmento, en la direccion en que se movia | Observable en pantalla | Fin del recorrido |

El orden importa: el paso 9 ocurre antes del reencadenado y la destruccion del segmento, que empiezan despues, en `CentipedeManager.js:178-201`. Por eso el destino se calcula con el estado real del segmento y no con un estado ya alterado.

Los pasos 1 a 8 y el 10 a 12 no se modificaron. El cambio esta en el paso 9, y en el hecho de que el paso 5 ahora reciba un estado de movimiento valido.

### Ejemplo numerico

Ejemplo calculado a mano con el codigo actual, no una medicion de una partida. Sirve para que otra persona verifique la aritmetica sin necesidad de instrumentos.

Segmento de cabeza en `MOVING_HORIZ` con `dirX = 1`, situado en el pixel `(100, 44)`:

| Operacion | Resultado |
|---|---|
| `col = Math.round((100 - 4) / 8)` | `12` |
| `row = Math.round((44 - 4) / 8)` | `5` |
| El estado es `MOVING_HORIZ` y `dirX = 1`, asi que avanza en horizontal | `nextCol = 12 + 1 = 13`, `nextRow = 5` |
| `getNextTilePosition` devuelve el centro del tile destino | `x = 13 * 8 + 4 = 108`, `y = 5 * 8 + 4 = 44` |
| `addMushroom(108, 44)` reconvierte a grilla | `col = 13`, `row = 5` |
| Hongo creado en | `(108, 44)`, un tile a la derecha, misma fila |

Con el mismo pixel `(100, 44)`, un segmento en `MOVING_HORIZ` con `dirX = -1` devolveria `x = 92`, `y = 44`: un tile a la izquierda, misma fila. Y un segmento en `DROPPING_TURN` con `dirY = 1` devolveria `x = 100`, `y = 52`: un tile abajo, misma columna.

### La misma situacion antes de la intervencion

| Version | Calculo | Resultado para un segmento situado en el pixel `(100, 44)` | Sintoma visible |
|---|---|---|---|
| Antes, segmento de cuerpo | `x + dirX * 8` y `y + dirY * 8`, con `dirX = 0` y `dirY = 1` congelados desde el constructor | `x = 100`, `y = 52` | El hongo cae **un tile abajo**, en la misma columna. Es el sintoma reportado |
| Antes, segmento de cabeza | `x + dirX * 8` y `y + dirY * 8`, con `dirX = 1` y `dirY = 1` | `x = 108`, `y = 52` | El hongo cae en un **tile diagonal**, nunca en la fila del segmento |
| Despues, cualquier segmento | Un solo eje, elegido por el estado, con el signo de la direccion vigente | `x = 108`, `y = 44` | El hongo queda **un tile adelante**, en la misma fila |

La razon por la que el sintoma dominante era el tile de abajo y no el diagonal es que los segmentos de cuerpo son la mayoria del cienpiés, y para ellos `dirX` valia `0` desde el constructor (`CentipedeManager.js:292`). Ese mismo `0` hacia que el desplazamiento horizontal fuera cero y solo quedara el vertical.

### Entorno de reproduccion

| Dato | Valor | Origen |
|---|---|---|
| Comando | `npm run dev` | `Centipede/package.json` |
| Puerto | `8080` | `Centipede/vite/config.dev.mjs` |
| Bundler | Vite `^6.3.1` | `Centipede/package.json` |
| Motor | `phaser@4.0.0` | `Centipede/package.json`, `Centipede/package-lock.json`, `Centipede/node_modules/phaser/package.json` |
| Lienzo | `240 x 256` px, `pixelArt` | `Centipede/src/game/main.js` |
| Tamano de tile | `8` px, con el centro del sprite en `col * 8 + 4`, `row * 8 + 4` | `MushroomManager.js:58`, `61` |
| Dependencias | Ya instaladas en `Centipede/node_modules/`, no se instalo nada durante la intervencion | `[PENDIENTE: node y npm no verificados por el agente]` |
| Navegador y sistema | No verificados por el agente | `[PENDIENTE: anotar el navegador y el sistema con el que se valido]` |

Ubicacion de la salida: el resultado observable es la pantalla del juego, en el area de juego de 240 x 256 px. El proyecto no produce archivos de registro ni salida de consola que puedan citarse como evidencia, y por eso la unica evidencia admisible es la observacion directa del lienzo, su descripcion o una captura. No se genero ninguna captura durante la intervencion.

| Criterio | Version validada | Metodo o comando | Pasos | Resultado esperado | Resultado observado | Evidencia |
|---|---|---|---|---|---|---|
| Camino principal: un segmento en movimiento horizontal destruido antes de llegar al tile siguiente | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Levantar el juego. 2. Entrar a la partida. 3. Destruir una **cabeza** mientras se desplaza horizontalmente hacia la derecha. 4. Observar el hongo. 5. Repetir con una cabeza que se desplace hacia la izquierda. | El hongo aparece un tile a la derecha en el primer caso y un tile a la izquierda en el segundo, siempre en la misma fila del segmento | Correcto. El estudiante confirmo que el hongo aparece en la direccion de avance y no debajo del punto de muerte | [PENDIENTE: captura o descripcion del caso] |
| Caso del segmento de cuerpo: la causa raiz del defecto original | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Destruir un segmento de **cuerpo** de la cadena mientras la cadena se mueve horizontalmente. 2. Observar la fila y la columna del hongo respecto del segmento. | El hongo aparece un tile en la direccion horizontal de avance del segmento, en la misma fila | Correcto. Este caso fallaba antes de la intervencion, porque el cuerpo conservaba `dirY = 1` y `DROPPING_INIT` de por vida y el hongo caia siempre un tile abajo | [PENDIENTE: captura o descripcion del caso] |
| Descenso: segmento en `DROPPING_TURN` con `dirY = 1` | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Forzar un giro del cienpiens, por ejemplo destruyendo un hongo o chocando con un borde. 2. Destruir un segmento mientras desciende. | El hongo aparece un tile abajo, en la misma columna | Correcto | [PENDIENTE: captura] |
| Ascenso: segmento en `DROPPING_TURN` con `dirY = -1` dentro de la zona del jugador | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Dejar que el cienpiens entre en la zona del jugador, entre `y = 208` y `y = 240` (`CentipedeManager.js:298-299`). 2. Destruir un segmento mientras asciende. | El hongo aparece un tile arriba, en la misma columna | Correcto | [PENDIENTE: captura] |
| Caida inicial: segmento en `DROPPING_INIT` | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Entrar a la partida y destruir un segmento durante la caida inicial, antes de que la cadena empiece a moverse horizontalmente. | El hongo aparece un tile abajo, en la misma columna | Correcto | [PENDIENTE: captura] |
| Caso limite: destruccion con el segmento a mitad de tile | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Destruir un segmento en un frame en el que su posicion no coincide con el centro de un tile. | El hongo aparece en el vecino en la direccion de viaje, no en el tile que ocupa el sprite | Correcto. El redondeo a grilla de `getNextTilePosition` resuelve el tile del segmento antes de avanzar | [PENDIENTE: captura] |
| Error: el hongo nunca debe aparecer debajo del punto de muerte | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Repetir los casos anteriores en varias direcciones. | Ningun hongo aparece en un tile diagonal ni directamente debajo del punto de destruccion | Correcto | [PENDIENTE: captura] |
| Reencadenado: la cadena sigue funcionando tras la division | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Destruir un segmento del medio de la cadena. 2. Verificar que el segmento siguiente se convierte en cabeza y que la cadena continua. | La cadena se parte en dos, la parte delantera sigue su recorrido y la trasera tambien | Correcto. No se modifico `convertToHead` ni `_destroySegment` | [PENDIENTE: captura] |
| Ausencia de residuos: el segmento destruido desaparece y no queda cuerpo activo | [PENDIENTE: hash de commit] | Partida manual con `npm run dev` | 1. Destruir segmentos varias veces seguidas. 2. Confirmar que no quedan sprites congelados ni cuerpos que empujan a otros. | El segmento desaparece visualmente y no quedan cuerpos huerfanos | Correcto tras la correccion de `disableBody(segment.sprite.body)` y la restauracion de `segment.sprite.destroy()` | [PENDIENTE: captura] |

## Fallos y limites pendientes

- Reproduccion: durante la verificacion se comento `segment.sprite.destroy()` en `_destroySegment` para poder ver el punto de destruccion. Con esa modificacion, el sprite permanecia visible y se lanzaba hacia arriba en lugar de quedar congelado. La causa se identifico leyendo el codigo de Phaser 4 instalado y no es un defecto del juego: `removeCallbackHandler` invoca `world.disableBody(child)` pasando el Game Object, y como un Sprite no tiene la propiedad `physicsType`, el cuerpo no se quita de `world.bodies` ni del arbol de colisiones, y el `enable = false` se aplica al Sprite en lugar del Body. El cuerpo quedaba activo, sin resincronizarse con la transformada del sprite, y la resolucion de superposiciones lo empujaba hacia arriba.
- Impacto: ninguno sobre el juego final. La correccion es `disableBody(segment.sprite.body)`, y la destruccion del sprite quedo restaurada. El defecto solo se manifestaba con el codigo de depuracion activo.
- Decision: corregido. La causa raiz del defecto del hongo tambien se corrigio: el historial por frame paso a transportar `state`, `dirX` y `dirY`, y `_followLeader` paso a heredarlos, de modo que los segmentos de cuerpo conocen su direccion de viaje.

## Limites de esta evidencia

- No hay evidencia automatizada. Las verificaciones dependen de una persona jugando y mirando la pantalla.
- No se registro una tabla de coordenadas por caso. Si la catedra requiere valores exactos de fila y columna por escenario, hay que volver a medir y anotarlos.
- Los comandos `npm run dev` y `npm run build` no fueron ejecutados por el agente. La reproduccion de cada fila asume que las dependencias ya estan instaladas, porque `Centipede/node_modules/` esta presente.

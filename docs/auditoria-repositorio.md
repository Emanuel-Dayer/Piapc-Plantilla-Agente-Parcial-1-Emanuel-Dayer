# Auditoria del repositorio

## Objetivo

Registrar hechos verificables sobre la estructura, arquitectura y validacion del proyecto antes de proponer cambios.

Proyecto auditado: Centipede. Motor declarado en la documentacion: Phaser 3. Version efectivamente instalada segun `Centipede/package.json`, `Centipede/package-lock.json` y `Centipede/node_modules/phaser/package.json`: **4.0.0**.

## Rutas y simbolos relevantes

| Ruta o simbolo | Rol observado | Evidencia |
|---|---|---|
| `Centipede/src/game/objects/CentipedeManager.js:170-175` | `shootSegment(segment)`: punto unico que decide donde aparece el hongo al destruir un segmento | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:352-368` | `CentipedeSegment.getNextTilePosition()`: calcula el centro en pixeles del siguiente tile al que se dirige el segmento | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:311-320` | Historial por frame: guarda `x`, `y`, `flipX`, `state`, `dirX`, `dirY` | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:452-468` | `_followLeader()`: replica posicion y estado de movimiento del lider hacia el segmento que lo sigue | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:292-294` | Estado inicial de todo segmento: `dirX = 0`, `dirY = 1`, `state = 'DROPPING_INIT'` | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:370-418` | Maquina de estados del ciempies: `DROPPING_INIT`, `MOVING_HORIZ`, `DROPPING_TURN` | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:420-449` | `_checkObstacles()`: detiene el avance contra hongos, araña, pulga, escorpion y otros segmentos | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:477-502` | `convertToHead()`: reencadena la cadena tras un disparo y reinicia el estado | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:102-118` | `update()`: recorre cada cadena desde cada entrada de `heads` | Lectura directa del archivo |
| `Centipede/src/game/objects/CentipedeManager.js:208-235` | `_destroySegment()`: desconecta el segmento, lo saca de `heads` y `allSegments`, y destruye su sprite | Lectura directa del archivo |
| `Centipede/src/game/objects/MushroomManager.js:57-80` | `addMushroom(px, py)`: convierte pixeles a grilla, evita duplicados y crea el hongo | Lectura directa del archivo |
| `Centipede/src/game/objects/MushroomManager.js:62-63` | Conversion a grilla: `Math.round((px - 4) / 8)`, centrado en `col * 8 + 4` | Lectura directa del archivo |
| `Centipede/src/game/objects/MushroomManager.js:67-69` | Descarte silencioso si el tile destino ya esta ocupado | Lectura directa del archivo |
| `Centipede/src/game/scenes/Game.js:91-103` | Colision bala contra ciempies: suma puntos, dibuja explosion y llama a `shootSegment` | Lectura directa del archivo |
| `Centipede/src/game/main.js:8-40` | Configuracion del juego: 240x256, `pixelArt`, fisica Arcade sin gravedad, `Scale.FIT` | Lectura directa del archivo |
| `Centipede/package.json:17-22` | Scripts disponibles: `dev`, `dev-nolog`, `build`, `build-nolog` | Lectura directa del archivo |
| `Centipede/node_modules/phaser/src/gameobjects/group/Group.js:675-709` | `Group.remove(child, removeFromScene, destroyChild)`: los dos ultimos parametros valen `false` por defecto | Lectura del codigo de Phaser 4 instalado |
| `Centipede/node_modules/phaser/src/physics/arcade/PhysicsGroup.js:248-254` | `removeCallbackHandler()`: invoca `world.disableBody(child)` pasando el Game Object y no `child.body` | Lectura del codigo de Phaser 4 instalado |
| `Centipede/node_modules/phaser/src/physics/arcade/World.js:637-642` | `disableBody()`: delega en `remove()` y luego asigna `enable = false` | Lectura del codigo de Phaser 4 instalado |
| `Centipede/node_modules/phaser/src/physics/arcade/World.js:657-669` | `remove()`: decide con `physicsType`; un Sprite no tiene esa propiedad | Lectura del codigo de Phaser 4 instalado |
| `Centipede/node_modules/phaser/src/physics/arcade/Body.js:840` | `physicsType` existe en `Body`, no en los Game Objects | Lectura del codigo de Phaser 4 instalado |

## Flujo observado

1. El jugador dispara con la tecla de shoot. `Game.update()` (`Game.js:87-125`) toma la bala activa y pide colisiones contra hongos, ciempiés, araña, pulga y escorpión.
2. En la colisión contra el ciempiés (`Game.js:91-103`), el callback obtiene el segmento desde `centipedeSprite.getData('segment')`, suma 100 o 10 puntos, dibuja la explosion en la posicion del segmento, destruye la bala y llama a `centipedeManager.shootSegment(segment)`.
3. `shootSegment` (`CentipedeManager.js:170`) pide el destino del hongo **antes** de reencadenar o destruir: `segment.getNextTilePosition()` y despues `mushroomManager.addMushroom(...)`.
4. `getNextTilePosition` (`352-368`) redondea la posicion del sprite a indices de grilla con la misma convencion que `MushroomManager.addMushroom` (`Math.round((px - 4) / 8)`) y avanza un unico tile en el eje que el segmento esta usando segun su estado: `MOVING_HORIZ` usa `dirX`, `DROPPING_TURN` y `DROPPING_INIT` usan `dirY`. Devuelve el centro de ese tile en pixeles.
5. `addMushroom` (`MushroomManager.js:57-80`) convierte ese centro a indices de grilla, descarta en silencio si el tile ya esta ocupado, y crea el sprite con `health = 4` en `col * 8 + 4`, `row * 8 + 4`.
6. El comportamiento observable ocurre en el paso 4 a 5: el hongo queda en el vecino del segmento en la direccion de su viaje, nunca en diagonal ni directamente debajo.

Como llega la direccion de viaje hasta el hongo:

- Las cabezas ejecutan `_updateHeadBehavior()` y mantienen su propio `state`, `dirX` y `dirY`.
- Los segmentos de cuerpo no ejecutan la maquina de estados: ejecutan `_followLeader()` (`452-468`), que copia del historial del lider la posicion, el `flipX` y tambien `state`, `dirX` y `dirY`. Por eso el hongo de un segmento de cuerpo se ubica igual que el de una cabeza.

## Pruebas y comandos disponibles

| Comando o prueba | Que verifica | Resultado inicial |
|---|---|---|
| `npm run dev` | Levanta el juego en el puerto 8080 (`Centipede/vite/config.dev.mjs:14-16`) para verificar la posicion del hongo en ejecucion | No ejecutado por el agente: requiere autorizacion expresa |
| `npm run dev-nolog` | Igual que el anterior sin el log de inicio de `Centipede/log.js` | No ejecutado por el agente |
| `npm run build` | Genera la distribucion de produccion con Vite | No ejecutado por el agente |
| `npm run build-nolog` | Igual que el anterior sin el log de inicio | No ejecutado por el agente |
| Partida manual disparando con la tecla de shoot | Verifica en ejecucion que el hongo aparece en el siguiente tile del recorrido del segmento | Verificado por el estudiante el 2026-09-26, que confirmo el comportamiento correcto |

No existe infraestructura de pruebas automatizadas en el repositorio: no se encontraron archivos `*.test.js` ni `*.spec.js` y `Centipede/package.json` no define ningun script de test.

## Limites de la arquitectura

Estos limites son del diseno del proyecto y condicionan donde era correcto resolver el problema. No se modificaron.

- El cienpiés usa una arquitectura de managers. `CentipedeManager` es el unico que conoce la cadena de segmentos y `MushroomManager` el unico que crea hongos. No hay un segundo call site de `addMushroom`: esta en `CentipedeManager.js:175`. Por eso el defecto no se podia corregir en la escena sin duplicar la decision de posicion.
- `CentipedeSegment` concentra tres responsabilidades en una sola clase: el cuerpo fisico, la maquina de estados de movimiento y el historial de posiciones. La clase se instancia igual para cabezas y para cuerpo, pero solo las cabezas ejecutan `_updateHeadBehavior` (`CentipedeManager.js:304-308`). Esa asimetria es la que permitio que un segmento de cuerpo conservara valores de estado obsoletos sin que nada lo indicara.
- Los segmentos de cuerpo no derivan su estado de su propia posicion, sino del historial de su lider, con un retardo de `Math.round(9 / this.speed)` frames (`CentipedeManager.js:455`). Durante los primeros frames de la cadena, el historial del lider todavia no tiene entradas suficientes y el segmento conserva los valores del constructor.
- La convencion de grilla esta duplicada en dos formas distintas: `Math.round((px - 4) / 8)` en `MushroomManager.addMushroom` y en `getNextTilePosition`, y `Math.floor(x / 8) * 8 + 4` en `convertToHead` (`484-485`). No hay una constante compartida que la fije.
- La colision de la bala contra el cienpiés se resuelve en la escena, no en el manager: `Game.js:91-103` lee el segmento con `getData('segment')`, accede a `segment.sprite.x` e `y`, suma puntos, dibuja la explosion y despues llama al manager. La escena depende de los internos del segmento.
- `CentipedeManager.update()` (`102-118`) recorre cada cadena desde cada entrada de `heads` con un `while` sin control de visited, de modo que una cadena alcanzable desde dos entradas se actualiza dos veces por frame.
- El estado de la ronda vive en la escena y no en un manager de rondas: `Game.js:29` fija la ronda inicial y `Game.js:136-137` la incrementa de 2 a 4.
- No hay separacion entre logica y presentacion. `getNextTilePosition` es logica pura y calculable sin Phaser, pero vive en una clase que administra un cuerpo del motor, lo que impide probarla sin levantar el juego.

## Hechos, supuestos y preguntas abiertas

- Hechos comprobados:
  - `dirX` y `dirY` son ejes ortogonales y el que no se esta usando conserva un valor obsoleto: en `MOVING_HORIZ` solo se modifica la X (`CentipedeManager.js:407`) y en `DROPPING_TURN` solo la Y (`411`).
  - Antes de la intervencion, `shootSegment` sumaba 8 pixeles en los dos ejes a la vez, por lo que el hongo caia en un tile diagonal y nunca en la fila del segmento.
  - Los segmentos de cuerpo no recibian `state`, `dirX` ni `dirY`: el historial solo transportaba `x`, `y` y `flipX`. Por eso conservaban `dirX = 0`, `dirY = 1` y `DROPPING_INIT` (`292-294`) y su hongo caia siempre un tile abajo, en la misma fila y columna.
  - El codigo de Phaser 4 instalado desactiva el cuerpo del segmento de forma incorrecta al quitarlo de un grupo fisico: `removeCallbackHandler` pasa el Game Object a `disableBody`, y como un Sprite no tiene `physicsType`, el cuerpo no se saca de `world.bodies` ni del arbol de colisiones, y el `enable = false` se aplica al Sprite en lugar del Body. Esto se comprobo leyendo el codigo de Phaser, no ejecutando el juego.
  - El proyecto tiene dos repositorios git anidados: el padre y `Centipede/`, cada uno con su `.git` y su `.gitignore`.
  - `README.md:19` y `Centipede/README.md:8` declaran Phaser 3, mientras `Centipede/package.json:28` fija Phaser 4.0.0.
  - `Centipede/package.json:2-15` conserva los metadatos de la plantilla oficial de Phaser: `name: "template-vite"`, `author: "Phaser Studio"` y `repository` apuntando a `phaserjs/template-vite`.
  - El codigo del juego contiene marcadores `[cite: N]` que `docs/README.md:25` pide retirar antes de entregar.
  - `Centipede/src/game/Reglas.md` describe rondas de doce segmentos mientras `Game.js:29` inicia en ronda 2 y `Game.js:136-137` salta de la ronda 2 a la 4.
- Supuestos por verificar:
  - Que la direccion observada en pantalla durante la verificacion manual correspondia a los criterios de `docs/especificacion.md` y no a un caso no cubierto por la prueba. El estudiante confirmo el resultado correcto, pero no se registro una tabla de coordenadas por caso.
  - Que la convencion de grilla elegida, `Math.round((px - 4) / 8)`, es la definitiva. `convertToHead` (`484-485`) sigue usando `Math.floor(x / 8) * 8 + 4`, que es otra convencion.
- Preguntas para consultar:
  - Que version de Phaser debe declarar la documentacion, 3 o 4, ya que el proyecto instala 4.0.0.
  - Cual de los dos repositorios anidados es el entregable y donde deben quedar los commits y la evidencia.
  - Si el repositorio anidado `Centipede/` debe seguir siendo independiente o incorporarse al padre.
  - Que convencion de grilla se adopta como unica verdad para el proyecto.
  - Si el destino del hongo debe recortarse cuando cae fuera del area visible, por ejemplo `dirX = -1` con `x = 4` produce `col = -1`.
  - Si se desea una prueba automatizada para `getNextTilePosition` y `addMushroom`, dado que no hay infraestructura de test.

# Plan de intervencion

## Objetivo del plan

Hacer que el hongo aparezca en el siguiente tile al que se dirigia el segmento destruido, sin modificar el movimiento del cienpiés, los disparos, los demas enemigos ni ninguna otra mecanica, y conservando el motor, el lenguaje y la arquitectura existentes.

El plan actua sobre el origen del dato, no sobre el calculo final. El diagnostico mostro dos defectos encadenados: el calculo aplicaba un desplazamiento de ocho pixeles en los dos ejes a la vez, y ademas los segmentos de cuerpo nunca recibian el estado de movimiento de su lider. Corregir solo el calculo dejaba el error intacto en los segmentos de cuerpo, que son la mayoria de los segmentos del juego.

## Cambios propuestos

| Paso | Cambio minimo | Archivos previstos | Verificacion | Riesgo | Condicion de detencion |
|---:|---|---|---|---|---|
| 1 | El historial por frame pasa a guardar `state`, `dirX` y `dirY` junto a `x`, `y` y `flipX` | `Centipede/src/game/objects/CentipedeManager.js` | Partida manual: destruir un segmento de cuerpo en movimiento horizontal y comprobar que el hongo aparece en su direccion de viaje | Que el historial crezca en memoria por frame; se mantiene el limite de veinte entradas ya existente | Si el historial empieza a retener mas de veinte entradas o a perder posiciones |
| 2 | `_followLeader()` hereda `state`, `dirX` y `dirY` del mismo registro del historial del que copia la posicion | `Centipede/src/game/objects/CentipedeManager.js` | Partida manual: un segmento de cuerpo sigue al lider y hereda su direccion sin desviarse de la cadena | Que heredar el estado altere el movimiento; no debe, porque el cuerpo sigue copiando la posicion y no lee su propio estado para moverse | Si un segmento de cuerpo deja de seguir a su lider o cambia de posicion vertical sin girar |
| 3 | Nuevo `CentipedeSegment.getNextTilePosition()`: redondea la posicion a grilla y avanza un unico tile en el eje que corresponde al estado | `Centipede/src/game/objects/CentipedeManager.js` | Partida manual en los tres estados: `MOVING_HORIZ` con `dirX` de ambos signos, `DROPPING_TURN` con `dirY` de ambos signos y `DROPPING_INIT` | Que el redondeo displace el destino un tile cuando el segmento esta a mitad de tile | Si el hongo aparece en un tile diagonal o en un tile distinto del vecino esperado |
| 4 | `shootSegment()` consume el destino calculado en lugar de sumar ocho pixeles por eje | `Centipede/src/game/objects/CentipedeManager.js` | Partida manual: el hongo nunca aparece debajo del punto de muerte | Ninguno esperado: el resto de `shootSegment` no cambia | Si la reencadenada de la cadena o la destruccion dejan de funcionar |
| 5 | Correccion de la desactivacion del cuerpo fisico al quitar el sprite del grupo | `Centipede/src/game/objects/CentipedeManager.js` | Con `destroy()` restaurado, comprobar que el segmento desaparece y que no quedan sprites residuales | Ninguno esperado: la llamada recibe el `body` y no el Game Object | Si el sprite del segmento queda visible o si el cuerpo sigue colisionando |

Detalle del paso 5: durante la verificacion se observo que al quitar el sprite del grupo sin destruirlo, el sprite permanecia visible y ademas se lanzaba hacia arriba. La causa no estaba en el codigo del juego sino en Phaser 4: `removeCallbackHandler` invoca `world.disableBody(child)` pasando el Game Object, y como un Sprite no tiene la propiedad `physicsType`, el cuerpo no se saca de la simulacion y el `enable = false` se aplica al Sprite en lugar del Body. El cuerpo quedaba activo, sin resincronizar con el sprite, y era empujado por la resolucion de superposiciones. La correccion es pasarle el cuerpo. Se restauro ademas la destruccion del sprite, que habia quedado comentada para depuracion.

## Orden de implementacion

El orden importa porque cada paso construye sobre el anterior.

1. Primero el historial (paso 1), porque sin `state`, `dirX` y `dirY` en los registros no hay nada que propagar.
2. Segundo la herencia en `_followLeader` (paso 2), que es la causa raiz. Sin este paso, el calculo del destino solo seria correcto para las cabezas y el sintoma persistiria para los segmentos de cuerpo, que es lo que ocurrio en una primera intervencion.
3. Tercero el calculo del destino (paso 3), que ya puede confiar en un estado de movimiento valido para cualquier segmento.
4. Cuarto el consumo en `shootSegment` (paso 4), que activa el comportamiento.
5. Quinto la correccion del cuerpo fisico (paso 5), que es ortogonal al problema del hongo y se realizo durante la verificacion.

Antes de avanzar del paso 2 al 3 hay que comprobar que los segmentos de cuerpo siguen al lider correctamente, porque un error de herencia se manifestaria como un movimiento alterado y no como un error de posicion del hongo.

## Fuera de alcance

- No se modifica el movimiento general del cienpiés: `_updateHeadBehavior`, `_checkObstacles` y el calculo de `targetY` quedan intactos.
- No se modifican el sistema de disparos, el jugador ni los otros enemigos.
- No se cambia la firma de `MushroomManager.addMushroom(px, py)`: recibe el centro del tile ya alineado, de modo que su conversion a grilla queda idempotente. El unico call site esta en `CentipedeManager.js:175`.
- No se unifica la convencion de grilla con la de `convertToHead`, que sigue usando `Math.floor(x / 8) * 8 + 4`.
- No se agrega recorte de rango para el destino del hongo cuando cae fuera del area visible.
- No se modifica el descarte silencioso de `addMushroom` cuando el tile destino ya esta ocupado.
- No se implementa una prueba automatizada, porque el proyecto no tiene infraestructura de test y sumarla cambia el alcance.
- No se corrige el hecho de que `update()` pueda recorrer dos veces la misma cola cuando una cadena queda alcanzable desde dos entradas de `heads`, ni los marcadores `[cite: N]` del codigo.

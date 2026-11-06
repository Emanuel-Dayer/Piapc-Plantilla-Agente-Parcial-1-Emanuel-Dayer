# Especificacion

## Problema

Al destruir un segmento del cienpiés, el sistema genera el hongo debajo del lugar donde fue destruido.

## Resultado esperado

Cuando un segmento del cienpiés sea destruido, el sistema debe generar el hongo en el siguiente tile al que ese segmento se dirigía.

## Alcance

- Incluye: Corrección de la lógica que determina la posición donde aparece el hongo al destruir un segmento del cienpiés.
- No incluye: Modificaciones al movimiento general del cienpiés, disparos, otros enemigos, controles, niveles u otras mecánicas que no estén relacionadas con la generación del hongo.

## Restricciones

- Tecnicas: Mantener el motor, lenguaje y arquitectura existentes del proyecto.
- Operativas: No modificar comportamientos que no estén relacionados con la generación del hongo al destruir un segmento.
- De calidad: La posición del hongo debe ser consistente con el siguiente tile del recorrido del segmento y debe comprobarse mediante pruebas en diferentes posiciones y direcciones de movimiento.

## Casos y criterios de aceptacion

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Camino principal | Un segmento del cienpiés está desplazándose hacia un siguiente tile. | El jugador destruye el segmento antes de llegar a dicho tile. | El hongo aparece en el siguiente tile al que el segmento se dirigía. | Prueba de juego y comprobación de la posición del hongo. |
| Segmento de cuerpo | Un segmento que no es cabeza sigue a su líder y hereda su dirección de viaje. | El jugador destruye el segmento de cuerpo. | El hongo aparece en el siguiente tile al que se dirigía, igual que si fuera una cabeza. | Partida manual sobre un segmento de cuerpo en movimiento horizontal. |
| Caída inicial | Un segmento está en `DROPPING_INIT` y desciende hacia el primer tile de su fila. | El jugador destruye el segmento durante esa caída. | El hongo aparece un tile abajo, en la misma columna. | Partida manual sobre la cadena recién aparecida. |
| Ascenso en la zona del jugador | Un segmento está en `DROPPING_TURN` con `dirY = -1` dentro de la zona del jugador. | El jugador destruye el segmento mientras asciende. | El hongo aparece un tile arriba, en la misma columna. | Partida manual con el cienpiés entre `y = 208` y `y = 240`. |
| Caso limite | Un segmento está próximo a cambiar de dirección o se encuentra entre dos tiles. | El jugador destruye el segmento. | El hongo aparece utilizando correctamente el siguiente tile correspondiente a su recorrido. | Prueba de destrucción cerca de un cambio de dirección. |
| Error | Un segmento del cienpiés está desplazándose. | El segmento es destruido. | El comportamiento se considera incorrecto si el hongo aparece debajo del punto donde murió el segmento en lugar de aparecer en su siguiente tile al que se dirigia. | Registro de la posición del segmento y del hongo generado. |

## Invariantes

- El hongo generado debe corresponder al segmento destruido.
- La posición del hongo debe estar determinada por el siguiente tile del recorrido del segmento.
- El hongo no debe generarse automáticamente debajo de la posición actual del segmento.
- El hongo nunca debe aparecer en un tile diagonal: el desplazamiento se aplica sobre un único eje.
- La corrección no debe alterar el movimiento normal del cienpiés.
- `MushroomManager.addMushroom(px, py)` conserva su firma y recibe el centro de un tile ya alineado, por lo que su conversión a grilla no desplaza el destino.

## Preguntas abiertas

Resueltas durante la intervencion, con respuesta verificada en el codigo:

- **¿Cómo representa actualmente el juego el siguiente tile o destino de movimiento de cada segmento?** No lo representa de forma explicita. El destino se deducia del estado de movimiento. `CentipedeSegment` mantiene `state`, `dirX` y `dirY` (`CentipedeManager.js:292-294`), y `_updateHeadBehavior` los actualiza en `MOVING_HORIZ` y `DROPPING_TURN`. El siguiente tile se calcula con `getNextTilePosition()` (`352-368`).
- **¿El sistema de movimiento ya almacena la próxima posición del segmento o es necesario calcularla al momento de la destrucción?** Es necesario calcularla. No existe un destino almacenado. El cálculo se hace al destruir el segmento y usa el único eje que el segmento está usando según su estado, con el signo de la dirección vigente.

Preguntas que siguen abiertas y requieren decisión del estudiante:

- ¿Qué versión de Phaser se declara? El proyecto instala 4.0.0, pero la documentación declara Phaser 3.
- ¿Qué convención de grilla se adopta como única verdad? Hoy conviven `Math.round((px - 4) / 8)` en `addMushroom` y `getNextTilePosition`, y `Math.floor(x / 8) * 8 + 4` en `convertToHead` (`484-485`).
- ¿El destino del hongo debe recortarse cuando queda fuera del área visible? Con `dirX = -1` y `x = 4` se pide `col = -1`.
- ¿Se mantiene el descarte silencioso cuando el tile destino ya está ocupado (`MushroomManager.js:67-69`)?
- ¿Se requiere una prueba automatizada para `getNextTilePosition` y `addMushroom`? El proyecto no tiene infraestructura de test.
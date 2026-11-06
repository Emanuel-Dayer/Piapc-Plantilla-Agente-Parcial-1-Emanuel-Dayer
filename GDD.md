# GDD simplificado

## Juego y experiencia

- Genero y situacion de juego: shoot 'em up arcade 2D recreando los primeros niveles de Centipede. El jugador debe eliminar enemigos, evitar sus ataques y superar los dos niveles incluidos en el juego.
- Rol del jugador: Controlar al personaje y destruir los segmentos del cienpiés mediante disparos.
- Experiencia buscada: Al destruir un segmento del cienpiés, el hongo debe aparecer en el siguiente tile al que ese segmento se dirigía, manteniendo el comportamiento esperado del juego original.

## Comportamiento a resolver

- Entidad: Segmento del cienpiés y hongo generado al destruirlo.
- Problema actual: Al destruir un segmento del cienpiés, el hongo aparece debajo de la posición donde fue destruido el segmento, en lugar de aparecer en el siguiente tile de su recorrido.
- Comportamiento esperado: El hongo debe aparecer en el siguiente tile al que el segmento del cienpiés se dirigía en el momento de ser destruido.

## Reglas

- Estados, condiciones o eventos relevantes: Un segmento del cienpiés se encuentra desplazándose hacia un siguiente tile y puede ser destruido por un disparo del jugador.
- Accion del jugador o del entorno: El jugador dispara y destruye un segmento del cienpiés.
- Resultado esperado: El sistema identifica el siguiente tile del recorrido del segmento y genera allí el hongo correspondiente.
- Caso limite: El segmento es destruido cerca de un cambio de dirección o mientras se encuentra entre dos tiles de movimiento.

## Limites

- Fuera de alcance: No se modifica el movimiento general del cienpiés, el comportamiento de los demás enemigos, el sistema de disparos ni las demás mecánicas del juego.
- Restricciones tecnicas: La corrección debe realizarse dentro del sistema existente del juego, manteniendo el motor, lenguaje y arquitectura actuales.
- Criterios de aceptacion: Al destruir un segmento, el hongo aparece en el siguiente tile de su recorrido y no directamente debajo de la posición donde fue destruido.
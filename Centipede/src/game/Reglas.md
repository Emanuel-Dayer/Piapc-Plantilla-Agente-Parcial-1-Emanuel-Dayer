•	Pasar de nivel: al destruir todos los segmentos del Centipede, inmediatamente sale otro desde arriba. 
Al perder todas las vidas volvemos al menu inicial
3. Sistema de Enemigos e Interacciones
Centipedes (Ciempiés)
•	Composición: Inicia con 12 segmentos (1 cabeza y 11 cuerpo)
•	Evolución de Ronda: Cada nueva ola el ciempiés base tiene un segmento menos, sustituido por una cabeza extra independiente que planea en la misma fila que el Centipede, y sale igual, pero en una columna aleatoria, se mueve siempre a 2 px/frame. El Centipede se reinicia después de una ronda con 12 cabezas.
•	En las rondas impares a se mueve a 2 px/frame y en las pares a 1 px/frame.
•	Cabezas Extra: Solo si el cualquier segmento llega al área de movimiento del jugador, y además hay menos de doce segmentos en pantalla
Las cabezas huérfanas siempre tienen una velocidad de 2 px/frame
•	Envenenamiento: Al tocar un hongo envenenado (por escorpión), cae verticalmente hasta el fondo a 2 px/frame, vuelve a la velocidad y comportamiento que tenía antes al tocar el fondo. 
Fleas (Pulgas) y Scorpions (Escorpiones)
•	Flea: Aparece desde Ronda 2, si hay < 5 hongos (a 120 000 puntos es si hay 9 o menos, el umbral sube +1 cada 20k puntos tras los 120k). 
•	Scorpion: Desde Ronda 4 Movimiento horizontal (1 px/frame)
4. Tabla de Puntajes y Escalamiento
Objetivo	Puntos
Hongo	1 (destruir) / 5 (regenerar) 
Ciempiés	100 (cabeza) / 10 (segmento) 
Flea 200 
Scorpion 1000 

5. Hitos de Dificultad
•	5,000 pts: Arañas y escorpiones aceleran de 1px/f a 2px/f para siempre. 
•	10,000 pts: Ritmo de salida de nuevos segmentos disminuye 1s; delay de cabezas -2 frames. Vida extra
•	20,000 pts: Escorpión tiene 75% prob. de aparecer a 2 px/frame. 
•	40,000 pts: Velocidad del ciempiés sube a 2 px/frame para todas las rondas. 
•	60,000 pts: Pulga acelera a 3 px/frame; araña empieza a restringir su área vertical (baja 1 fila cada 24k pts hasta el límite de la fila 6). 
•	860,000 pts: La araña recupera su capacidad de subir hasta la fila 12. 

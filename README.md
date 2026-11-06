# Plantilla PIAPC para repositorios individuales

Esta plantilla prepara un repositorio publico e individual para proyectos academicos de videojuegos. Es independiente del motor, lenguaje y tipo de juego.

## Como usarla

1. Crea un repositorio individual desde esta plantilla y conserva el commit inicial.
2. Completa los datos de este archivo y de `GDD.md` cuando la consigna defina el problema de diseno.
3. Agrega el proyecto creado con el motor elegido, sin mezclar archivos de otros motores.
4. Incorpora al `.gitignore` las reglas oficiales o recomendadas para ese motor.
5. Completa los documentos de `docs/` en el orden indicado por `docs/README.md`.
6. Conserva commits pequenos y revisables durante el desarrollo.

## Datos del proyecto

- Estudiante: Emanuel Dayer
- Materia, comision y anio: Programación de IA y Patrones de Comportamiento - VJ - 2026.
- Nombre del proyecto: Centipede
- Motor y version: Phaser 3. El proyecto instala `phaser@4.0.0` segun `Centipede/package.json`. La diferencia entre la version declarada y la instalada queda abierta y documentada en `docs/informe-final.md`.
- Estado: Intervencion implementada y validada.

## Descripcion

El videojuego es una recreacion del clasico videojuego arcade Centipede, el cual es un shoot 'em up 2D, donde el jugador controla un personaje en la
parte inferior de la pantalla, y debe eliminar enemigos que descienden en patrones
dinámicos, mientras evita obstáculos y gestiona el espacio del juego

## Problema de diseno trabajado

Al destruir un segmento del cienpiés, el hongo aparecia debajo de la posicion donde fue destruido, en lugar de aparecer en el siguiente tile al que ese segmento se dirigia. La intervencion y sus criterios de aceptacion estan definidos en `GDD.md` y en `docs/especificacion.md`.

## Documentacion del proceso

Los artefactos obligatorios se encuentran en `docs/`. Cada uno responde una pregunta distinta:

| Documento | Pregunta que responde |
|---|---|
| [`GDD.md`](GDD.md) | Que se busca: experiencia de juego, problema concreto, conducta esperada, reglas, limites y caso limite |
| [`docs/auditoria-repositorio.md`](docs/auditoria-repositorio.md) | Que se sabe del proyecto: rutas, simbolos, flujo observado, pruebas, comandos, hechos, supuestos y preguntas abiertas |
| [`docs/especificacion.md`](docs/especificacion.md) | Que se aceptara: alcance, restricciones y criterios observables |
| [`docs/plan.md`](docs/plan.md) | Como se interviene: cambios minimos, archivos, verificaciones, riesgos y condiciones de detencion |
| [`docs/matriz-permisos.md`](docs/matriz-permisos.md) | Que se autorizo: acciones permitidas, prohibidas y que requieren consulta |
| [`docs/registro-intervencion.md`](docs/registro-intervencion.md) | Que ocurrio: instruccion, accion, resultado observable y decision humana, con las correcciones y rechazos |
| [`docs/evidencia-pruebas.md`](docs/evidencia-pruebas.md) | Como se comprobo: cada criterio con su comando o secuencia manual, resultado y version validada |
| [`docs/informe-final.md`](docs/informe-final.md) | Que limites siguen abiertos: resultado, decisiones, controles humanos, validaciones y riesgos |

Material de apoyo de la plantilla: [`docs/README.md`](docs/README.md) define el orden de trabajo y [`docs/prompt-inicial-opencode.md`](docs/prompt-inicial-opencode.md) contiene la consulta inicial de solo lectura.

## Estructura

```
/
├── GDD.md
├── README.md
├── docs/                       artefactos del proceso
└── Centipede/                  proyecto Phaser, repositorio git anidado
    ├── package.json            scripts dev, dev-nolog, build, build-nolog
    ├── public/
    │   └── assets/             atlas, spritesheet, audio y fondos
    ├── src/                    codigo del juego
    │   ├── main.js
    │   └── game/
    │       ├── main.js         configuracion del juego
    │       ├── scenes/         Boot, Preload, MainMenu, Game
    │       ├── objects/        managers del juego y CentipedeManager.js
    │       └── utils/          entrada, interfaz y texto
    └── vite/                   configuracion de Vite
```

La consigna sugiere `src/` y `tests/` en la raiz. Este proyecto conserva su estructura original: el codigo esta en `Centipede/src/`. No existe directorio `tests/` porque el proyecto no tiene infraestructura de pruebas automatizadas, y todas las verificaciones son manuales sobre el juego en ejecucion. Los artefactos requeridos siguen siendo localizables desde este README.

## Requisitos y ejecucion

- Framawork: Phaser 3 declarado; `phaser@4.0.0` instalado.
- Lenguaje: Javascript
- Herramientas adicionales: Vite, como bundler.

## Controles

- WASD para moverse
- Espacio para disparar

## Creditos

- Assets: Extraidos de centipede
- Tipografías: Extraida de centipede
- Plugins: propios, no se utilizan plugins de terceros.
- Código: código propio desarrollado para el proyecto.
- Referencias: GDD y documentación del proyecto.
- Licencias de terceros: Centipede (Atari 1981)

## Entrega o demostracion

- Herramienta: OpenCode. Modelo: Big Pickle.
- Validacion: no hay comandos de prueba automatizados. La validacion fue una secuencia manual reproducible con `npm run dev`, registrada en `docs/evidencia-pruebas.md`.
- URL del repositorio: https://github.com/Emanuel-Dayer/Piapc-Plantilla-Agente-Parcial-1-Emanuel-Dayer
- Commit de la intervencion: 89a10e15ae0b9927b86aa177894221c05100241a
- El repositorio no contiene secretos, credenciales ni datos privados. El `.gitignore` de la raiz excluye `.env` y `.env.*`.


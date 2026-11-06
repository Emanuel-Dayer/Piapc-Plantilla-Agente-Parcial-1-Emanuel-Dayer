import * as Phaser from 'phaser';
import { INPUT_ACTIONS } from '../utils/InputSystem.js';

export default class Player {
  constructor(scene, inputSystem, playerKey = 'player1') {
    this.scene = scene;
    this.inputSystem = inputSystem;
    this.playerKey = playerKey;
    
    // Posición inicial: Mitad de la pantalla en X, y fila 1 en Y
    const startX = this.scene.scale.width / 2;
    const startY = 248; // Centro de la Fila 1 (entre 240 y 248)

    this.sprite = this.scene.physics.add.sprite(startX, startY, 'Atlas', 'Personaje');
    this.sprite.setDepth(1); // Jugador en una capa superior
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(8, 8); // Hitbox de 8x8 píxeles
    
    // CORRECCIÓN DE LÍMITES: Área de filas 1 a 6 (Excluye la Fila 0)
    // Y arranca en 200 y tiene 48px de alto (6 filas * 8px)
    const bounds = new Phaser.Geom.Rectangle(0, 200, 240, 48);
    this.sprite.body.setBoundsRectangle(bounds);

    // Velocidad: 1px por frame (a 60 FPS = 60 píxeles por segundo)
    this.speed = 90; 

    this.bullet = null;
    this.bulletSpeed = -360; 
    this.createIdleBullet();
  }

  createIdleBullet() {
    // Spawnea en la misma posición, pero ajustaremos su profundidad visual
    this.bullet = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, 'Atlas', 'Bullet');
    this.bullet.setDepth(0); // Spawnea visualmente debajo del jugador
    this.bullet.body.setSize(8, 8); // Hitbox de 8x8 píxeles
    this.bullet.active = false; 
  }

  _readInput() {
    const sys = this.inputSystem;
    const pk = this.playerKey;
    const IA = INPUT_ACTIONS;

    const left = sys.isDown(IA.LEFT, pk);
    const right = sys.isDown(IA.RIGHT, pk);
    const up = sys.isDown(IA.UP, pk);
    const down = sys.isDown(IA.DOWN, pk);
    const shoot = sys.isDown(IA.SHOOT, pk);

    let dirX = right ? 1 : left ? -1 : 0;
    let dirY = up ? -1 : down ? 1 : 0;

    return { dirX, dirY, shoot };
  }

  update(dt) {
    const input = this._readInput();
    if (input.dirX !== 0 || input.dirY !== 0) {
      // Phaser requiere velocidad en px/segundo, por lo que aplicamos la velocidad pura.
      this.sprite.setVelocity(input.dirX * this.speed, input.dirY * this.speed);
    } else {
      // Frena en el acto, eliminando la inercia (delay)
      this.sprite.setVelocity(0, 0);
    }

    // Lógica del proyectil
    if (this.bullet) {
      if (!this.bullet.active) {
        // Sincroniza la bala con el jugador usando la misma velocidad y posición relativa
        // Esto asegura que se mueve suavemente con delta time aplicado
        this.bullet.setVelocity(this.sprite.body.velocity.x, this.sprite.body.velocity.y);
        this.bullet.setPosition(this.sprite.x, this.sprite.y - 5);
        
        if (input.shoot) {
          this.fireBullet();
        }
      } else {
        if (this.bullet.y < 0) {
          this.bullet.destroy();
          this.createIdleBullet(); // Solo una bala en pantalla a la vez
        }
      }
    }
  }

  hide() {
  this.sprite.setVisible(false);
  if (this.bullet) this.bullet.setVisible(false);
}

show() {
  this.sprite.setVisible(true);
  if (this.bullet) this.bullet.setVisible(true);
}

fireBullet() {
  this.bullet.active = true;
  this.bullet.setVelocity(0, this.bulletSpeed);
  this.scene.sound.play('Shot'); // Efecto de disparo[cite: 9]
}
  
  getBullet() {
      return this.bullet;
  }
}
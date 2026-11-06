import * as Phaser from 'phaser';

export default class SpiderManager {
  constructor(scene, mushroomManager, player, uiManager) {
    this.scene = scene;
    this.mushroomManager = mushroomManager;
    this.player = player;
    this.ui = uiManager;

    // Grupo para físicas sin gravedad
    this.spiderGroup = this.scene.physics.add.group();
    this.spider = null;

    this.spawnTimer = null;
    this.moveTimer = null;

    this._createAnimations();
    
    // Aparición inicial: 96 frames tras inicio (~1.6 seg a 60 FPS)
    this.scheduleSpawn(1600); 
  }

  _createAnimations() {
    if (!this.scene.anims.exists('spider_move')) {
      this.scene.anims.create({
        key: 'spider_move',
        // Utiliza los frames Spider_1 al Spider_8 del atlas[cite: 6]
        frames: this.scene.anims.generateFrameNames('Atlas', { prefix: 'Spider_', start: 1, end: 8 }),
        frameRate: 15,
        repeat: -1
      });
    }
  }

  scheduleSpawn(delay = 2133) { // Respawn de 128 frames (~2.1 seg a 60 FPS)[cite: 1]
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.scene.time.delayedCall(delay, () => this.spawn(), [], this);
  }

  spawn() {
    const isLeft = Math.random() < 0.5;
    const startX = isLeft ? -8 : 256; 
    const startY = 152; 

    const score = this.scene.ui ? this.scene.ui.score : 0;
    
    this.spider = this.spiderGroup.create(startX, startY, 'Atlas', 'Spider_1');
    this.spider.body.setSize(16, 8); 
    this.spider.play('spider_move');

    this.spider.baseDirX = isLeft ? 1 : -1; 
    this.spider.dirX = this.spider.baseDirX; 
    this.spider.dirY = 1; 
    
    // Hito de 5k: Arañas aceleran a 2 px/f (120)[cite: 3]
    this.spider.speed = score >= 5000 ? 120 : 60; 

    this._setRandomMovement();

    if (this.moveTimer) this.moveTimer.remove();
    this.moveTimer = this.scene.time.addEvent({
      delay: 750, 
      callback: () => {
        if (Math.random() < 0.5) this._setRandomMovement(); 
      },
      callbackScope: this,
      loop: true
    });
}

_setRandomMovement() {
    if (!this.spider || !this.spider.active) return;
    
    // Verificamos si la araña ya está dentro de los límites de la pantalla (240px de ancho)
    // Usamos márgenes seguros (x > 0 y x < 240)
    const isInsideScreen = this.spider.x > 0 && this.spider.x < 240;

    let isVertical = false;
    
    // Movimiento: Zigzag en 45° o vertical.
    // Solo permitimos calcular el movimiento vertical si ya asomó en pantalla.
    if (isInsideScreen) {
        isVertical = Math.random() < 0.3; // 30% de ir totalmente vertical
    }
    
    // Si no está en pantalla, la obligamos a moverse horizontalmente hacia adentro
    this.spider.dirX = isVertical ? 0 : this.spider.baseDirX;
    
    // Elige subir o bajar aleatoriamente
    this.spider.dirY = Math.random() < 0.5 ? 1 : -1; 
    
    if (this.moveSound) this.moveSound.stop();
  
    // Spider para zigzag, Spider_2 para vertical[cite: 9]
    const soundKey = this.spider.dirX === 0 ? 'Spider_2' : 'Spider';
    this.moveSound = this.scene.sound.add(soundKey, { loop: true });
    this.moveSound.play();
  }

  update(dt) {
    if (!this.spider || !this.spider.active) return;

    const score = this.scene.ui ? this.scene.ui.score : 0;

    // Hito de 60k y 860k: Restricción del área vertical[cite: 3]
    let topLimit = 152; // Límite superior por defecto
    if (score >= 60000 && score < 860000) {
        // Baja 1 fila (8px) cada 24k puntos tras 60k, hasta un máximo de 6 filas (48px)
        const rowsToDrop = Math.min(6, Math.floor((score - 60000) / 24000));
        topLimit = 152 + (rowsToDrop * 8);
    }

    if (this.spider.y <= topLimit) { 
      this.spider.y = topLimit;
      this.spider.dirY = 1; 
    } else if (this.spider.y >= 248) { 
      this.spider.y = 248;
      this.spider.dirY = -1; 
    }

    this.spider.setVelocity(this.spider.dirX * this.spider.speed, this.spider.dirY * this.spider.speed);

    this.scene.physics.overlap(this.spider, this.mushroomManager.getGroup(), (spider, mushroom) => {
      mushroom.destroy();
    });

    if ((this.spider.dirX > 0 && this.spider.x > 260) || (this.spider.dirX < 0 && this.spider.x < -20)) {
      this.die(false);
    }
}

  die(killedByPlayer = true) {
    if (this.moveSound) this.moveSound.stop();
   
    if (!this.spider || !this.spider.active) return;

    if (killedByPlayer) {
      // Calcular puntos basados en la distancia vertical al jugador[cite: 1]
      const dist = Math.abs(this.spider.y - this.player.sprite.y);
      let points = 300; // Lejos[cite: 1]
      let texture = '300'; // Usa las texturas del atlas[cite: 6]

      if (dist < 32) {
        points = 900; // Cerca[cite: 1]
        texture = '900';
      } else if (dist < 64) {
        points = 600; // Medio[cite: 1]
        texture = '600';
      }

      this.ui.addScore(points);

      // Mostrar el sprite de los puntos donde la matamos[cite: 1]
      const ptsSprite = this.scene.add.sprite(this.spider.x, this.spider.y, 'Atlas', texture);
      this.scene.time.delayedCall(1000, () => ptsSprite.destroy());
    }

    this.spider.destroy();
    this.spider = null;
    if (this.moveTimer) this.moveTimer.remove();

    // Respawn tras morir[cite: 1]
    this.scheduleSpawn();
  }

reset() {
  if (this.spider) {
    this.spider.destroy();
    this.spider = null;
  }

  if (this.moveTimer) {
    this.moveTimer.remove();
    this.moveTimer = null;
  }

  if (this.spawnTimer) {
    this.spawnTimer.remove();
    this.spawnTimer = null;
  }

  // Programar nuevo spawn tras el reset
  this.scheduleSpawn(2133);
}

  getGroup() {
    return this.spiderGroup;
  }
}
import * as Phaser from 'phaser';

export default class FleaManager {
  constructor(scene, mushroomManager) {
    this.scene = scene;
    this.mushroomManager = mushroomManager;
    this.fleaGroup = this.scene.physics.add.group();
    this.flea = null;
    this.frameCounter = 0;

    this._createAnimations();
  }

  _createAnimations() {
    if (!this.scene.anims.exists('flea_move')) {
      this.scene.anims.create({
        key: 'flea_move',
        frames: this.scene.anims.generateFrameNames('Atlas', { prefix: 'Flea_', start: 1, end: 4 }), // Usa frames del atlas
        frameRate: 10,
        repeat: -1
      });
    }
  }

spawn() {
    const col = Phaser.Math.Between(0, 29);
    const startX = (col * 8) + 4;

    const score = this.scene.ui ? this.scene.ui.score : 0;

    this.flea = this.fleaGroup.create(startX, -8, 'Atlas', 'Flea_1');
    this.flea.play('flea_move');
    this.flea.health = 2;
    
    // Hito 60k: Acelera a 3 px/f (180px/s)[cite: 6]
    this.flea.speedY = score >= 60000 ? 180 : 120;

    this.dropSound = this.scene.sound.add('Flea_drop');
    this.dropSound.play();
}

  update() {
    if (!this.flea || !this.flea.active) return;

    this.flea.setVelocityY(this.flea.speedY);

    // Lógica de soltar hongos: 25% prob cada 4 frames
    this.frameCounter++;
    if (this.frameCounter >= 4) {
      this.frameCounter = 0;
      if (Math.random() < 0.25) {
        this._dropMushroom();
      }
    }

    if (this.flea.y > 256) this.die(false);
  }

_dropMushroom() {
    const col = Math.floor(this.flea.x / 8);
    const row = Math.floor(this.flea.y / 8);
    const px = (col * 8) + 4;
    const py = (row * 8) + 4;

    // RESTRICCIÓN: No plantar en la fila 248 (donde aparece el jugador)
    // También evitamos la zona superior si es necesario
    if (py >= 244 || py <= 8) { 
        return; 
    }

    const existingShrooms = this.mushroomManager.getGroup().getChildren();
    const isOccupied = existingShrooms.some(m => m.x === px && m.y === py);

    if (!isOccupied) {
        const shroom = this.mushroomManager.getGroup().create(px, py, 'Atlas', 'Mushroom_1');
        shroom.health = 4;
        shroom.refreshBody(); 
    }
}

  handleHit() {
    if (!this.flea) return;
    this.flea.health--;
    if (this.flea.health === 1) {
      this.flea.speedY = 240; // Acelera a 4 px/frame
    } else {
      this.die(true);
    }
  }

  die(killedByPlayer) {
    if (killedByPlayer) this.scene.ui.addScore(200);
    this.flea.destroy();
    this.flea = null;
    if (this.dropSound) this.dropSound.stop();
  }

    reset() {
  if (this.flea) {        // o this.flea / this.scorpion
    this.flea.destroy();
    this.flea = null;
  }
  }
}
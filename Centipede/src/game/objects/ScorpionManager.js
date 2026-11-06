import * as Phaser from 'phaser';

export default class ScorpionManager {
  constructor(scene, mushroomManager) {
    this.scene = scene;
    this.mushroomManager = mushroomManager;
    this.scorpionGroup = this.scene.physics.add.group();
    this.scorpion = null;
    
    this._createAnimations();
  }

  _createAnimations() {
    if (!this.scene.anims.exists('scorpion_move')) {
      this.scene.anims.create({
        key: 'scorpion_move',
        frames: this.scene.anims.generateFrameNames('Atlas', { prefix: 'Scorpion_', start: 1, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

spawn() {
    const isLeft = Math.random() < 0.5;
    const startX = isLeft ? -8 : 248;
    const row = Phaser.Math.Between(1, 18);
    const startY = (row * 8) + 4;

    const score = this.scene.ui ? this.scene.ui.score : 0;
    
    // Hitos de Dificultad: 5k para siempre o 20k al 75%[cite: 8]
    let scorpionSpeed = 60; // 1 px/f (60px/s)
    if (score >= 5000) {
        scorpionSpeed = 120; // 2 px/f
    } else if (score >= 20000 && Math.random() < 0.75) {
        scorpionSpeed = 120; 
    }

    this.scorpion = this.scorpionGroup.create(startX, startY, 'Atlas', 'Scorpion_1');
    this.scorpion.play('scorpion_move');
    this.scorpion.flipX = isLeft;
    this.scorpion.speedX = isLeft ? scorpionSpeed : -scorpionSpeed;

    this.moveSound = this.scene.sound.add('Scorpion', { loop: true });
    this.moveSound.play();
}

  update() {
    if (!this.scorpion || !this.scorpion.active) return;

    this.scorpion.setVelocityX(this.scorpion.speedX);

    // Envenenar hongos al pasar
    this.scene.physics.overlap(this.scorpion, this.mushroomManager.getGroup(), (s, mushroom) => {
      if (!mushroom.isPoisoned) {
        mushroom.isPoisoned = true;
        // Cambia al frame envenenado correspondiente a su vida actual
        const frameIndex = 5 - mushroom.health; 
        mushroom.setFrame(`Mushroom_Poison_${frameIndex}`); //[cite: 3]
      }
    });

    if (this.scorpion.x > 260 || this.scorpion.x < -20) this.die(false);
  }

  die(killedByPlayer) {
    if (killedByPlayer) this.scene.ui.addScore(1000);
    this.scorpion.destroy();
    this.scorpion = null;
    this.moveSound.stop();
  }

  reset() {
  if (this.scorpion) {        // o this.flea / this.scorpion
    this.scorpion.destroy();
    this.scorpion = null;
  }
  }

  getGroup() {
    return this.scorpionGroup;
  }
}
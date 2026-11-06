import * as Phaser from 'phaser';
import InputSystem, { INPUT_ACTIONS } from '../utils/InputSystem.js';
import { ControlsStatusUI } from '../utils/ControlsStatusUI.js';
import Player from '../objects/player.js';
import MushroomManager from '../objects/MushroomManager.js';
import UIManager from '../objects/UIManager.js';
import SpiderManager from '../objects/SpiderManager.js';
import FleaManager from '../objects/FleaManager.js';
import ScorpionManager from '../objects/ScorpionManager.js';
import CentipedeManager from '../objects/CentipedeManager.js';

export class Game extends Phaser.Scene {
  constructor() {
    super({
      key: 'Game',
      physics: {
        default: 'arcade',
        arcade: { debug: false } // Puedes activarlo con la tecla P
      }
    });
    this._uiVisible = false;
  }

  init() {
    this.cameras.main.setBackgroundColor(0x00000000);
  }

create() {
    this.currentRound = 2; // Iniciar directamente en nivel 2[cite: 1, 2]
    this.isFinishing = false; // Flag para evitar que el bug de spawn se dispare al terminar
    this._setupInput();
    this.mushroomManager = new MushroomManager(this);
    this.centipedeManager = new CentipedeManager(this, this.mushroomManager);
    this._setupPlayer();
    this._setupUI();
    
    this.spiderManager = new SpiderManager(this, this.mushroomManager, this.player, this.ui);
    this.fleaManager = new FleaManager(this, this.mushroomManager);
    this.scorpionManager = new ScorpionManager(this, this.mushroomManager);

    this._createAnimations();
    this._setupCollisions();
    
    this.isPaused = false;
    this.lastEnemyHitPos = null;
    
    this.events.once('shutdown', this._cleanup, this);
}

_createAnimations() {
    // Animación Explosion_1 a Explosion_6
    if (!this.anims.exists('explosion')) {
      this.anims.create({
        key: 'explosion',
        frames: this.anims.generateFrameNames('Atlas', { prefix: 'Explosion_', start: 1, end: 6 }),
        frameRate: 15,
        repeat: 0
      });
    }
    
    // Animación Personaje_Explosion_1 a Personaje_Explosion_8
    if (!this.anims.exists('player_explosion')) {
      this.anims.create({
        key: 'player_explosion',
        frames: this.anims.generateFrameNames('Atlas', { prefix: 'Personaje_Explosion_', start: 1, end: 8 }),
        frameRate: 15,
        repeat: 0
      });
    }
  }

_playExplosionAt(x, y) {
  const explosion = this.add.sprite(x, y, 'Atlas', 'Explosion_1');
  explosion.play('explosion');
  this.sound.play('Enemy_Death'); // Sonido de explosión[cite: 9]
  explosion.on('animationcomplete', () => explosion.destroy());
}

 update(time, delta) {
  if (this.isPaused || this.isFinishing) return;
    
    const dt = delta / 1000;

    this.inputSystem.update();
    this.player.update(dt);

    const bullet = this.player.getBullet();
    if (bullet && bullet.active) {
       this.physics.collide(bullet, this.mushroomManager.getGroup(), this._handleBulletHitMushroom, null, this);
       
       this.physics.collide(bullet, this.centipedeManager.getGroup(), (b, centipedeSprite) => {
         const segment = centipedeSprite.getData('segment');
         if (segment) {
           // Asignar puntos: 100 cabeza, 10 cuerpo
           const points = segment.isHead ? 100 : 10;
           this.ui.addScore(points);

           this._playExplosionAt(segment.sprite.x, segment.sprite.y);
           b.destroy();
           this.player.createIdleBullet();
           this.centipedeManager.shootSegment(segment);
         }
       });
       
       this.physics.collide(bullet, this.spiderManager.getGroup(), (b, spider) => {
         this._playExplosionAt(spider.x, spider.y);
         b.destroy();
         this.player.createIdleBullet();
         this.spiderManager.die(true);
       });

       this.physics.collide(bullet, this.fleaManager.fleaGroup, (b, flea) => {
         this._playExplosionAt(flea.x, flea.y);
         b.destroy();
         this.player.createIdleBullet();
         this.fleaManager.handleHit();
       });

       this.physics.collide(bullet, this.scorpionManager.getGroup(), (b, scorpion) => {
         this._playExplosionAt(scorpion.x, scorpion.y);
         b.destroy();
         this.player.createIdleBullet();
         this.scorpionManager.die(true);
       });
    }

    this._handleGlobalCommands();
    this.controlsUI.update();
    this.inputSystem.lateUpdate();
    this.centipedeManager.update();
    this.fleaManager.update();
    this.spiderManager.update(dt);
    this.scorpionManager.update();

if (this.centipedeManager.allSegments.length === 0 && !this.centipedeManager.isSpawning) {
        if (this.currentRound === 2) {
            this.currentRound = 4;
            this.centipedeManager.reset();
        } else if (this.currentRound === 4) {
            this._finishGame(); // Ejecutar secuencia final[cite: 2]
        }
    }

    this._manageEnemySpawns();
}

_finishGame() {
    this.isFinishing = true;
    this.sound.stopAll();
    this.isPaused = true;
    this.physics.pause();
    this.time.paused = true;
    this._pauseEnemyAnimations();

    // 1. Detener al jugador
    this.player.sprite.body.setVelocity(0, 0);
    this.player.sprite.anims.stop();
    
    // 2. Sonido de vida extra/victoria
    this.sound.play('Extra_Life'); // Asegúrate de que este sea el nombre del asset
    
    // 4. Iniciar recuento de hongos y volver al menú al terminar
    this._recoverMushroomsWithTimeout(() => {
        this.sound.stopAll(); // Detener sonidos antes de salir[cite: 1, 2]
        this._resumeEnemyAnimations();
        this.physics.resume();
        this.time.paused = false;
        this.isPaused = false;
        this.scene.start('MainMenu', { lastScore: this.ui.score }); 
    });
}

_manageEnemySpawns() {
    const fleaActive = this.fleaManager.flea !== null;
    const scorpionActive = this.scorpionManager.scorpion !== null;
    const score = this.ui.score;

    if (!fleaActive && !scorpionActive) {
        // Pulga: Solo desde Ronda 2
        if (this.currentRound >= 2) {
            let threshold = 5;
            if (score >= 120000) {
                threshold = 9 + Math.floor((score - 120000) / 20000);
            }
            const mushroomsInZone = this.mushroomManager.getGroup().getChildren().filter(m => m.y >= 152 && m.y <= 248);
            if (mushroomsInZone.length <= threshold) {
                this.fleaManager.spawn();
                return;
            }
        }

        // Escorpión: Solo desde Ronda 4
        if (this.currentRound >= 4) {
            if (Phaser.Math.Between(0, 1000) < 5) { 
                this.scorpionManager.spawn();
            }
        }
    }
}

  _cleanup() {
    this.inputSystem?.destroy();
  }

  _setupInput() {
    const keyMap1 = {
      //acciones
      [INPUT_ACTIONS.UP]:        ['W', 'UP'],
      [INPUT_ACTIONS.DOWN]:      ['S', 'DOWN'],
      [INPUT_ACTIONS.LEFT]:      ['A', 'LEFT'],
      [INPUT_ACTIONS.RIGHT]:     ['D', 'RIGHT'],
      [INPUT_ACTIONS.SHOOT]:     ['J', 'SPACE', 'ENTER'],

      //extras
      [INPUT_ACTIONS.DEBUG]:     'P',
      [INPUT_ACTIONS.RESTART]:   'R',
      [INPUT_ACTIONS.TOGGLE_UI]: 'U',
    };

    const keyMap2 = {};

    this.inputSystem = new InputSystem(this, keyMap1, keyMap2);
  }

  _setupPlayer() {
    this.player = new Player(
      this,
      this.inputSystem,
      'player1'
    );
  }

  _setupUI() {
    this.ui = new UIManager(this);
    this.controlsUI = new ControlsStatusUI(this, this.inputSystem);
    this.controlsUI.setVisible(this._uiVisible);
  }

  // En playerHit(), al perder todas las vidas, volver al menú inicial[cite: 1, 2]
playerHit() {
  const isAlive = this.ui.loseLife();
  this.sound.stopAll();
  this.sound.play('Player_Death');
  this.sound.play('Enemy_Death');
  this.isPaused = true;
  this.physics.pause();
  this.time.paused = true;
  this._pauseEnemyAnimations(); 

  this.player.hide();

  const playerExplosion = this.add.sprite(this.player.sprite.x, this.player.sprite.y, 'Atlas', 'Personaje_Explosion_1');
  playerExplosion.play('player_explosion');
  
  if (this.lastEnemyHitPos) {
    const enemyExplosion = this.add.sprite(this.lastEnemyHitPos.x, this.lastEnemyHitPos.y, 'Atlas', 'Explosion_1');
    enemyExplosion.play('explosion');
    enemyExplosion.on('animationcomplete', () => enemyExplosion.destroy());
  }

  playerExplosion.on('animationcomplete', () => {
    playerExplosion.destroy();
    this._recoverMushroomsWithTimeout(() => {
      if (!isAlive) {
        this._resumeEnemyAnimations();
        this.physics.resume();
        this.time.paused = false;
        this.scene.start('MainMenu'); // Volver al menú inicial[cite: 1, 2]
      } else {
        this._resetRound();
      }
    });
  });

  playerExplosion.on('animationcomplete', () => {
        playerExplosion.destroy();
        this._recoverMushroomsWithTimeout(() => {
            if (!isAlive) {
                this.sound.stopAll(); // Limpieza de audio[cite: 1, 2]
                this.scene.start('MainMenu', { lastScore: this.ui.score }); // Enviar score al morir
            } else {
                this._resetRound();
            }
        });
    });
}

_resetRound() {
  // Forzar reset completo de todos los managers siempre
  this.sound.stopAll();
  this.centipedeManager.reset();
  this.spiderManager.reset();
  this.fleaManager.reset();
  this.scorpionManager.reset();

  this._resumeEnemyAnimations();
  this.physics.resume();
  this.time.paused = false;
  this.isPaused = false;

  this.player.sprite.setPosition(this.scale.width / 2, 244);
  this.player.show();
  this.lastEnemyHitPos = null;
}

_recoverMushroomsWithTimeout(onComplete) {
  const damagedMushrooms = this.mushroomManager.getGroup()
    .getChildren()
    .filter(m => m.health < 4 || m.isPoisoned); // <- agregar isPoisoned

  if (damagedMushrooms.length === 0) {
    onComplete();
    return;
  }

  const recoverNext = (index) => {
    if (index >= damagedMushrooms.length) {
      onComplete();
      return;
    }

    const mushroom = damagedMushrooms[index];

    const explosion = this.add.sprite(mushroom.x, mushroom.y, 'Atlas', 'Explosion_1');
    explosion.play('explosion');
    this.sound.play('Enemy_Death'); // Sonido de explosión

    explosion.on('animationcomplete', () => {
      explosion.destroy();

      if (mushroom.active) {
        mushroom.health = 4;
        mushroom.isPoisoned = false;
        mushroom.setFrame('Mushroom_1'); // Siempre vuelve al frame sano normal
        this.ui.addScore(5);
      }

      recoverNext(index + 1);
    });
  };

  recoverNext(0);
}

  _handleBulletHitMushroom(bullet, mushroom) {
    // Reproducir explosión antes de destruir
    if (mushroom.health <= 1) {
      this._playExplosionAt(mushroom.x, mushroom.y);
    }
    
    bullet.destroy();
    this.player.createIdleBullet();

    mushroom.health -= 1;

    if (mushroom.health <= 0) {
      // Otorga 1 punto al destruir hongo
      this.ui.addScore(1); 
      mushroom.destroy();
    } else {
      // Mantener envenenados si ya lo están
      if (mushroom.isPoisoned) {
        const frameName = `Mushroom_Poison_${5 - mushroom.health}`;
        mushroom.setFrame(frameName);
      } else {
        const frameName = `Mushroom_${5 - mushroom.health}`;
        mushroom.setFrame(frameName);
      }
    }
  }

  _handleGlobalCommands() {
    
    if (this.inputSystem.isJustPressed(INPUT_ACTIONS.DEBUG)) {
      this._toggleDebug();
    }
    if (this.inputSystem.isJustPressed(INPUT_ACTIONS.TOGGLE_UI)) {
      this._toggleUI();
    }
    if (this.inputSystem.isJustPressed(INPUT_ACTIONS.RESTART)) {
      this.sound.stopAll();
      this.scene.restart();
    }
      
  }

_pauseEnemyAnimations() {
  this.spiderManager.getGroup().getChildren().forEach(s => s.anims.pause());
  this.fleaManager.fleaGroup.getChildren().forEach(s => s.anims.pause());
  this.scorpionManager.getGroup().getChildren().forEach(s => s.anims.pause());
  // Pausar todos los segmentos del ciempiés
  this.centipedeManager.getGroup().getChildren().forEach(s => s.anims.pause());
}

_resumeEnemyAnimations() {
  this.spiderManager.getGroup().getChildren().forEach(s => s.anims.resume());
  this.fleaManager.fleaGroup.getChildren().forEach(s => s.anims.resume());
  this.scorpionManager.getGroup().getChildren().forEach(s => s.anims.resume());
  // Reanudar todos los segmentos del ciempiés[cite: 1, 2]
  this.centipedeManager.getGroup().getChildren().forEach(s => s.anims.resume());
}

  _toggleDebug() {
    const world = this.physics.world;
    world.drawDebug = !world.drawDebug;

    if (world.drawDebug && !world.debugGraphic) {
      world.createDebugGraphic();
    }
    if (world.debugGraphic && !world.drawDebug) {
      world.debugGraphic.clear();
    }
  }

  _toggleUI() {
    this._uiVisible = !this._uiVisible;
    this.controlsUI.setVisible(this._uiVisible);
  }

  _setupCollisions() {
  // Mushrooms block player movement
  this.physics.add.collider(this.player.sprite, this.mushroomManager.getGroup());

  // Centipede touches player → lose a life
  this.physics.add.overlap(
    this.player.sprite,
    this.centipedeManager.getGroup(),
    (player, centipedeSprite) => {
      const segment = centipedeSprite.getData('segment');
      if (segment) {
        this.lastEnemyHitPos = { x: segment.sprite.x, y: segment.sprite.y };
      }
      this.playerHit();
    }
  );

  // Spider touches player → lose a life
  this.physics.add.overlap(
    this.player.sprite,
    this.spiderManager.getGroup(),
    (player, spider) => {
      this.lastEnemyHitPos = { x: spider.x, y: spider.y };
      this.spiderManager.die(false);
      this.playerHit();
    }
  );

  // Flea touches player → lose a life
  this.physics.add.overlap(
    this.player.sprite,
    this.fleaManager.fleaGroup,
    (player, flea) => {
      this.lastEnemyHitPos = { x: flea.x, y: flea.y };
      this.fleaManager.die(false);
      this.playerHit();
    }
  );
}
}

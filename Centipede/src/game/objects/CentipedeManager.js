import * as Phaser from 'phaser';

export default class CentipedeManager {
  constructor(scene, mushroomManager) {
    this.scene = scene;
    this.mushroomManager = mushroomManager;
    this.group = this.scene.physics.add.group();
    this.heads = [];
    this.allSegments = [];

    // --- Nuevas variables para Cabezas Huérfanas ---
    this.orphanSpawnTimer = 0;
    this.currentOrphanDelay = 192; // Delay inicial (~3.2s a 60fps)
    this.minOrphanDelay = 96;      // Delay mínimo
    this.hasReachedPlayerZone = false; // Flag para activar la mecánica

    this._createAnimations();
    this.spawnFullCentipede();
  }

  _createAnimations() {
    if (!this.scene.anims.exists('centipede_head_horiz')) {
      this.scene.anims.create({
        key: 'centipede_head_horiz',
        frames: this.scene.anims.generateFrameNames('Atlas', { prefix: 'Head_Centipede_', start: 1, end: 8 }),
        frameRate: 30,
        repeat: -1
      });
    }
    if (!this.scene.anims.exists('centipede_body_horiz')) {
      this.scene.anims.create({
        key: 'centipede_body_horiz',
        frames: this.scene.anims.generateFrameNames('Atlas', { prefix: 'Centipede_', start: 1, end: 8 }),
        frameRate: 30,
        repeat: -1
      });
    }
  }

  spawnFullCentipede() {
    this.isSpawning = true;
    const round = this.scene.currentRound || 1;
    const score = this.scene.ui ? this.scene.ui.score : 0;

    // Velocidad: Rondas impares 2, pares 1. Override si score >= 40k
    let speed = (round % 2 !== 0 || score >= 40000) ? 2 : 1.5;

    // Reducción de delay en 10k puntos
    if (score >= 10000) {
        this.minOrphanDelay = Math.max(16, 96 - 60); // Ajuste de delay[cite: 5]
    }

    // Calcular cabezas y cuerpos según la ronda (ciclo de 12)
    const extraHeads = (round - 1) % 12;
    const bodyCount = 11 - extraHeads;

    const startX = 120;
    const startY = 4;

    // 1. Crear cadena principal
    const head = new CentipedeSegment(this.scene, startX, startY, true, null, this.mushroomManager, this);
    head.speed = speed;
    this.group.add(head.sprite);
    this.heads.push(head);
    this.allSegments.push(head);
    head.sprite.setData('segment', head);

    let leader = head;
    for (let i = 0; i < bodyCount; i++) {
      const bodyPart = new CentipedeSegment(this.scene, startX, startY, false, leader, this.mushroomManager, this);
      bodyPart.speed = speed;
      this.group.add(bodyPart.sprite);
      this.allSegments.push(bodyPart);
      bodyPart.sprite.setData('segment', bodyPart);
      bodyPart.sprite.anims.play({ key: 'centipede_body_horiz', startFrame: i % 8 });
      leader.nextSegment = bodyPart; 
      leader = bodyPart;
    }
    head.sprite.anims.play('centipede_head_horiz');

    // 2. Crear cabezas extra independientes
    for (let i = 0; i < extraHeads; i++) {
      // Salen igual, pero en columna aleatoria
      const randCol = Math.floor(Math.random() * 30);
      const extraHeadX = (randCol * 8) + 4;
      const extraHead = new CentipedeSegment(this.scene, extraHeadX, startY, true, null, this.mushroomManager, this);
      extraHead.speed = speed;
      this.group.add(extraHead.sprite);
      this.heads.push(extraHead);
      this.allSegments.push(extraHead);
      extraHead.sprite.setData('segment', extraHead);
      extraHead.sprite.anims.play('centipede_head_horiz');
    }

    if (!this.walkSound || !this.walkSound.isPlaying) {
      this.walkSound = this.scene.sound.add('Centipede_Walk', { loop: true });
      this.walkSound.play();
    }
    this.isSpawning = false;
}

  update() {
    // 1. Actualizar cada cadena de ciempiés
    this.heads.forEach(head => {
      let current = head;
      while (current) {
        current.update();
        // Detectar si alguna parte del ciempiés ya entró a la zona restringida
        if (!this.hasReachedPlayerZone && current.sprite.y >= 208) {
          this.hasReachedPlayerZone = true;
        }
        current = current.nextSegment;
      }
    });

    // 2. Lógica de Cabezas Huérfanas en la zona restringida
    this._handleOrphanSpawning();
  }

  /**
   * Gestiona la aparición de cabezas extras si hay menos de 12 segmentos
   */
  _handleOrphanSpawning() {
    // Solo ocurre si ya se llegó abajo y hay menos de 12 segmentos en total
    if (this.hasReachedPlayerZone && this.allSegments.length < 12) {
      this.orphanSpawnTimer--;

      if (this.orphanSpawnTimer <= 0) {
        this.spawnOrphanHead();
        
        // Reducir delay para la próxima cabeza (mínimo 96)
        this.currentOrphanDelay = Math.max(this.minOrphanDelay, this.currentOrphanDelay - 8);
        this.orphanSpawnTimer = this.currentOrphanDelay;
      }
    } else {
      // Resetear el timer si se recuperan los 12 segmentos para que no dispare instantáneamente al morir uno
      this.orphanSpawnTimer = this.currentOrphanDelay;
    }
  }

  /**
   * Spawnea una cabeza individual en los laterales de la zona del jugador
   */
  spawnOrphanHead() {
    // Decidir lado de entrada (0 = Izquierda, 1 = Derecha)
    const side = Math.random() < 0.5 ? 0 : 1;
    const startX = side === 0 ? -8 : 248; // Aparece justo fuera del borde
    const startY = 208 - 4; // Fila superior de la zona restringida (Player Zone Top)
    const direction = side === 0 ? 1 : -1;

    const newHead = new CentipedeSegment(this.scene, startX, startY, true, null, this.mushroomManager, this);
    
    // Configuración específica para cabeza huérfana
    newHead.speed = 2;
    newHead.dirX = direction;
    newHead.state = 'MOVING_HORIZ'; // Entra moviéndose de lado
    newHead.isInPlayerZone = true;

    this.group.add(newHead.sprite);
    this.heads.push(newHead);
    this.allSegments.push(newHead);
    newHead.sprite.setData('segment', newHead);
    newHead.sprite.anims.play('centipede_head_horiz');
  }
  
  /**
   * Maneja el impacto de una bala en un segmento del ciempiés
   * @param {CentipedeSegment} segment - Segmento disparado
   */
  shootSegment(segment) {
    // Crear hongo en la SIGUIENTE posición a la que se dirigía el segmento.
    // El segmento sabe qué eje está usando según su estado, así que el mismo
    // calcula el destino y entrega el centro de ese tile ya alineado a la grilla.
    const nextTile = segment.getNextTilePosition();
    this.mushroomManager.addMushroom(nextTile.x, nextTile.y);

    // Guardar la dirección del segmento destruido para heredarla
    const inheritedDirX = segment.dirX;

    if (segment.isHead) {
      // --- CASO 1: Se dispara a la cabeza ---
      // Si hay un siguiente segmento, se convierte en cabeza
      if (segment.nextSegment) {
        segment.nextSegment.convertToHead(inheritedDirX);
      }
      this._destroySegment(segment);
    } else {
      // --- CASO 2: Se dispara a un segmento del cuerpo ---
      // Los segmentos delanteros (líderes) continúan
      // Los segmentos traseros (seguidores) forman una nueva cadena
      
      if (segment.nextSegment) {
        // El siguiente segmento se convierte en nueva cabeza
        segment.nextSegment.convertToHead(inheritedDirX);
      }
      
      this._destroySegment(segment);
    }

    // Después de cualquier división, verificar si hay segmentos huérfanos
    this._checkOrphanSegments();
  }

  /**
   * Destruye un segmento y lo elimina de todas las listas
   * @param {CentipedeSegment} segment - Segmento a destruir
   */
  _destroySegment(segment) {
    // Desconectar del liderazgo

    if (this.allSegments.length === 0 && this.walkSound) {
    this.walkSound.stop();
  }
    if (segment.leader) {
      segment.leader.nextSegment = null;
    }

    // Remover de heads si es cabeza
    const headIndex = this.heads.indexOf(segment);
    if (headIndex !== -1) {
      this.heads.splice(headIndex, 1);
    }

    // Remover de allSegments
    const segmentIndex = this.allSegments.indexOf(segment);
    if (segmentIndex !== -1) {
      this.allSegments.splice(segmentIndex, 1);
    }

    // Destruir sprite
    this.scene.physics.world.disableBody(segment.sprite.body);
    this.group.remove(segment.sprite);
    // quitado destruccion del sprite para debug
    segment.sprite.destroy();
  }

  /**
   * Verifica si hay segmentos que quedaron sin conexiones (huérfanos)
   * Los segmentos huérfanos se convierten en nuevas cabezas
   */
  _checkOrphanSegments() {
    // Verificar cada segmento que no es cabeza
    this.allSegments.forEach(segment => {
      if (!segment.isHead && !segment.leader) {
        // Segmento sin líder = huérfano → convertir a cabeza
        segment.convertToHead();
      }
    });
  }

  /**
   * Obtiene el grupo de physics para colisiones
   */
  getGroup() {
    return this.group;
  }

reset() {
    // Reiniciar también los valores de las cabezas huérfanas
    this.currentOrphanDelay = 192;
    this.orphanSpawnTimer = 0;
    this.hasReachedPlayerZone = false;

    [...this.allSegments].forEach(segment => {
      this.group.remove(segment.sprite);
      segment.sprite.destroy();
    });

    this.allSegments = [];
    this.heads = [];
    this.spawnFullCentipede();
  }
}

class CentipedeSegment {
  constructor(scene, x, y, isHead, leader, mushroomManager, manager) {
    this.scene = scene;
    this.manager = manager; // Referencia al manager para conversiones
    this.isHead = isHead;
    this.leader = leader;
    this.mushroomManager = mushroomManager;
    this.nextSegment = null;

    this.history = []; 
    this.historyDelay = 5; // Ajustado para un seguimiento más cerrado

    const frame = isHead ? 'Head_Centipede_1' : 'Centipede_1';
    this.sprite = scene.physics.add.sprite(x, y, 'Atlas', frame);
    this.sprite.setOrigin(0.5);
    
    this.speed = 2; 
    this.dirX = 0;
    this.dirY = 1; // 1 para bajar, -1 para subir
    this.state = 'DROPPING_INIT';
    this.targetY = 8 + 4; 
    
    // Rango de la zona del jugador
    this.playerZoneTop = 208;
    this.playerZoneBottom = 240;
    this.isInPlayerZone = false;
  }

update() {
    if (this.isHead) {
      this._updateHeadBehavior();
    } else {
      this._followLeader();
    }

    if (this.history) {
      this.history.unshift({ 
        x: this.sprite.x, 
        y: this.sprite.y, 
        flipX: this.sprite.flipX,
        // El estado de movimiento viaja con la posición para que los segmentos
        // que siguen a un líder puedan saber hacia dónde se dirigen.
        state: this.state, 
        dirX: this.dirX, 
        dirY: this.dirY 
      });

      // Aumentamos el límite de memoria del historial a 20 para asegurarnos 
      // de que tenga suficientes frames guardados cuando la velocidad es muy baja (1 px/frame)
      if (this.history.length > 20) {
        this.history.pop();
      }
    }
  }

/**
 * Calcula el centro, en píxeles, del siguiente tile al que se dirige este
 * segmento. Se usa el único eje que el segmento está usando en su estado
 * actual, porque dirX y dirY son ejes ortogonales y el que no se está
 * usando conserva un valor obsoleto:
 *   - MOVING_HORIZ  -> avanza un tile en la dirección de dirX
 *   - DROPPING_TURN -> avanza un tile en la dirección de dirY
 *   - DROPPING_INIT -> avanza un tile en la dirección de dirY (caída inicial)
 *
 * state, dirX y dirY son válidos tanto en una cabeza como en un segmento de
 * cuerpo, porque los cuerpos los heredan de su líder a través del historial.
 * Un segmento de cuerpo que nunca llegó a seguir a su líder conserva los
 * valores iniciales (dirX = 0, dirY = 1, DROPPING_INIT), que coinciden con
 * la caída inicial del ciempiés.
 *
 * El redondeo a grilla es el mismo que usa MushroomManager.addMushroom
 * (Math.round((px - 4) / 8)), de modo que el tile devuelto no se vuelve a
 * desplazar al convertirlo de nuevo a coordenadas de grilla.
 *
 * @param {number} [tileSize=8] - Tamaño del tile en píxeles
 * @returns {{x: number, y: number}} Centro del tile destino en píxeles
 */
getNextTilePosition(tileSize = 8) {
  const col = Math.round((this.sprite.x - (tileSize / 2)) / tileSize);
  const row = Math.round((this.sprite.y - (tileSize / 2)) / tileSize);

  // Solo se considera movimiento horizontal si el estado lo indica y hay una
  // dirección horizontal válida; en cualquier otro caso el segmento baja o
  // sube, nunca avanza en diagonal.
  const movingHorizontally = this.state === 'MOVING_HORIZ' && this.dirX !== 0;

  const nextCol = movingHorizontally ? col + this.dirX : col;
  const nextRow = movingHorizontally ? row : row + this.dirY;

  return {
    x: (nextCol * tileSize) + (tileSize / 2),
    y: (nextRow * tileSize) + (tileSize / 2)
  };
}

_updateHeadBehavior() {
  if (this.state === 'DROPPING_INIT') {
    this.sprite.y += this.speed;
    if (this.sprite.y >= this.targetY) {
      this.sprite.y = this.targetY;
      this.state = 'MOVING_HORIZ';
      this.dirX = Math.random() < 0.5 ? 1 : -1;
    }
  } 
  else if (this.state === 'MOVING_HORIZ') {
    this.sprite.flipX = this.dirX === 1;
    const nextX = this.sprite.x + (this.dirX * 8);
    const hitWall = nextX < 0 || nextX > 240;
    const obstacleInfo = this._checkObstacles(nextX);

    // Al tocar veneno, cae a 2px/frame[cite: 5]
    if (obstacleInfo.isPoisoned && !this.isPoisonedDive) {
      this.isPoisonedDive = true;
      this.originalSpeed = this.speed;
      this.speed = 2; // Forzar 2 px/frame
    }

    if (hitWall || obstacleInfo.hit || this.isPoisonedDive) {
      if (this.sprite.y >= this.playerZoneBottom) {
        this.isPoisonedDive = false; 
        this.speed = this.originalSpeed || this.speed; // Recupera velocidad[cite: 5]
        this.dirY = -1;
        this.isInPlayerZone = true;
      } 
      else if (this.isInPlayerZone && this.sprite.y <= this.playerZoneTop) {
        this.dirY = 1;
      }

      this.state = 'DROPPING_TURN';
      this.targetY = this.sprite.y + (8 * this.dirY);
      this.dirX *= -1;
    } else {
      this.sprite.x += this.dirX * this.speed;
    }
  } 
  else if (this.state === 'DROPPING_TURN') {
    this.sprite.y += this.speed * this.dirY;
    const reachedTarget = this.dirY === 1 ? this.sprite.y >= this.targetY : this.sprite.y <= this.targetY;
    if (reachedTarget) {
      this.sprite.y = this.targetY;
      this.state = 'MOVING_HORIZ';
    }
  }
}

_checkObstacles(nextX) {
  let result = { hit: false, isPoisoned: false };

  // Comprobar colisión con Hongos
  const shrooms = this.mushroomManager.getGroup().getChildren();
  for (const m of shrooms) {
    if (Math.abs(m.y - this.sprite.y) < 4 && Math.abs(m.x - nextX) < 4) {
      result.hit = true;
      if (m.isPoisoned) result.isPoisoned = true; // Detectamos el veneno[cite: 1]
      break;
    }
  }

  // Comprobar otros obstáculos (solo si no es hongo)
  if (!result.hit) {
    const enemyGroups = [
      this.scene.spiderManager.getGroup(),
      this.scene.fleaManager.fleaGroup,
      this.scene.scorpionManager.getGroup(),
      this.manager.getGroup()
    ];
    for (const group of enemyGroups) {
      if (group.getChildren().some(t => t !== this.sprite && Math.abs(t.y - this.sprite.y) < 4 && Math.abs(t.x - nextX) < 4)) {
        result.hit = true;
        break;
      }
    }
  }
  return result;
}


_followLeader() {
    // Calculamos el delay necesario para mantener siempre 8 píxeles de separación.
    // Ej: 8 / 2(velocidad) = 4 frames. 8 / 1(velocidad) = 8 frames.
    const requiredDelay = Math.round(9 / this.speed);

    if (this.leader && this.leader.history.length >= requiredDelay) {
      const pos = this.leader.history[requiredDelay - 1];
      this.sprite.x = pos.x;
      this.sprite.y = pos.y;
      this.sprite.flipX = pos.flipX;
      // Se hereda también el estado de movimiento del líder, porque el
      // siguiente tile al que se dirige este segmento se decide con él.
      this.state = pos.state;
      this.dirX = pos.dirX;
      this.dirY = pos.dirY;
    }
  }

  /**
   * Convierte este segmento de cuerpo en una cabeza
   * Esto sucede cuando:
   * 1. Se dispara a la cabeza y este es el siguiente
   * 2. Se dispara a un cuerpo y este es el siguiente
   * 3. Se detecta que es un segmento huérfano (sin líder)
   */
  convertToHead() {
    if (this.isHead) return; // Ya es cabeza

    this.isHead = true;
    this.leader = null; // Dejar de seguir al líder anterior
    this.history = []; // Limpiar historial

    this.sprite.x = Math.floor(this.sprite.x / 8) * 8 + 4;
    this.sprite.y = Math.floor(this.sprite.y / 8) * 8 + 4;

    // Cambiar sprite a cabeza
    this.sprite.setFrame('Head_Centipede_1');
    this.sprite.anims.stop(); // Detener animación anterior
    this.sprite.anims.play('centipede_head_horiz'); // Tocar animación de cabeza

    // Agregar a la lista de cabezas si no está
    if (!this.manager.heads.includes(this)) {
      this.manager.heads.push(this);
    }

    // Reiniciar estado de comportamiento
    this.state = 'DROPPING_INIT';
    this.targetY = this.sprite.y + (8 * 1); // Bajar una fila
    this.dirX = 0;
    this.dirY = 1;
  }
}
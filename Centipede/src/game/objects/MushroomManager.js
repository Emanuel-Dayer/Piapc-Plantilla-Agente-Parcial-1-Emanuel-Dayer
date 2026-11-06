import * as Phaser from 'phaser';

export default class MushroomManager {
  constructor(scene) {
    this.scene = scene;
    
    // Grupo estático con físicas para los hongos (bloquean al jugador)
    this.mushrooms = this.scene.physics.add.staticGroup();
    
    // Rastrear posiciones ocupadas para evitar duplicados
    this.occupiedPositions = new Set();
    
    this.generateInitialGrid();
  }

  generateInitialGrid() {
    const totalMushrooms = 46;
    const tileSize = 8;

    let spawned = 0;
    while (spawned < totalMushrooms) {
      // Aleatorio entre columnas 0 a 29 (30 tiles de ancho)
      const col = Phaser.Math.Between(0, 29);
      // Aleatorio entre filas 1 a 27 (fila 0 no, según reglas)
      const row = Phaser.Math.Between(4, 29); 

      const posKey = `${col},${row}`;
      
      if (!this.occupiedPositions.has(posKey)) {
        this.occupiedPositions.add(posKey);
        
        // Coordenadas en píxeles (centradas en el tile)
        const px = (col * tileSize) + (tileSize / 2);
        const py = (row * tileSize) + (tileSize / 2);

        // Instanciar hongo con el primer frame (vida máxima)
        const shroom = this.mushrooms.create(px, py, 'Atlas', 'Mushroom_1');
        
        // Propiedades custom para manejar la vida
        shroom.health = 4; // Requieren 4 disparos
        
        spawned++;
      }
    }
  }

  getGroup() {
      return this.mushrooms;
  }

  /**
   * Crea un nuevo hongo en la posición especificada (usado cuando se divide el ciempiés)
   * Los hongos respetan la grilla de 8x8 píxeles
   * @param {number} px - Posición X en píxeles
   * @param {number} py - Posición Y en píxeles
   */
  addMushroom(px, py) {
    const tileSize = 8;
    
    // Convertir píxeles a grid
    // Los sprites están centrados: (col * 8 + 4, row * 8 + 4)
    const col = Math.round((px - 4) / tileSize);
    const row = Math.round((py - 4) / tileSize);
    const posKey = `${col},${row}`;

    // Evitar duplicados
    if (this.occupiedPositions.has(posKey)) {
      return; // Ya hay un hongo en esa posición
    }

    this.occupiedPositions.add(posKey);
    
    // Recalcular píxeles para que queden centrados en el tile
    const finalX = (col * tileSize) + (tileSize / 2);
    const finalY = (row * tileSize) + (tileSize / 2);
    
    // Crear nuevo hongo
    const shroom = this.mushrooms.create(finalX, finalY, 'Atlas', 'Mushroom_1');
    shroom.health = 4; // Vida máxima
  }
}
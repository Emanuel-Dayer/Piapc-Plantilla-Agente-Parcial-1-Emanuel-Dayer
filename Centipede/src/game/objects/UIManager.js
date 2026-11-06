import * as Phaser from 'phaser';

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;
    this.highscore = 0;
    this.lives = 2; // Inicia con 2 vidas
    this.lifeSprites = [];

    this._setupUI();
  }

  _setupUI() {
    const ROW_31_Y = 4; // Centro de la fila superior (0-8px)

    // 1. SCORE: Columna 0 a 6. El límite derecho es el final de la Col 6 (7 tiles * 8px = 56px)[cite: 1]
    // Usamos origin(1, 0.5) y align: 'right' para que crezca hacia la izquierda
    this.scoreText = this.scene.add.spriteText(56, ROW_31_Y, '00', {
      fontSize: 1,
      align: 'right',
      letterSpacing: 0,
      tint: 0xffffff, // Blanco por defecto
    }).setOrigin(1, 0.5);

    // 2. HIGHSCORE: Columna 13 a 18. El límite derecho es el final de la Col 18 (19 tiles * 8px = 152px)[cite: 1]
    // Funciona exactamente igual que el scoreText[cite: 1]
    this.highscoreText = this.scene.add.spriteText(152, ROW_31_Y, '00', {
      fontSize: 1,
      align: 'right',
      letterSpacing: 0,
      tint: 0xffffff, 
    }).setOrigin(1, 0.5);

    // 3. VIDAS: Columnas 7 a 12[cite: 1]
    this.refreshLives();
  }

  /**
   * Actualiza el puntaje y comprueba si debe actualizar el Highscore
   * @param {number} points 
   */
  addScore(points) {
    this.score += points;

    // El contador vuelve a 0 al alcanzar 1,000,000 pero el juego sigue[cite: 1]
    if (this.score >= 1000000) {
      this.score = 0;
    }

    // Formateo: Si es menor a 10, muestra "0X", si no, el número normal[cite: 1]
    const scoreStr = this.score < 10 ? `0${this.score}` : `${this.score}`;
    this.scoreText.setText(scoreStr);

    // Lógica del Highscore: Solo se actualiza si el score es ESTRICTAMENTE mayor[cite: 1]
    if (this.score > this.highscore) {
      this.highscore = this.score;
      this.highscoreText.setText(scoreStr); // Usa el mismo string formateado
    }

    // Vida extra a los 10,000 puntos[cite: 1]
    if (this.score % 10000 === 0 && this.score > 0) {
      this.lives++;
      this.refreshLives();
    }

    if (this.score % 10000 === 0 && this.score > 0) {
      this.lives++;
      this.scene.sound.play('Extra_Life'); // Sonido de vida extra
      this.refreshLives();
    }
  }

  refreshLives() {
    this.lifeSprites.forEach(s => s.destroy());
    this.lifeSprites = [];

    const START_X = 56 + 5; // Inicia justo después del Score (Columna 7)
    const ROW_31_Y = 4;

    for (let i = 0; i < this.lives; i++) {
      // Se posicionan de izquierda a derecha usando el sprite del personaje (16x8)[cite: 1, 6]
      const x = START_X + (i * 8); 
      const life = this.scene.add.image(x, ROW_31_Y, 'Atlas', 'Personaje');
      this.lifeSprites.push(life);
    }
  }

  loseLife() {
    if (this.lives > 0) {
      this.lives--;
      this.refreshLives();
      return true;
    }
    return false;
  }
}
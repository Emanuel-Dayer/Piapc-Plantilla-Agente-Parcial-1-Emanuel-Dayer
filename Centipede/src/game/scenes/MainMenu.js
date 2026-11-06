import * as Phaser from "phaser";
import { Scene } from 'phaser';
import InputSystem, { INPUT_ACTIONS } from '../utils/InputSystem.js'; //

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

init(data) {
    this.lastScore = data.lastScore || 0;
    this.highScores = JSON.parse(localStorage.getItem('centipede_highscores')) || [
        { name: 'LCS', score: 50 },
        { name: 'TRU', score: 30 },
        { name: 'CNT', score: 20 }
    ];
    
    this.newRecordIndex = this.highScores.findIndex(hs => this.lastScore > hs.score);
    this.isEnteringName = this.newRecordIndex !== -1;

    // 1. Bloqueo inicial de input por seguridad
    this.inputBlocked = true;
}

create() {
    this._setupInput();
    
    // 2. Liberar el input después de 1 segundo
    this.time.delayedCall(1000, () => {
        this.inputBlocked = false;
    });

    this.add.spriteText(this.scale.width / 2, 30, 'CENTIPEDE', { fontSize: 1, align: 'center' }).setOrigin(0.5);

    if (this.isEnteringName) {
        this._setupNameInput();
    } else {
        this._showHighScores();
        this._setupStartListener();
    }
}

    _setupInput() {
        const keyMap = {
            [INPUT_ACTIONS.UP]:    ['W', 'UP'],
            [INPUT_ACTIONS.DOWN]:  ['S', 'DOWN'],
            [INPUT_ACTIONS.LEFT]:  ['A', 'LEFT'],
            [INPUT_ACTIONS.RIGHT]: ['D', 'RIGHT'],
            [INPUT_ACTIONS.SHOOT]: ['J', 'SPACE', 'ENTER'],
        };
        this.inputSystem = new InputSystem(this, keyMap); //[cite: 3]
    }

    update() {
    this.inputSystem.update();

    // No procesar nada si el input está bloqueado
    if (this.inputBlocked) {
        this.inputSystem.lateUpdate();
        return;
    }

    if (this.isEnteringName) {
        this._handleNameEntryInput();
    } else {
        if (this.inputSystem.isJustPressed(INPUT_ACTIONS.SHOOT)) {
            this.scene.start('Game');
        }
    }

    this.inputSystem.lateUpdate();
}

    _handleNameEntryInput() {
        if (this.inputSystem.isJustPressed(INPUT_ACTIONS.LEFT)) {
            this.cursorIndex = Phaser.Math.Wrap(this.cursorIndex - 1, 0, 3);
            this._updateNameDisplay();
        } else if (this.inputSystem.isJustPressed(INPUT_ACTIONS.RIGHT)) {
            this.cursorIndex = Phaser.Math.Wrap(this.cursorIndex + 1, 0, 3);
            this._updateNameDisplay();
        } else if (this.inputSystem.isJustPressed(INPUT_ACTIONS.UP)) {
            this._changeChar(1);
        } else if (this.inputSystem.isJustPressed(INPUT_ACTIONS.DOWN)) {
            this._changeChar(-1);
        } else if (this.inputSystem.isJustPressed(INPUT_ACTIONS.SHOOT)) {
            this._saveHighScore();
        }
    }

_setupNameInput() {
    this.add.spriteText(this.scale.width / 2, 80, 'NEW HIGH SCORE!', { fontSize: 1, tint: 0x00ff00 }).setOrigin(0.5);
    this.nameChars = [65, 65, 65]; 
    this.cursorIndex = 0;
    this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ".split("");
    
    this.nameLetters = [];
    const charWidth = 20;
    const startX = (this.scale.width / 2) - charWidth;

    for (let i = 0; i < 3; i++) {
        const letter = this.add.spriteText(startX + (i * charWidth), 140, 'A', { fontSize: 2 }).setOrigin(0.5);
        this.nameLetters.push(letter);
    }

    this.blinkTween = null; // Inicializar vacío
    this._updateNameDisplay();
}

  _updateNameDisplay() {
    // 1. Detener el tween previo si existe para evitar conflictos
    if (this.blinkTween) {
        this.blinkTween.stop();
    }

    // 2. Resetear todas las letras a opacidad sólida y actualizar su texto
    this.nameLetters.forEach((letterObj, i) => {
        letterObj.setAlpha(1);
        letterObj.setText(String.fromCharCode(this.nameChars[i]));
    });

    // 3. Crear el nuevo efecto de titileo solo para la letra bajo el cursor[cite: 2]
    this.blinkTween = this.tweens.add({
        targets: this.nameLetters[this.cursorIndex],
        alpha: 0,
        duration: 200,
        yoyo: true,
        loop: -1
    });
}

    _changeChar(dir) {
        let charStr = String.fromCharCode(this.nameChars[this.cursorIndex]);
        let idx = this.chars.indexOf(charStr);
        idx = Phaser.Math.Wrap(idx + dir, 0, this.chars.length);
        this.nameChars[this.cursorIndex] = this.chars[idx].charCodeAt(0);
        this._updateNameDisplay();
    }

 _saveHighScore() {
    // 3. CORRECCIÓN: Usar String.fromCharCode con el array original para asegurar el nombre
    const finalName = String.fromCharCode(...this.nameChars);
    
    this.highScores.splice(this.newRecordIndex, 0, { name: finalName, score: this.lastScore });
    this.highScores = this.highScores.slice(0, 3);
    localStorage.setItem('centipede_highscores', JSON.stringify(this.highScores));
    
    if (this.blinkTween) this.blinkTween.destroy();
    
    // Reiniciar el menú para mostrar la tabla actualizada
    this.scene.restart({ lastScore: 0 });
}

    _showHighScores() {
        this.add.spriteText(this.scale.width / 2, 80, 'HIGH SCORES', { fontSize: 1 }).setOrigin(0.5);
        this.highScores.forEach((hs, i) => {
            const y = 110 + (i * 20);
            this.add.spriteText(this.scale.width / 2, y, `${hs.name} ... ${hs.score}`, { fontSize: 1 }).setOrigin(0.5);
        });
    }

    // Método para mostrar los High Scores con el mensaje original
    _showHighScores() {
        this.add.spriteText(this.scale.width / 2, 80, 'HIGH SCORES', { fontSize: 1 }).setOrigin(0.5);
        
        this.highScores.forEach((hs, i) => {
            const y = 110 + (i * 20);
            this.add.spriteText(this.scale.width / 2, y, `${hs.name} ... ${hs.score}`, { fontSize: 1 }).setOrigin(0.5);
        });

        // Restauramos el mensaje de "PRESS ANY KEY" con su animación[cite: 2]
        const startMsg = this.add.spriteText(this.scale.width / 2, 200, 'PRESS ANY KEY TO START', { fontSize: 1 }).setOrigin(0.5);
        this.tweens.add({ targets: startMsg, alpha: 0, duration: 500, yoyo: true, loop: -1 });
    }

        // Nuevo listener que escucha cualquier entrada
    _setupStartListener() {
        const start = () => {
            // Solo iniciamos si no estamos en modo ingreso de nombre
            if (!this.isEnteringName) {
                this.scene.start('Game');
            }
        };
        
        // Captura cualquier click o pulsación de teclado[cite: 2]
        this.input.once('pointerdown', start); 
        this.input.keyboard.once('keydown', start); 
    }
}
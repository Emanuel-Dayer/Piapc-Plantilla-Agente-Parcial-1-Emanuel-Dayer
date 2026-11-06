import * as Phaser from "phaser";
import { registerSpriteText } from '../utils/SpriteText.js';

const PRELOAD_CONFIG = {
    COLORS: {
        BACKGROUND: 0x000000,
        PRIMARY_CYAN: 0x00ffff,
        SUCCESS_GREEN: 0x00ff00
    },
    BAR: {
        WIDTH: 200,
        HEIGHT: 20,
        BORDER_THICKNESS: 2,
        PADDING: 2
    },
    MIN_BOOT_TIME: 0
};

export class Preload extends Phaser.Scene {
    constructor() {
        super("Preload");
    }

    init() {
        this.cameras.main.setBackgroundColor(PRELOAD_CONFIG.COLORS.BACKGROUND);
    }

    preload() {
        this.createUI();
        this.setupLoadingListeners();


        //CARGA DE ASSETS
        this.load.setPath("assets");
        this.load.image('Fondo_Prueba', 'Fondo_Prueba.png');

        // CARGA DE ATLAS
        this.load.atlas("Atlas", "Atlas.png", "Atlas.json");
        this.load.atlas('Spritesheet_Fuente', 'Spritesheet_Fuente.png', 'Spritesheet_Fuente.json');
        
        // CARGA DE AUDIO
        this.load.audio('Flea_drop', 'Flea_drop.wav');
                this.load.audio('Player_Death', 'Player_Death.wav');
                this.load.audio('Scorpion', 'Scorpion.wav');
                this.load.audio('Shot', 'Shot.wav');
                this.load.audio('Spider', 'Spider.wav');
                this.load.audio('Spider_2', 'Spider_2.wav');
                this.load.audio('Centipede_Walk', 'Centipede_Walk.wav');
                this.load.audio('Enemy_Death', 'Enemy_Death.wav');
                this.load.audio('Extra_Life', 'Extra_Life.wav');
                this.load.audio('Flea', 'Flea.wav');
    }

    create() {
        this.drawProgressBar(1, PRELOAD_CONFIG.COLORS.SUCCESS_GREEN);
        this.transitiontoScene();
        registerSpriteText(this); // basta con llamarlo una vez
    }

    createUI() {
        const { width, height } = this.cameras.main;
        const [centerX, centerY] = [width / 2, height / 2];

        const [barWidth, barHeight] = [PRELOAD_CONFIG.BAR.WIDTH, PRELOAD_CONFIG.BAR.HEIGHT];
        const [barX, barY] = [centerX - barWidth / 2, centerY - barHeight / 2];
        const borderThickness = PRELOAD_CONFIG.BAR.BORDER_THICKNESS;

        this.uiContainer = this.add.container(0, 0);
        this.progressBox = this.add.graphics();
        this.progressBox.lineStyle(borderThickness, PRELOAD_CONFIG.COLORS.PRIMARY_CYAN, 0.7);
        this.progressBox.strokeRect(barX, barY, barWidth, barHeight);
        
        this.progressBar = this.add.graphics();
        this.uiContainer.add([this.progressBox, this.progressBar]);

        this.uiMetrics = { barX, barY, barWidth, barHeight, borderThickness };
    }


    setupLoadingListeners() {
        this.load.on('progress', (value) => {
            this.drawProgressBar(value, PRELOAD_CONFIG.COLORS.PRIMARY_CYAN);
        });
    }

    drawProgressBar(value, color) {
        const { barX, barY, barWidth, barHeight, borderThickness } = this.uiMetrics;
        const padding = PRELOAD_CONFIG.BAR.PADDING;
        const fillW = Math.max(0, (barWidth - padding * 2) * value);
        const fillH = Math.max(0, barHeight - padding * 2);

        this.progressBar.clear();
        this.progressBar.fillStyle(color, 0.8);
        this.progressBar.fillRect(barX + padding, barY + padding, fillW, fillH);
    }

    transitiontoScene() {
        this.time.delayedCall(PRELOAD_CONFIG.MIN_BOOT_TIME, () => {
            this.scene.launch('MainMenu');
            this.scene.bringToTop();

            this.tweens.add({
                targets: this.cameras.main,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.stop('Preload');
                }
            });
        });
    }
}


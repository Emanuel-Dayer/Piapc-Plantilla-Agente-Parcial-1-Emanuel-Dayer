import * as Phaser from "phaser";
import { AUTO, Scale, Game } from 'phaser';
import { Boot } from './scenes/Boot';
import { Preload } from "./scenes/Preload";
import { MainMenu } from './scenes/MainMenu';
import { Game as MainGame } from './scenes/Game';

const config = {
    type: AUTO,
    width: 240,
    height: 256,
    parent: 'game-container',
    backgroundColor: "#000000ff",
    pixelArt: true,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    //activar el inputsystem
    input: {
        keyboard: true,
        gamepad: true,
    },

    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preload,
        MainMenu,
        MainGame,
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;

// Forzar vecino más cercano en el canvas HTML, para que los píxeles se vean nítidos
window.addEventListener('DOMContentLoaded', () => {
  const canvases = document.getElementsByTagName('canvas');
  for (let canvas of canvases) {
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
  }
});
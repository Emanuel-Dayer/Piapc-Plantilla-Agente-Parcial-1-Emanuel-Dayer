/**
 * ControlsStatusUI.js
 * Panel de debug que muestra el estado de controles en pantalla.
 * Compatible con el InputSystem reescrito.
 */

import { INPUT_ACTIONS } from './InputSystem.js';
import { SpriteTextObject, registerSpriteText } from './SpriteText.js';

export class ControlsStatusUI {
  /**
   * @param {Phaser.Scene}  scene
   * @param {InputSystem}   inputSystem
   */
  constructor(scene, inputSystem) {
    this.scene       = scene;
    this.inputSystem = inputSystem;

    // Registrar SpriteText si no está registrado
    registerSpriteText(scene);

    // Convertir el keyMap a strings limpios para mostrar en la UI
    this.keyMap1Str = this._flattenKeyMap(inputSystem.keyMap1);
    this.keyMap2Str = this._flattenKeyMap(inputSystem.keyMap2);

    /** Todos los elementos raíz para poder ocultar/mostrar el panel. */
    this._rootElements = [];

    this._p1GamepadLight = null;
    this._p2GamepadLight = null;
    this._p1ActionLights = {};
    this._p2ActionLights = {};
    this._p1StickL = null;
    this._p1StickR = null;
    this._p2StickL = null;
    this._p2StickR = null;
    this._p1MovementText = null;
    this._p2MovementText = null;
    this._p1ButtonText = null;
    this._p2ButtonText = null;

    this._ACTION_MAP = [
      { action: INPUT_ACTIONS.UP,        label: 'Arriba'     },
      { action: INPUT_ACTIONS.DOWN,      label: 'Abajo'      },
      { action: INPUT_ACTIONS.LEFT,      label: 'Izq'        },
      { action: INPUT_ACTIONS.RIGHT,     label: 'Der'        },
      { action: INPUT_ACTIONS.SHOOT,     label: 'Disparar'   },
    ];

    this._build();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Construcción del panel
  // ──────────────────────────────────────────────────────────────────────────

  /** Devuelve solo el primer nombre de tecla por acción (para mostrar en UI). */
  _flattenKeyMap(keyMap) {
    if (!keyMap) return {};
    const result = {};
    for (const [action, keys] of Object.entries(keyMap)) {
      result[action] = Array.isArray(keys) ? keys[0] : keys;
    }
    return result;
  }

  _build() {
    const { width, height } = this.scene.cameras.main;

    const UI_HEIGHT    = 160;
    const UI_TOP       = (height - UI_HEIGHT) / 2;
    const UI_WIDTH     = width - 20;
    const ROW_SPACING  = 14;
    const LIGHT_RADIUS = 4;
    const LIGHT_X_P1   = 20;
    const LIGHT_X_P2   = width / 2 + 10;
    const INACTIVE     = 0x555555;

    const titleStyle = { fontFamily: 'Arial', fontSize: '9px', color: '#FFFFFF', fontStyle: 'bold' };
    const labelStyle = { fontFamily: 'Arial', fontSize: '7px',  color: '#CCCCCC' };
    const dataStyle  = { fontFamily: 'Arial', fontSize: '6px',  color: '#AAAAAA' };

    // Contenedor (fijado a la pantalla)
    const container = this.scene.add.container(0, 0);
    container.setDepth(1000);
    container.setScrollFactor(0);
    this._rootElements.push(container);

    // Fondo
    const gfx = this.scene.add.graphics({ fillStyle: { color: 0x1c2833, alpha: 0.90 } });
    gfx.fillRoundedRect(10, UI_TOP, UI_WIDTH, UI_HEIGHT, 6);
    gfx.lineStyle(1, 0x4a6572, 1);
    gfx.strokeRoundedRect(10, UI_TOP, UI_WIDTH, UI_HEIGHT, 6);
    container.add(gfx);

    // Separador central
    const sep = this.scene.add.line(0, 0, width / 2, UI_TOP, width / 2, UI_TOP + UI_HEIGHT, 0x4a6572).setOrigin(0);
    container.add(sep);

    let y = UI_TOP + 8;

    // ── Encabezados con indicadores de gamepad ──────────────────────────────
    this._p1GamepadLight = this.scene.add.circle(LIGHT_X_P1 + 85, y, LIGHT_RADIUS, INACTIVE);
    this._p2GamepadLight = this.scene.add.circle(LIGHT_X_P2 + 85, y, LIGHT_RADIUS, INACTIVE);

    container.add([
      this.scene.add.text(LIGHT_X_P1, y, 'P1', { ...titleStyle, color: '#00aaff' }).setOrigin(0, 0.5),
      this._p1GamepadLight,
      this.scene.add.text(LIGHT_X_P2, y, 'P2', { ...titleStyle, color: '#ff5555' }).setOrigin(0, 0.5),
      this._p2GamepadLight,
    ]);

    y += ROW_SPACING;

    // ── Filas de acciones (movimiento y disparar) ───────────────────────────
    this._ACTION_MAP.forEach(({ action, label }, i) => {
      const rowY  = y + ROW_SPACING * i;
      const p1Key = this.keyMap1Str[action] ?? '';
      const p2Key = this.keyMap2Str[action] ?? '';

      this._p1ActionLights[action] = this.scene.add.circle(LIGHT_X_P1 + 75, rowY, LIGHT_RADIUS, INACTIVE);
      this._p2ActionLights[action] = this.scene.add.circle(LIGHT_X_P2 + 75, rowY, LIGHT_RADIUS, INACTIVE);

      container.add([
        this.scene.add.text(LIGHT_X_P1, rowY, `${label} [${p1Key}]`, labelStyle).setOrigin(0, 0.5),
        this._p1ActionLights[action],
        this.scene.add.text(LIGHT_X_P2, rowY, `${label} [${p2Key}]`, labelStyle).setOrigin(0, 0.5),
        this._p2ActionLights[action],
      ]);
    });

    y += ROW_SPACING * this._ACTION_MAP.length + 5;

    // ── Joysticks visuales (pequeños) ───────────────────────────────────────
    const stickSize = 20;
    const stickMargin = 30;
    const stickY = y + 10;

    const p1StickBaseX = LIGHT_X_P1 + 50;
    const p2StickBaseX = LIGHT_X_P2 + 50;

    const createStickBase = (x, y, size, color) => {
      const base = this.scene.add.circle(x, y, size + 1, 0x2c3e50).setStrokeStyle(1, color, 0.7);
      container.add(base);
    };

    // P1 Joysticks
    createStickBase(p1StickBaseX - stickMargin, stickY, stickSize, 0x00aaff);
    this._p1StickL = this.scene.add.circle(p1StickBaseX - stickMargin, stickY, 6, 0x00aaff);
    this._p1StickL.originalX = this._p1StickL.x;
    this._p1StickL.originalY = this._p1StickL.y;

    createStickBase(p1StickBaseX + stickMargin, stickY, stickSize, 0x00aaff);
    this._p1StickR = this.scene.add.circle(p1StickBaseX + stickMargin, stickY, 6, 0x00aaff);
    this._p1StickR.originalX = this._p1StickR.x;
    this._p1StickR.originalY = this._p1StickR.y;

    // P2 Joysticks
    createStickBase(p2StickBaseX - stickMargin, stickY, stickSize, 0xff5555);
    this._p2StickL = this.scene.add.circle(p2StickBaseX - stickMargin, stickY, 6, 0xff5555);
    this._p2StickL.originalX = this._p2StickL.x;
    this._p2StickL.originalY = this._p2StickL.y;

    createStickBase(p2StickBaseX + stickMargin, stickY, stickSize, 0xff5555);
    this._p2StickR = this.scene.add.circle(p2StickBaseX + stickMargin, stickY, 6, 0xff5555);
    this._p2StickR.originalX = this._p2StickR.x;
    this._p2StickR.originalY = this._p2StickR.y;

    container.add([this._p1StickL, this._p1StickR, this._p2StickL, this._p2StickR]);

    y += 60;

    // ── Textos de estado (botones presionados) ──────────────────────────────

    // cambiar por spritetext para mantener consistencia visual con el resto de la UI
    
    this._p1MovementText = this.scene.add.text(LIGHT_X_P1, y -20, 'Mov: --', dataStyle).setOrigin(0, 0.5);
    this._p2MovementText = this.scene.add.text(LIGHT_X_P2, y -20, 'Mov: --', dataStyle).setOrigin(0, 0.5);

    container.add([this._p1MovementText, this._p2MovementText]);

    y += ROW_SPACING;

    this._p1ButtonText = this.scene.add.text(LIGHT_X_P1, y -20, 'GP: --', dataStyle).setOrigin(0, 0.5);
    this._p2ButtonText = this.scene.add.text(LIGHT_X_P2, y -20, 'GP: --', dataStyle).setOrigin(0, 0.5);

    container.add([this._p1ButtonText, this._p2ButtonText]);
  }

  update() {
    this._refreshLights();
    this._updateStickVisuals('player1', this._p1StickL, this._p1StickR);
    this._updateStickVisuals('player2', this._p2StickL, this._p2StickR);
    this._updateMovementText('player1', this._p1MovementText);
    this._updateMovementText('player2', this._p2MovementText);
    this._updateGamepadButtonText('player1', this._p1ButtonText);
    this._updateGamepadButtonText('player2', this._p2ButtonText);
  }

  setVisible(visible) {
    this._rootElements.forEach(el => el.setVisible(visible));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Internos
  // ──────────────────────────────────────────────────────────────────────────

  _refreshLights() {
    const COLOR_P1   = 0x00aaff;
    const COLOR_P2   = 0xff5555;
    const INACTIVE   = 0x555555;

    const gp1 = this.inputSystem.getGamepadInfo('player1');
    const gp2 = this.inputSystem.getGamepadInfo('player2');

    this._p1GamepadLight.setFillStyle(gp1 ? COLOR_P1 : INACTIVE);
    this._p2GamepadLight.setFillStyle(gp2 ? COLOR_P2 : INACTIVE);

    for (const { action } of this._ACTION_MAP) {
      const p1Down = this.inputSystem.isDown(action, 'player1');
      const p2Down = this.inputSystem.isDown(action, 'player2');
      this._p1ActionLights[action].setFillStyle(p1Down ? COLOR_P1 : INACTIVE);
      this._p2ActionLights[action].setFillStyle(p2Down ? COLOR_P2 : INACTIVE);
    }
  }

  _updateStickVisuals(playerKey, stickL, stickR) {
    const gamepad = this.inputSystem.getGamepadInfo(playerKey);
    const stickRadius = 8;

    if (gamepad && gamepad.axes) {
      stickL.x = stickL.originalX + (gamepad.axes[0] || 0) * stickRadius;
      stickL.y = stickL.originalY + (gamepad.axes[1] || 0) * stickRadius;
      stickR.x = stickR.originalX + (gamepad.axes[2] || 0) * stickRadius;
      stickR.y = stickR.originalY + (gamepad.axes[3] || 0) * stickRadius;
    } else {
      stickL.x = stickL.originalX;
      stickL.y = stickL.originalY;
      stickR.x = stickR.originalX;
      stickR.y = stickR.originalY;
    }
  }

  _updateMovementText(playerKey, textObject) {
    const up = this.inputSystem.isDown(INPUT_ACTIONS.UP, playerKey);
    const down = this.inputSystem.isDown(INPUT_ACTIONS.DOWN, playerKey);
    const left = this.inputSystem.isDown(INPUT_ACTIONS.LEFT, playerKey);
    const right = this.inputSystem.isDown(INPUT_ACTIONS.RIGHT, playerKey);

    const directions = [];
    if (up) directions.push('U');
    if (down) directions.push('D');
    if (left) directions.push('L');
    if (right) directions.push('R');

    const text = directions.length > 0 ? directions.join('+') : '--';
    textObject.setText(`Mov: ${text}`);
  }

  _updateGamepadButtonText(playerKey, textObject) {
    const gamepad = this.inputSystem.getGamepadInfo(playerKey);
    
    if (gamepad && gamepad.buttons) {
      const pressed = gamepad.buttons
        .map((button, index) => button && button.pressed ? `B${index}` : null)
        .filter(b => b !== null);
      
      const text = pressed.length > 0 ? pressed.join(',') : '--';
      textObject.setText(`GP: ${text}`);
    } else {
      textObject.setText('GP: --');
    }
  }
}
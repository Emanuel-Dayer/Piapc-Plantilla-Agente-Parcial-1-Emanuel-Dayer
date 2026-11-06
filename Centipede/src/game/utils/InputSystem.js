/**
 * InputSystem.js
 * Sistema de entrada unificado para teclado y gamepad.
 *
 * CORRECCIÓN: destroy() limpia todas las teclas de Phaser correctamente,
 * evitando que al hacer scene.restart() las teclas queden "muertas".
 */

export const INPUT_ACTIONS = {
  UP:        'up',
  DOWN:      'down',
  LEFT:      'left',
  RIGHT:     'right',
  SHOOT:     'shoot',
  DEBUG:     'debug',
  RESTART:   'restart',
  TOGGLE_UI: 'toggle_ui',
};

// ─── Mapeo de botones de gamepad ────────────────────────────────────────────
const GAMEPAD_MAP = {
  [INPUT_ACTIONS.SHOOT]:     [
    { btn: 0  },   // A / Cruz
    { btn: 1  },   // B / Círculo
    { btn: 2  },   // X / Cuadrado
    { btn: 3  },   // Y / Triángulo
    { btn: 4  },   // LB / L1
    { btn: 5  },   // RB / R1
    { btn: 6  },   // LT / L2
    { btn: 7  },   // RT / R2
    { btn: 10 },   // L3 (Left stick press)
    { btn: 11 },   // R3 (Right stick press)
  ],
  [INPUT_ACTIONS.DEBUG]:     { btn: 8  },  // Select / Share
  [INPUT_ACTIONS.RESTART]:   { btn: 9  },  // Start / Options
  [INPUT_ACTIONS.TOGGLE_UI]: { btn: 16 },  // Home / Guía
};

const DEADZONE = 0.25;

export default class InputSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {Object} keyMap1  Mapeo de teclas P1 { [INPUT_ACTION]: string | string[] }
   * @param {Object} [keyMap2] Mapeo de teclas P2
   */
  constructor(scene, keyMap1, keyMap2 = {}) {
    this.scene   = scene;
    this.keyMap1 = keyMap1;
    this.keyMap2 = keyMap2;

    /** @type {Map<string, Record<string,boolean>>} */
    this._prevKeyState     = new Map();
    /** @type {Map<string, Record<string,boolean>>} */
    this._prevGamepadState = new Map();

    this._keys = { player1: {}, player2: {} };

    this._gamepad = [null, null];
    this._swapped       = false;
    this._swapDebounce  = false;

    // Guardar referencias para poder remover listeners de window
    this._onConnect    = (e) => this._handleConnection(e, true);
    this._onDisconnect = (e) => this._handleConnection(e, false);

    this._setupKeyboard(keyMap1, 'player1');
    this._setupKeyboard(keyMap2, 'player2');

    window.addEventListener('gamepadconnected',    this._onConnect);
    window.addEventListener('gamepaddisconnected', this._onDisconnect);
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  /** Registra teclas en Phaser para un jugador. Soporta array de teclas por acción. */
  _setupKeyboard(keyMap, player) {
    if (!keyMap || !this.scene.input?.keyboard) return;

    for (const action of Object.keys(keyMap)) {
      const names = [].concat(keyMap[action]); // normaliza string → [string]
      this._keys[player][action] = names.map(n =>
        this.scene.input.keyboard.addKey(n)
      );
    }
  }

  // ─── Gamepad events ───────────────────────────────────────────────────────

  _handleConnection(e, connected) {
    const { index } = e.gamepad;
    if (!connected) {
      if (index <= 1) this._gamepad[index] = null;
      return;
    }
    if (index <= 1) this._gamepad[index] = e.gamepad;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  /** Debe llamarse al inicio de cada frame (antes de leer inputs). */
  update() {
    const pads = navigator.getGamepads();
    if (this._swapped) {
      this._gamepad[0] = pads[1] ?? null;
      this._gamepad[1] = pads[0] ?? null;
    } else {
      this._gamepad[0] = pads[0] ?? null;
      this._gamepad[1] = pads[1] ?? null;
    }
  }

  /** Debe llamarse al final de cada frame (después de leer inputs). */
  lateUpdate() {
    this._savePrevState('player1');
    this._savePrevState('player2');
  }

  _savePrevState(player) {
    // Teclado
    const keySnapshot = {};
    for (const action of Object.keys(this._keys[player])) {
      keySnapshot[action] = this._keys[player][action].some(k => k.isDown);
    }
    this._prevKeyState.set(player, keySnapshot);

    // Gamepad
    const pad = this._getGamepad(player);
    if (pad) {
      this._prevGamepadState.set(player, this._snapshotGamepad(pad));
    } else {
      this._prevGamepadState.delete(player);
    }
  }

  // ─── Lectura de estado ────────────────────────────────────────────────────

  /**
   * Devuelve true mientras la acción esté presionada.
   * @param {string} action  INPUT_ACTIONS.*
   * @param {string} [player]
   */
  isDown(action, player = 'player1') {
    return this._keyIsDown(action, player) || this._padIsDown(action, player);
  }

  /**
   * Devuelve true solo en el primer frame que la acción fue presionada.
   * @param {string} action  INPUT_ACTIONS.*
   * @param {string} [player]
   */
  isJustPressed(action, player = 'player1') {
    return this._keyJustPressed(action, player) || this._padJustPressed(action, player);
  }

  // ─── Teclado helpers ──────────────────────────────────────────────────────

  _keyIsDown(action, player) {
    return this._keys[player]?.[action]?.some(k => k.isDown) ?? false;
  }

  _keyJustPressed(action, player) {
    const keys = this._keys[player]?.[action];
    if (!keys) return false;
    const nowDown  = keys.some(k => k.isDown);
    const wasDown  = this._prevKeyState.get(player)?.[action] ?? false;
    return nowDown && !wasDown;
  }

  // ─── Gamepad helpers ──────────────────────────────────────────────────────

  _getGamepad(player) {
    return this._gamepad[player === 'player1' ? 0 : 1];
  }

  /** Crea un snapshot booleano de las acciones del gamepad. */
  _snapshotGamepad(pad) {
    if (!pad) return {};
    const { axes, buttons } = pad;
    const snap = {
      [INPUT_ACTIONS.UP]:    axes[1] < -DEADZONE || !!buttons[12]?.pressed,
      [INPUT_ACTIONS.DOWN]:  axes[1] >  DEADZONE || !!buttons[13]?.pressed,
      [INPUT_ACTIONS.LEFT]:  axes[0] < -DEADZONE || !!buttons[14]?.pressed,
      [INPUT_ACTIONS.RIGHT]: axes[0] >  DEADZONE || !!buttons[15]?.pressed,
      // Joystick derecho para disparar (axes[2] y axes[3])
      [INPUT_ACTIONS.SHOOT]:  
        axes[2] < -DEADZONE || axes[2] > DEADZONE ||
        axes[3] < -DEADZONE || axes[3] > DEADZONE,
    };
    for (const [action, buttonConfig] of Object.entries(GAMEPAD_MAP)) {
      if (action === INPUT_ACTIONS.SHOOT) {
        // SHOOT mapea múltiples botones
        const buttons_arr = Array.isArray(buttonConfig) ? buttonConfig : [buttonConfig];
        snap[action] = snap[action] || buttons_arr.some(({ btn }) => !!buttons[btn]?.pressed);
      } else {
        // Otros mapeos (DEBUG, RESTART, TOGGLE_UI)
        snap[action] = !!buttons[buttonConfig.btn]?.pressed;
      }
    }
    return snap;
  }

  _padIsDown(action, player) {
    const pad = this._getGamepad(player);
    if (!pad) return false;
    return this._snapshotGamepad(pad)[action] ?? false;
  }

  _padJustPressed(action, player) {
    const pad = this._getGamepad(player);
    if (!pad) return false;
    const now  = this._snapshotGamepad(pad)[action] ?? false;
    const prev = this._prevGamepadState.get(player)?.[action] ?? false;
    return now && !prev;
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  getGamepadInfo(player) {
    return this._getGamepad(player);
  }

  swapPlayers() {
    this._swapped      = !this._swapped;
    this._swapDebounce = true;
  }

  /**
   * Verifica si el botón Home de cualquier gamepad fue pulsado (usado para swap).
   * Con debounce incorporado.
   */
  isSwapButtonPressed() {
    const pads = navigator.getGamepads();
    const pressed = [pads[0], pads[1]].some(p => p?.buttons[16]?.pressed);
    if (pressed) {
      if (this._swapDebounce) return false;
      return true;
    }
    this._swapDebounce = false;
    return false;
  }

  /**
   * Limpia todos los recursos: teclas de Phaser y listeners de window.
   * Llamar desde Game.cleanup() antes de scene.restart() o shutdown.
   */
  destroy() {
    // Quitar todas las teclas de Phaser para que no queden huérfanas
    if (this.scene.input?.keyboard) {
      for (const player of ['player1', 'player2']) {
        for (const keys of Object.values(this._keys[player])) {
          for (const key of keys) {
            this.scene.input.keyboard.removeKey(key);
          }
        }
      }
    }
    this._keys = { player1: {}, player2: {} };

    window.removeEventListener('gamepadconnected',    this._onConnect);
    window.removeEventListener('gamepaddisconnected', this._onDisconnect);
  }
}
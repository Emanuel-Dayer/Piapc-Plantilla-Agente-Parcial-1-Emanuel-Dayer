import * as Phaser from "phaser";

/**
 * SpriteText.js
 * Sistema de texto usando fuente de sprites con soporte para animaciones (Tweens) y origen real.
 */

const FONT_TEXTURE_KEY = 'Spritesheet_Fuente';
const GLYPH_SIZE = 8;

const CHAR_TO_FRAME = {
  '*': '_Asterisco', '/': '_Barra', ',': '_coma', '"': '_Comillas',
  "'": '_ComillaSimple', '&': '_Et', '!': '_Exclamacion', '¡': '_ExclamacionCierre',
  '→': '_Flecha', '=': '_Igual', '+': '_Mas', '>': '_Mayor', '<': '_Menor',
  '-': '_Menos', '#': '_Numeral', '(': '_Parentesis', ')': '_ParentesisCierre',
  '%': '_Porcentaje', '?': '_Pregunta', '¿': '_PreguntaCierre', '.': '_punto',
};

const SPACE_CHAR = ' ';

function charToFrame(char) {
  if (CHAR_TO_FRAME[char]) return CHAR_TO_FRAME[char];
  const upper = char.toUpperCase();
  if (/[A-Z0-9]/.test(upper)) return upper;
  return null;
}

function toLines(text) {
  const raw = Array.isArray(text) ? text.join('\n') : String(text);
  return raw.split('\n');
}

class SpriteTextObject {
  constructor(scene, x, y, text, style = {}) {
    this._scene = scene;

    this._style = {
      fontSize:      style.fontSize      ?? 1,
      align:         style.align         ?? 'left',
      letterSpacing: style.letterSpacing ?? 1,
      lineSpacing:   style.lineSpacing   ?? 2,
      tint:          style.tint          ?? 0xffffff,
      depth:         style.depth         ?? 0,
      alpha:         style.alpha         ?? 1,
      scrollFactor:  style.scrollFactor  ?? 1,
    };

    this._originX = 0;
    this._originY = 0;

    // El contenedor actúa como el objeto principal
    this._container = scene.add.container(x, y);
    this._container.setDepth(this._style.depth);
    this._container.setAlpha(this._style.alpha);
    this._container.setScrollFactor(this._style.scrollFactor);

    this._text    = '';
    this._glyphs  = [];
    this._width   = 0;
    this._height  = 0;

    this.setText(text);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GETTERS / SETTERS (Compatibles con Tweens de Phaser)
  // ══════════════════════════════════════════════════════════════════════════

  get x() { return this._container.x; }
  set x(v) { this._container.x = v; }

  get y() { return this._container.y; }
  set y(v) { this._container.y = v; }

  get alpha() { return this._container.alpha; }
  set alpha(v) { this.setAlpha(v); }

  get scale() { return this._container.scale; }
  set scale(v) { this.setScale(v); }

  get scaleX() { return this._container.scaleX; }
  set scaleX(v) { this._container.scaleX = v; }

  get scaleY() { return this._container.scaleY; }
  set scaleY(v) { this._container.scaleY = v; }

  get depth() { return this._container.depth; }
  set depth(v) { this.setDepth(v); }

  get visible() { return this._container.visible; }
  set visible(v) { this.setVisible(v); }

  get originX() { return this._originX; }
  get originY() { return this._originY; }

  get width() { return this._width; }
  get height() { return this._height; }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════════════════════

  setText(text) {
    this._text = Array.isArray(text) ? text.join('\n') : String(text);
    this._rebuild();
    return this;
  }

  setOrigin(x, y) {
    this._originX = x;
    this._originY = y ?? x;
    this._rebuild(); // Reconstruimos para reposicionar glifos respecto al 0,0 del contenedor
    return this;
  }

  setDepth(depth) {
    this._style.depth = depth;
    this._container.setDepth(depth);
    return this;
  }

  setAlpha(alpha) {
    this._style.alpha = alpha;
    this._container.setAlpha(alpha);
    return this;
  }

  setVisible(visible) {
    this._container.setVisible(visible);
    return this;
  }

  setTint(tint) {
    this._style.tint = tint;
    this._glyphs.forEach(img => img.setTint(tint));
    return this;
  }

  clearTint() {
    this._style.tint = 0xffffff;
    this._glyphs.forEach(img => img.clearTint());
    return this;
  }

  setScale(x, y) {
    this._container.setScale(x, y ?? x);
    return this;
  }

  setScrollFactor(factor) {
    this._style.scrollFactor = factor;
    this._container.setScrollFactor(factor);
    return this;
  }

  setPosition(x, y) {
    this._container.setPosition(x, y);
    return this;
  }

  destroy() {
    this._glyphs = [];
    this._container.destroy();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNOS
  // ══════════════════════════════════════════════════════════════════════════

  _rebuild() {
    this._glyphs.forEach(img => img.destroy());
    this._glyphs = [];
    this._container.removeAll(false);

    const scale         = this._style.fontSize;
    const glyphW        = GLYPH_SIZE * scale;
    const letterSpacing = this._style.letterSpacing * scale;
    const lineSpacing   = this._style.lineSpacing   * scale;
    const lineHeight    = glyphW + lineSpacing;
    const lines         = toLines(this._text);

    const lineWidths  = lines.map(line => this._measureLine(line, glyphW, letterSpacing));
    const totalWidth  = Math.max(...lineWidths);
    const totalHeight = lines.length * lineHeight - lineSpacing;

    this._width  = totalWidth;
    this._height = totalHeight;

    // El truco para el origen: desplazamos las posiciones de los hijos
    // de modo que el (0,0) del contenedor sea el punto de origen deseado.
    const offsetX = totalWidth * this._originX;
    const offsetY = totalHeight * this._originY;

    lines.forEach((line, lineIdx) => {
      const lineW = lineWidths[lineIdx];
      const startX = this._alignOffsetX(lineW, totalWidth);
      const baseY  = lineIdx * lineHeight;

      let cursorX = startX;

      for (const char of line) {
        if (char === SPACE_CHAR) {
          cursorX += glyphW + letterSpacing;
          continue;
        }

        const frameName = charToFrame(char);
        if (frameName === null) {
          cursorX += glyphW + letterSpacing;
          continue;
        }

        // Posición relativa al centro/origen del contenedor
        const img = this._scene.add.image(
          cursorX - offsetX, 
          baseY - offsetY, 
          FONT_TEXTURE_KEY, 
          frameName
        );
        
        img.setOrigin(0, 0);
        img.setScale(scale);
        img.setTint(this._style.tint);

        this._container.add(img);
        this._glyphs.push(img);

        cursorX += glyphW + letterSpacing;
      }
    });
  }

  _measureLine(line, glyphW, spacing) {
    if (!line.length) return 0;
    return line.length * (glyphW + spacing) - spacing;
  }

  _alignOffsetX(lineWidth, totalWidth) {
    switch (this._style.align) {
      case 'center': return (totalWidth - lineWidth) / 2;
      case 'right':  return totalWidth - lineWidth;
      default:       return 0;
    }
  }
}

let _registered = false;
export function registerSpriteText(scene) {
  if (_registered) return;
  _registered = true;
  Phaser.GameObjects.GameObjectFactory.register('spriteText', function (x, y, text, style) {
    return new SpriteTextObject(this.scene, x, y, text, style);
  });
}

export { SpriteTextObject };
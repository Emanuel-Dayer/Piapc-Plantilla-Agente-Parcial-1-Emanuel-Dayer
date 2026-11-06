// El juego comienza con la paleta original, y va avanzando en cada ronda, despues de la paleta 14, vuelve a la original y el cilco se repite.
const PALETTES = [
  ['#fffdc3', '#fa0200', '#04fe00'], // Palette 1 (original)
  ['#f6c700', '#04febf', '#fb02be'], // Palette 2
  ['#00ffc3', '#ffff00', '#fe0000'], // Palette 3
  ['#00ffc3', '#0400fc', '#ffc000'], // Palette 4
  ['#faff00', '#fc03f5', '#02fec3'], // Palette 5
  ['#0900fe', '#fdc100', '#02fff8'], // Palette 6
  ['#03ff00', '#ff00ff', '#fdff00'], // Palette 7
  ['#f6ff08', '#fd0300', '#01fffd'], // Palette 8
  ['#fe0000', '#04ffb7', '#fe00ff'], // Palette 9
  ['#01ffbf', '#0003fe', '#fdc200'], // Palette 10
  ['#ffffc1', '#fe0000', '#00ffc7'], // Palette 11
  ['#f30600', '#f902ff', '#06fb0a'], // Palette 12
  ['#fbff03', '#0200fe', '#fe0002'], // Palette 13
  ['#07fe00', '#ff00ff', '#f9ffc1'], // Palette 14 (after this Palette cycles back to Palette 1)
];

export default class PaletteManager {
  constructor() {
    this._round = 1;
  }
}
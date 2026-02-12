// ANSI color helpers for Matrix terminal effects

export const matrixGreen = '\x1b[32m';
export const matrixBrightGreen = '\x1b[92m';
export const matrixDarkGreen = '\x1b[2;32m';
export const matrixWhite = '\x1b[97m';
export const matrixRed = '\x1b[31m';
export const matrixYellow = '\x1b[33m';
export const reset = '\x1b[0m';
export const bold = '\x1b[1m';
export const dim = '\x1b[2m';

const matrixChars =
  'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロワヲンヴ0123456789';

export function getRandomMatrixChar(): string {
  return matrixChars[Math.floor(Math.random() * matrixChars.length)];
}

export function getMatrixRainLine(width: number): string {
  let line = '';
  for (let i = 0; i < width; i++) {
    if (Math.random() > 0.7) {
      line += getRandomMatrixChar();
    } else {
      line += ' ';
    }
  }
  return line;
}

import { Position, CellType } from './types';
import { SIM_CONFIG } from './config';

export class World {
  public gridSize: number;
  private grid: CellType[][];

  constructor() {
    this.gridSize = SIM_CONFIG.gridSize;
    this.grid = this.createGrid();
  }

  private createGrid(): CellType[][] {
    const grid: CellType[][] = [];
    for (let y = 0; y < this.gridSize; y++) {
      grid[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        grid[y][x] = 'empty';
      }
    }
    return grid;
  }

  reset(): void {
    this.grid = this.createGrid();
  }

  getGrid(): CellType[][] {
    return this.grid;
  }

  setCell(pos: Position, type: CellType): void {
    if (this.isInBounds(pos)) {
      this.grid[pos.y][pos.x] = type;
    }
  }

  getCell(pos: Position): CellType {
    if (!this.isInBounds(pos)) return 'wall';
    return this.grid[pos.y][pos.x];
  }

  isInBounds(pos: Position): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.gridSize &&
      pos.y >= 0 &&
      pos.y < this.gridSize
    );
  }

  isWalkable(pos: Position): boolean {
    return this.isInBounds(pos) && this.grid[pos.y][pos.x] !== 'wall';
  }

  getDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  getNeighbors(pos: Position): Position[] {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    return dirs
      .map((d) => ({ x: pos.x + d.x, y: pos.y + d.y }))
      .filter((p) => this.isInBounds(p));
  }
}

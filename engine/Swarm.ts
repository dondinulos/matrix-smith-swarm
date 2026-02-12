import {
  SmithAgentState,
  Position,
  SwarmStrategy,
  SimulationEvent,
  WorldInterface,
} from './types';
import { createSmith, smithTick } from './SmithAgent';
import { SIM_CONFIG } from './config';

export class Swarm {
  public smiths: SmithAgentState[] = [];
  public generation = 1;
  public strategy: SwarmStrategy = 'CHASE';
  public nextReplication: number;

  constructor() {
    this.nextReplication = SIM_CONFIG.replicationInterval;
  }

  init(gridSize: number): void {
    this.smiths = [];
    this.generation = 1;
    this.strategy = 'CHASE';
    this.nextReplication = SIM_CONFIG.replicationInterval;

    const positions = this.getSpawnPositions(
      SIM_CONFIG.initialSmiths,
      gridSize,
    );
    for (const pos of positions) {
      this.smiths.push(createSmith(pos, 1));
    }
  }

  private getSpawnPositions(count: number, gridSize: number): Position[] {
    const positions: Position[] = [];
    const center = Math.floor(gridSize / 2);
    const minDist = 5;

    while (positions.length < count) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const dist = Math.abs(x - center) + Math.abs(y - center);
      if (dist >= minDist) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  tick(
    tick: number,
    neoPos: Position,
    world: WorldInterface,
    events: SimulationEvent[],
  ): void {
    this.updateStrategy();

    // Assign current strategy to all active smiths
    for (const smith of this.getActive()) {
      smith.strategy = this.strategy;
    }

    // Tick each smith
    for (const smith of this.smiths) {
      smithTick(smith, neoPos, world);
    }

    // Handle replication
    this.nextReplication--;
    if (
      this.nextReplication <= 0 &&
      this.getActive().length < SIM_CONFIG.maxSmiths
    ) {
      this.replicate(tick, world, events);
      this.nextReplication = SIM_CONFIG.replicationInterval;
    }
  }

  private updateStrategy(): void {
    const activeCount = this.getActive().length;
    if (activeCount >= 10) {
      this.strategy = 'SURROUND';
    } else if (activeCount >= 5) {
      this.strategy = 'FLANK';
    } else {
      this.strategy = 'CHASE';
    }
  }

  replicate(
    tick: number,
    world: WorldInterface,
    events: SimulationEvent[],
  ): void {
    const active = this.getActive();
    if (active.length === 0 || active.length >= SIM_CONFIG.maxSmiths) return;

    const parent = active[Math.floor(Math.random() * active.length)];
    const spawnPos = this.findAdjacentEmpty(parent.position, world);

    if (spawnPos) {
      this.generation++;
      const newSmith = createSmith(spawnPos, this.generation);
      this.smiths.push(newSmith);
      events.push({
        tick,
        message: `${parent.id} replicated → ${newSmith.id}`,
        type: 'info',
      });
    }
  }

  private findAdjacentEmpty(
    pos: Position,
    world: WorldInterface,
  ): Position | null {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ];
    const shuffled = dirs.sort(() => Math.random() - 0.5);

    for (const d of shuffled) {
      const neighbor = { x: pos.x + d.x, y: pos.y + d.y };
      if (world.isInBounds(neighbor)) {
        const occupied = this.smiths.some(
          (s) =>
            s.state !== 'destroyed' &&
            s.position.x === neighbor.x &&
            s.position.y === neighbor.y,
        );
        if (!occupied) return neighbor;
      }
    }
    return null;
  }

  getActive(): SmithAgentState[] {
    return this.smiths.filter((s) => s.state !== 'destroyed');
  }

  getPositions(): Position[] {
    return this.getActive().map((s) => ({ ...s.position }));
  }

  removeDestroyed(): void {
    this.smiths = this.smiths.filter((s) => s.state !== 'destroyed');
  }
}

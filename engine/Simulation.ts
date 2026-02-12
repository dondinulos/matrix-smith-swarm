import {
  SimulationState,
  SimulationEvent,
  SimPhase,
  SimResult,
  WorldInterface,
  SwarmStrategy,
} from './types';
import { World } from './World';
import { NeoAgent } from './NeoAgent';
import { Swarm } from './Swarm';
import { createSmith, resetSmithCounter } from './SmithAgent';
import { SIM_CONFIG } from './config';

export class Simulation {
  private world: World;
  private neo: NeoAgent;
  private swarm: Swarm;
  private tickCount = 0;
  private phase: SimPhase = 'HUNT';
  private events: SimulationEvent[] = [];
  private result: SimResult = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private bulletTimeActive = 0;
  private onTickCallback: ((state: SimulationState) => void) | null = null;

  constructor() {
    this.world = new World();
    this.neo = new NeoAgent(this.world.gridSize);
    this.swarm = new Swarm();
  }

  init(): void {
    this.tickCount = 0;
    this.phase = 'HUNT';
    this.events = [];
    this.result = null;
    this.bulletTimeActive = 0;
    resetSmithCounter();
    this.world.reset();
    this.neo.reset(this.world.gridSize);
    this.swarm.init(this.world.gridSize);

    this.events.push({
      tick: 0,
      message: 'SYSTEM INITIALIZED — The Matrix has you...',
      type: 'info',
    });
    this.events.push({
      tick: 0,
      message: `${SIM_CONFIG.initialSmiths} Smith agents deployed`,
      type: 'info',
    });
  }

  setOnTick(callback: (state: SimulationState) => void): void {
    this.onTickCallback = callback;
  }

  start(interval?: number): void {
    this.init();
    const tickMs = interval ?? SIM_CONFIG.tickInterval;

    this.intervalId = setInterval(() => {
      this.tick();
      if (this.onTickCallback) {
        this.onTickCallback(this.getState());
      }
      if (this.result) {
        this.stop();
        if (SIM_CONFIG.autoRestart) {
          setTimeout(() => this.start(tickMs), 3000);
        }
      }
    }, tickMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick(): void {
    if (this.result) return;
    this.tickCount++;

    // Update phase
    this.updatePhase();

    // Bullet time slows smiths — they skip their turn
    if (this.bulletTimeActive > 0) {
      this.bulletTimeActive--;
    } else {
      const worldIface = this.getWorldInterface();
      this.swarm.tick(
        this.tickCount,
        this.neo.state.position,
        worldIface,
        this.events,
      );
    }

    // Neo tick
    const worldIface = this.getWorldInterface();
    const neoResult = this.neo.tick(
      this.tickCount,
      this.swarm.smiths,
      worldIface,
      this.events,
    );

    if (neoResult.bulletTimeActivated) {
      this.bulletTimeActive = SIM_CONFIG.bulletTimeDuration;
    }

    // Clean up destroyed smiths periodically
    if (this.tickCount % 10 === 0) {
      this.swarm.removeDestroyed();
    }

    // Check end conditions
    if (!this.neo.state.alive) {
      this.result = 'SMITH_WINS';
      this.phase = 'RESOLUTION';
      this.events.push({
        tick: this.tickCount,
        message: 'THE MATRIX HAS FALLEN — Smith wins',
        type: 'critical',
      });
    } else if (this.tickCount >= SIM_CONFIG.survivalTarget) {
      this.result = 'NEO_WINS';
      this.phase = 'RESOLUTION';
      this.events.push({
        tick: this.tickCount,
        message: 'NEO SURVIVES — The One prevails',
        type: 'shockwave',
      });
    }

    // Rebuild grid for rendering
    this.updateGrid();
  }

  private updatePhase(): void {
    if (this.tickCount <= SIM_CONFIG.huntPhaseEnd) {
      this.phase = 'HUNT';
    } else if (this.tickCount <= SIM_CONFIG.replicationPhaseEnd) {
      this.phase = 'REPLICATION';
    } else {
      this.phase = 'BURLY_BRAWL';
    }
  }

  private updateGrid(): void {
    this.world.reset();
    for (const smith of this.swarm.getActive()) {
      this.world.setCell(smith.position, 'smith');
    }
    if (this.neo.state.alive) {
      this.world.setCell(this.neo.state.position, 'neo');
    }
  }

  private getWorldInterface(): WorldInterface {
    const world = this.world;
    const swarm = this.swarm;
    const neo = this.neo;

    return {
      gridSize: world.gridSize,
      isWalkable: (pos) => world.isWalkable(pos),
      isInBounds: (pos) => world.isInBounds(pos),
      getDistance: (a, b) => world.getDistance(a, b),
      getSmithPositions: () => swarm.getPositions(),
      getNeoPosition: () => ({ ...neo.state.position }),
    };
  }

  getState(): SimulationState {
    return {
      tick: this.tickCount,
      phase: this.phase,
      grid: this.world.getGrid(),
      neo: { ...this.neo.state, position: { ...this.neo.state.position } },
      smiths: this.swarm.smiths.map((s) => ({
        ...s,
        position: { ...s.position },
      })),
      swarm: {
        count: this.swarm.getActive().length,
        generation: this.swarm.generation,
        strategy: this.swarm.strategy,
        nextReplication: this.swarm.nextReplication,
      },
      events: this.events.slice(-20),
      result: this.result,
    };
  }

  // --- MCP-exposed methods ---

  spawnSmith(x: number, y: number): void {
    const pos = { x, y };
    if (this.world.isInBounds(pos)) {
      this.swarm.smiths.push(createSmith(pos, this.swarm.generation));
      this.events.push({
        tick: this.tickCount,
        message: `External spawn: new Smith at (${x}, ${y})`,
        type: 'warning',
      });
    }
  }

  setSwarmStrategy(strategy: SwarmStrategy): void {
    this.swarm.strategy = strategy;
    this.events.push({
      tick: this.tickCount,
      message: `Swarm strategy override: ${strategy}`,
      type: 'warning',
    });
  }
}

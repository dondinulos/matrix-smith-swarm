import {
  NeoState,
  Position,
  SimulationEvent,
  SmithAgentState,
  FleetState,
  WorldInterface,
} from './types';
import { stunSmith, destroySmith } from './SmithAgent';
import { deployFleet, tickFleet, hasCommsNearby } from './FleetAgent';
import { SIM_CONFIG } from './config';

export class NeoAgent {
  public state: NeoState;

  constructor(gridSize: number) {
    const center = Math.floor(gridSize / 2);
    this.state = {
      position: { x: center, y: center },
      shockwaveReady: true,
      shockwaveCooldown: 0,
      bulletTimeLeft: SIM_CONFIG.bulletTimeUses,
      dodgeCooldown: 0,
      fleetCooldown: 0,
      fleetDeployed: 0,
      alive: true,
    };
  }

  reset(gridSize: number): void {
    const center = Math.floor(gridSize / 2);
    this.state = {
      position: { x: center, y: center },
      shockwaveReady: true,
      shockwaveCooldown: 0,
      bulletTimeLeft: SIM_CONFIG.bulletTimeUses,
      dodgeCooldown: 0,
      fleetCooldown: 0,
      fleetDeployed: 0,
      alive: true,
    };
  }

  tick(
    tick: number,
    smiths: SmithAgentState[],
    world: WorldInterface,
    events: SimulationEvent[],
    fleet: FleetState,
  ): { bulletTimeActivated: boolean; shockwaveActivated: boolean; fleetDeployed: boolean } {
    let bulletTimeActivated = false;
    let shockwaveActivated = false;
    let fleetDeployed = false;

    if (!this.state.alive)
      return { bulletTimeActivated, shockwaveActivated, fleetDeployed };

    // Decrease cooldowns
    if (this.state.shockwaveCooldown > 0) {
      this.state.shockwaveCooldown--;
      // Comms aura: reduce cooldown faster
      if (hasCommsNearby(fleet, this.state.position, world) && this.state.shockwaveCooldown > 0) {
        this.state.shockwaveCooldown = Math.max(0, this.state.shockwaveCooldown - 1);
      }
      this.state.shockwaveReady = this.state.shockwaveCooldown <= 0;
    }
    if (this.state.dodgeCooldown > 0) {
      this.state.dodgeCooldown--;
    }
    if (this.state.fleetCooldown > 0) {
      this.state.fleetCooldown--;
    }

    const activeSmiths = smiths.filter((s) => s.state === 'active');
    const nearbyCount = this.countSmithsInRange(
      activeSmiths,
      SIM_CONFIG.surroundRange,
    );
    const mediumRangeCount = this.countSmithsInRange(
      activeSmiths,
      SIM_CONFIG.bulletTimeRange,
    );

    // Shockwave trigger (highest priority — desperation move)
    if (nearbyCount >= SIM_CONFIG.surroundTrigger && this.state.shockwaveReady) {
      shockwaveActivated = true;
      this.shockwave(tick, smiths, world, events);
    }
    // Bullet time trigger
    else if (
      mediumRangeCount >= SIM_CONFIG.bulletTimeTriggerThreshold &&
      this.state.bulletTimeLeft > 0
    ) {
      bulletTimeActivated = true;
      this.state.bulletTimeLeft--;
      events.push({
        tick,
        message: `Neo activated BULLET TIME (${this.state.bulletTimeLeft} uses left)`,
        type: 'warning',
      });
    }

    // Fleet deployment trigger
    if (
      activeSmiths.length >= SIM_CONFIG.fleetDeployThreshold &&
      this.state.fleetCooldown <= 0 &&
      fleet.agents.length < SIM_CONFIG.maxFleetAgents
    ) {
      const newAgents = deployFleet(this.state.position, world, tick, events);
      fleet.agents.push(...newAgents);
      fleet.totalDeployed += newAgents.length;
      this.state.fleetDeployed += newAgents.length;
      this.state.fleetCooldown = SIM_CONFIG.fleetCooldown;
      fleetDeployed = true;
    }

    // Tick fleet agents
    tickFleet(fleet, smiths, this.state.position, world, tick, events);

    // Move toward safety
    this.moveToSafety(activeSmiths, world);

    // Check capture (Smith on same tile)
    const captured = activeSmiths.some(
      (s) =>
        s.position.x === this.state.position.x &&
        s.position.y === this.state.position.y,
    );

    if (captured) {
      if (this.state.dodgeCooldown <= 0) {
        this.state.dodgeCooldown = SIM_CONFIG.dodgeCooldown;
        events.push({
          tick,
          message: 'Neo dodged a Smith attack',
          type: 'info',
        });
        this.moveToSafety(activeSmiths, world);
      } else {
        this.state.alive = false;
        events.push({
          tick,
          message: 'NEO HAS BEEN CAPTURED',
          type: 'critical',
        });
      }
    }

    return { bulletTimeActivated, shockwaveActivated, fleetDeployed };
  }

  private shockwave(
    tick: number,
    smiths: SmithAgentState[],
    world: WorldInterface,
    events: SimulationEvent[],
  ): void {
    events.push({
      tick,
      message: '▓▓▓▓▓▓▓▓▓▓ SHOCKWAVE ACTIVATED ▓▓▓▓▓▓▓▓▓▓',
      type: 'shockwave',
    });

    const neo = this.state.position;
    let destroyed = 0;
    let stunned = 0;

    for (const smith of smiths) {
      if (smith.state !== 'active') continue;
      const dist = world.getDistance(smith.position, neo);
      if (dist > SIM_CONFIG.shockwaveRadius) continue;

      // Knockback direction
      const dx = smith.position.x - neo.x;
      const dy = smith.position.y - neo.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
      const knockX = Math.round(
        smith.position.x + (dx / magnitude) * SIM_CONFIG.shockwaveKnockback,
      );
      const knockY = Math.round(
        smith.position.y + (dy / magnitude) * SIM_CONFIG.shockwaveKnockback,
      );

      const finalX = Math.max(0, Math.min(world.gridSize - 1, knockX));
      const finalY = Math.max(0, Math.min(world.gridSize - 1, knockY));

      // All Smiths in shockwave radius are destroyed
      destroySmith(smith);
      destroyed++;
      events.push({
        tick,
        message: `${smith.id} expelled → DESTROYED`,
        type: 'warning',
      });
    }

    this.state.shockwaveCooldown = SIM_CONFIG.shockwaveCooldown;
    this.state.shockwaveReady = false;

    events.push({
      tick,
      message: `Shockwave result: ${destroyed} agents destroyed`,
      type: 'shockwave',
    });
  }

  private moveToSafety(
    activeSmiths: SmithAgentState[],
    world: WorldInterface,
  ): void {
    const neighbors = this.getNeighbors(this.state.position, world);
    neighbors.push(this.state.position); // staying put is an option

    let bestPos = this.state.position;
    let bestScore = -Infinity;

    for (const pos of neighbors) {
      const score = this.evaluatePosition(pos, activeSmiths, world);
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }

    this.state.position = { ...bestPos };
  }

  private evaluatePosition(
    pos: Position,
    smiths: SmithAgentState[],
    world: WorldInterface,
  ): number {
    let score = 0;

    // Distance from nearest smith (higher = safer)
    let minDist = Infinity;
    for (const smith of smiths) {
      const dist = world.getDistance(pos, smith.position);
      if (dist < minDist) minDist = dist;
    }
    score += minDist * 10;

    // Average distance from all smiths
    let totalDist = 0;
    for (const smith of smiths) {
      totalDist += world.getDistance(pos, smith.position);
    }
    score += (totalDist / (smiths.length || 1)) * 2;

    // Penalize walls (fewer escape routes)
    if (pos.x === 0 || pos.x === world.gridSize - 1) score -= 5;
    if (pos.y === 0 || pos.y === world.gridSize - 1) score -= 5;

    // Penalize corners heavily
    const isCorner =
      (pos.x <= 1 || pos.x >= world.gridSize - 2) &&
      (pos.y <= 1 || pos.y >= world.gridSize - 2);
    if (isCorner) score -= 15;

    // Count escape routes (neighbors not occupied by smiths)
    const exits = this.getNeighbors(pos, world).filter((n) => {
      return !smiths.some(
        (s) => s.position.x === n.x && s.position.y === n.y,
      );
    });
    score += exits.length * 3;

    return score;
  }

  private countSmithsInRange(
    smiths: SmithAgentState[],
    range: number,
  ): number {
    return smiths.filter((s) => {
      const dist =
        Math.abs(s.position.x - this.state.position.x) +
        Math.abs(s.position.y - this.state.position.y);
      return dist <= range;
    }).length;
  }

  private getNeighbors(pos: Position, world: WorldInterface): Position[] {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    return dirs
      .map((d) => ({ x: pos.x + d.x, y: pos.y + d.y }))
      .filter((p) => world.isInBounds(p));
  }
}

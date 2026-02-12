import {
  FleetAgentState,
  FleetAgentRole,
  FleetState,
  Position,
  SmithAgentState,
  SimulationEvent,
  WorldInterface,
} from './types';
import { stunSmith, destroySmith } from './SmithAgent';
import { SIM_CONFIG } from './config';

let fleetCounter = 0;

export function resetFleetCounter(): void {
  fleetCounter = 0;
}

const ROLE_LABELS: Record<FleetAgentRole, string> = {
  TRIAGE: 'Triage',
  DIAGNOSIS: 'Diagnosis',
  MITIGATION: 'Mitigation',
  COMMS: 'Comms',
};

const ROLE_CHARS: Record<FleetAgentRole, string> = {
  TRIAGE: 'T',
  DIAGNOSIS: 'D',
  MITIGATION: 'M',
  COMMS: 'C',
};

export { ROLE_CHARS };

function createFleetAgent(
  role: FleetAgentRole,
  position: Position,
): FleetAgentState {
  fleetCounter++;
  return {
    id: `Fleet-${ROLE_LABELS[role]}-${String(fleetCounter).padStart(2, '0')}`,
    role,
    position: { ...position },
    status: 'active',
    targetSmithId: null,
    ticksRemaining: SIM_CONFIG.fleetLifespan,
  };
}

/**
 * Deploy a fleet of 4 agents near Neo's position.
 * Roles: one of each — TRIAGE, DIAGNOSIS, MITIGATION, COMMS.
 */
export function deployFleet(
  neoPos: Position,
  world: WorldInterface,
  tick: number,
  events: SimulationEvent[],
): FleetAgentState[] {
  const roles: FleetAgentRole[] = ['TRIAGE', 'DIAGNOSIS', 'MITIGATION', 'COMMS'];
  const agents: FleetAgentState[] = [];

  events.push({
    tick,
    message: '◆◆◆ NEO DEPLOYS FLEET — Seek and Destroy ◆◆◆',
    type: 'fleet',
  });

  for (const role of roles) {
    const spawnPos = findSpawnNear(neoPos, world, agents);
    if (spawnPos) {
      const agent = createFleetAgent(role, spawnPos);
      agents.push(agent);
      events.push({
        tick,
        message: `Fleet ${ROLE_LABELS[role]} agent ${agent.id} deployed at (${spawnPos.x}, ${spawnPos.y})`,
        type: 'fleet',
      });
    }
  }

  return agents;
}

function findSpawnNear(
  center: Position,
  world: WorldInterface,
  existing: FleetAgentState[],
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
    const pos = { x: center.x + d.x, y: center.y + d.y };
    if (
      world.isInBounds(pos) &&
      !existing.some((a) => a.position.x === pos.x && a.position.y === pos.y)
    ) {
      return pos;
    }
  }
  // Fallback: use Neo's position
  return { ...center };
}

/**
 * Tick all fleet agents. Each role has different behavior:
 * - TRIAGE: Seeks nearest Smith, marks target for others
 * - DIAGNOSIS: Moves to Smith, stuns on contact
 * - MITIGATION: Moves to Smith, destroys on contact
 * - COMMS: Stays near Neo, passive aura role (cooldown reduction handled externally)
 */
export function tickFleet(
  fleet: FleetState,
  smiths: SmithAgentState[],
  neoPos: Position,
  world: WorldInterface,
  tick: number,
  events: SimulationEvent[],
): void {
  const activeSmiths = smiths.filter((s) => s.state === 'active');

  for (const agent of fleet.agents) {
    if (agent.status !== 'active') continue;

    // Lifespan countdown
    agent.ticksRemaining--;
    if (agent.ticksRemaining <= 0) {
      agent.status = 'expired';
      events.push({
        tick,
        message: `${agent.id} expired — mission complete`,
        type: 'fleet',
      });
      continue;
    }

    switch (agent.role) {
      case 'TRIAGE':
        tickTriage(agent, activeSmiths, world, tick, events);
        break;
      case 'DIAGNOSIS':
        tickDiagnosis(agent, activeSmiths, world, tick, events);
        break;
      case 'MITIGATION':
        tickMitigation(agent, activeSmiths, world, tick, events, fleet);
        break;
      case 'COMMS':
        tickComms(agent, neoPos, world);
        break;
    }
  }

  // Clean up expired/engaged
  fleet.agents = fleet.agents.filter((a) => a.status === 'active');
}

/** TRIAGE — Scout. Finds the nearest Smith and moves toward it. Marks target for team. */
function tickTriage(
  agent: FleetAgentState,
  smiths: SmithAgentState[],
  world: WorldInterface,
  tick: number,
  events: SimulationEvent[],
): void {
  const nearest = findNearestSmith(agent.position, smiths, world);
  if (!nearest) return;

  agent.targetSmithId = nearest.id;
  moveToward(agent, nearest.position, world);

  // If on same tile — mark and report
  if (
    agent.position.x === nearest.position.x &&
    agent.position.y === nearest.position.y
  ) {
    events.push({
      tick,
      message: `${agent.id} identified ${nearest.id} at (${nearest.position.x}, ${nearest.position.y})`,
      type: 'fleet',
    });
    // Triage agent continues scouting (doesn't engage)
  }
}

/** DIAGNOSIS — Moves to nearest Smith and stuns on contact. */
function tickDiagnosis(
  agent: FleetAgentState,
  smiths: SmithAgentState[],
  world: WorldInterface,
  tick: number,
  events: SimulationEvent[],
): void {
  const target = findNearestSmith(agent.position, smiths, world);
  if (!target) return;

  agent.targetSmithId = target.id;
  moveToward(agent, target.position, world);

  if (
    agent.position.x === target.position.x &&
    agent.position.y === target.position.y
  ) {
    stunSmith(target, 8);
    agent.status = 'engaged';
    events.push({
      tick,
      message: `${agent.id} stunned ${target.id} — root cause analysis`,
      type: 'fleet',
    });
  }
}

/** MITIGATION — Seeks and destroys Smiths on contact. */
function tickMitigation(
  agent: FleetAgentState,
  smiths: SmithAgentState[],
  world: WorldInterface,
  tick: number,
  events: SimulationEvent[],
  fleet: FleetState,
): void {
  const target = findNearestSmith(agent.position, smiths, world);
  if (!target) return;

  agent.targetSmithId = target.id;
  moveToward(agent, target.position, world);

  if (
    agent.position.x === target.position.x &&
    agent.position.y === target.position.y
  ) {
    destroySmith(target);
    fleet.smithsDestroyed++;
    agent.status = 'engaged';
    events.push({
      tick,
      message: `${agent.id} destroyed ${target.id} — threat mitigated`,
      type: 'fleet',
    });
  }
}

/** COMMS — Stays near Neo, providing support aura. Cooldown reduction handled in NeoAgent. */
function tickComms(
  agent: FleetAgentState,
  neoPos: Position,
  world: WorldInterface,
): void {
  const dist = world.getDistance(agent.position, neoPos);
  if (dist > 2) {
    moveToward(agent, neoPos, world);
  }
  // Otherwise stay close — aura effect is passive
}

/** Check if a COMMS fleet agent is near Neo (within 2 tiles). */
export function hasCommsNearby(
  fleet: FleetState,
  neoPos: Position,
  world: WorldInterface,
): boolean {
  return fleet.agents.some(
    (a) =>
      a.role === 'COMMS' &&
      a.status === 'active' &&
      world.getDistance(a.position, neoPos) <= 2,
  );
}

// --- Helpers ---

function findNearestSmith(
  pos: Position,
  smiths: SmithAgentState[],
  world: WorldInterface,
): SmithAgentState | null {
  let nearest: SmithAgentState | null = null;
  let bestDist = Infinity;

  for (const smith of smiths) {
    const dist = world.getDistance(pos, smith.position);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = smith;
    }
  }

  return bestDist <= SIM_CONFIG.fleetSeekRange ? nearest : null;
}

function moveToward(
  agent: FleetAgentState,
  target: Position,
  world: WorldInterface,
): void {
  const dx = target.x - agent.position.x;
  const dy = target.y - agent.position.y;

  // Move in the direction with the largest gap first
  let newPos: Position;
  if (Math.abs(dx) >= Math.abs(dy)) {
    newPos = { x: agent.position.x + Math.sign(dx), y: agent.position.y };
  } else {
    newPos = { x: agent.position.x, y: agent.position.y + Math.sign(dy) };
  }

  if (world.isInBounds(newPos)) {
    agent.position = newPos;
  }
}

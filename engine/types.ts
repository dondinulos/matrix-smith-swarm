export type CellType = 'empty' | 'neo' | 'smith' | 'fleet' | 'wall';

export interface Position {
  x: number;
  y: number;
}

export type SmithState = 'active' | 'stunned' | 'destroyed';

export type SimPhase = 'HUNT' | 'REPLICATION' | 'BURLY_BRAWL' | 'RESOLUTION';

export type SwarmStrategy = 'CHASE' | 'FLANK' | 'SURROUND';

export type SimResult = 'NEO_WINS' | 'SMITH_WINS' | null;

export interface SmithAgentState {
  id: string;
  position: Position;
  state: SmithState;
  stunnedTicks: number;
  generation: number;
  strategy: SwarmStrategy;
}

export type FleetAgentRole = 'TRIAGE' | 'DIAGNOSIS' | 'MITIGATION' | 'COMMS';

export type FleetAgentStatus = 'active' | 'engaged' | 'expired';

export interface FleetAgentState {
  id: string;
  role: FleetAgentRole;
  position: Position;
  status: FleetAgentStatus;
  targetSmithId: string | null;
  ticksRemaining: number;
}

export interface NeoState {
  position: Position;
  shockwaveReady: boolean;
  shockwaveCooldown: number;
  bulletTimeLeft: number;
  dodgeCooldown: number;
  fleetCooldown: number;
  fleetDeployed: number;
  alive: boolean;
}

export interface SwarmState {
  count: number;
  generation: number;
  strategy: SwarmStrategy;
  nextReplication: number;
}

export interface FleetState {
  agents: FleetAgentState[];
  totalDeployed: number;
  smithsDestroyed: number;
}

export interface SimulationEvent {
  tick: number;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'shockwave' | 'fleet';
}

export interface SimulationState {
  tick: number;
  phase: SimPhase;
  grid: CellType[][];
  neo: NeoState;
  smiths: SmithAgentState[];
  swarm: SwarmState;
  fleet: FleetState;
  events: SimulationEvent[];
  result: SimResult;
}

export interface Strategy {
  name: SwarmStrategy;
  getMove(
    smith: SmithAgentState,
    neo: Position,
    world: WorldInterface,
  ): Position;
}

export interface WorldInterface {
  gridSize: number;
  isWalkable(pos: Position): boolean;
  isInBounds(pos: Position): boolean;
  getDistance(a: Position, b: Position): number;
  getSmithPositions(): Position[];
  getNeoPosition(): Position;
}

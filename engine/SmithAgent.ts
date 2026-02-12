import { SmithAgentState, Position, WorldInterface } from './types';
import { ChaseStrategy } from './strategies/ChaseStrategy';
import { FlankStrategy } from './strategies/FlankStrategy';
import { SurroundStrategy } from './strategies/SurroundStrategy';

const strategies = {
  CHASE: new ChaseStrategy(),
  FLANK: new FlankStrategy(),
  SURROUND: new SurroundStrategy(),
};

let smithCounter = 0;

export function resetSmithCounter(): void {
  smithCounter = 0;
}

export function createSmith(
  position: Position,
  generation: number,
): SmithAgentState {
  smithCounter++;
  return {
    id: `Smith-${String(smithCounter).padStart(2, '0')}`,
    position: { ...position },
    state: 'active',
    stunnedTicks: 0,
    generation,
    strategy: 'CHASE',
  };
}

export function smithTick(
  smith: SmithAgentState,
  neoPos: Position,
  world: WorldInterface,
): void {
  if (smith.state === 'destroyed') return;

  if (smith.state === 'stunned') {
    smith.stunnedTicks--;
    if (smith.stunnedTicks <= 0) {
      smith.state = 'active';
    }
    return;
  }

  // Active — sense, decide, act
  const strategy = strategies[smith.strategy];
  const newPos = strategy.getMove(smith, neoPos, world);
  smith.position = newPos;
}

export function stunSmith(smith: SmithAgentState, ticks: number): void {
  smith.state = 'stunned';
  smith.stunnedTicks = ticks;
}

export function destroySmith(smith: SmithAgentState): void {
  smith.state = 'destroyed';
}

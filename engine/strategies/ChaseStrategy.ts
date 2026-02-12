import { Position, SmithAgentState, Strategy, WorldInterface } from '../types';

export class ChaseStrategy implements Strategy {
  name = 'CHASE' as const;

  getMove(
    smith: SmithAgentState,
    neo: Position,
    world: WorldInterface,
  ): Position {
    const { x, y } = smith.position;
    let bestPos = smith.position;
    let bestDist = world.getDistance(smith.position, neo);

    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const d of dirs) {
      const neighbor = { x: x + d.x, y: y + d.y };
      if (!world.isInBounds(neighbor)) continue;
      const dist = world.getDistance(neighbor, neo);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = neighbor;
      }
    }

    return bestPos;
  }
}

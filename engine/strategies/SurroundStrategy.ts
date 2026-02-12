import { Position, SmithAgentState, Strategy, WorldInterface } from '../types';

export class SurroundStrategy implements Strategy {
  name = 'SURROUND' as const;

  getMove(
    smith: SmithAgentState,
    neo: Position,
    world: WorldInterface,
  ): Position {
    const smiths = world.getSmithPositions();
    const smithIndex = smiths.findIndex(
      (s) => s.x === smith.position.x && s.y === smith.position.y,
    );
    const totalSmiths = smiths.length;

    // Distribute Smiths evenly in a ring around Neo
    const angle = (2 * Math.PI * Math.max(0, smithIndex)) / totalSmiths;
    const radius = 2;
    const targetX = Math.round(neo.x + Math.cos(angle) * radius);
    const targetY = Math.round(neo.y + Math.sin(angle) * radius);

    const target: Position = {
      x: Math.max(0, Math.min(world.gridSize - 1, targetX)),
      y: Math.max(0, Math.min(world.gridSize - 1, targetY)),
    };

    // Move toward assigned perimeter point
    const { x, y } = smith.position;
    let bestPos = smith.position;
    let bestDist = world.getDistance(smith.position, target);

    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const d of dirs) {
      const neighbor = { x: x + d.x, y: y + d.y };
      if (!world.isInBounds(neighbor)) continue;
      const dist = world.getDistance(neighbor, target);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = neighbor;
      }
    }

    return bestPos;
  }
}

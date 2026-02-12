import { Position, SmithAgentState, Strategy, WorldInterface } from '../types';

export class FlankStrategy implements Strategy {
  name = 'FLANK' as const;

  getMove(
    smith: SmithAgentState,
    neo: Position,
    world: WorldInterface,
  ): Position {
    const smithPositions = world.getSmithPositions();

    // Calculate swarm centroid
    let avgX = 0;
    let avgY = 0;
    for (const sp of smithPositions) {
      avgX += sp.x;
      avgY += sp.y;
    }
    avgX /= smithPositions.length || 1;
    avgY /= smithPositions.length || 1;

    // Predict Neo's escape vector (away from swarm center)
    const escapeX = neo.x + Math.sign(neo.x - avgX) * 3;
    const escapeY = neo.y + Math.sign(neo.y - avgY) * 3;

    const target: Position = {
      x: Math.max(0, Math.min(world.gridSize - 1, Math.round(escapeX))),
      y: Math.max(0, Math.min(world.gridSize - 1, Math.round(escapeY))),
    };

    // Move toward the predicted intercept point
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

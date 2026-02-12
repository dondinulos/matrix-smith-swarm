import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Simulation } from '../../engine/Simulation';

export function registerTools(
  server: McpServer,
  simulation: Simulation,
): void {
  // Get current simulation state
  server.tool(
    'get_matrix_state',
    'Get the current state of the Matrix simulation — grid, Neo, swarm, phase',
    {},
    async () => {
      const state = simulation.getState();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                tick: state.tick,
                phase: state.phase,
                neo: state.neo,
                swarm: state.swarm,
                smithCount: state.smiths.filter(
                  (s) => s.state !== 'destroyed',
                ).length,
                result: state.result,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Get detailed swarm telemetry
  server.tool(
    'get_swarm_telemetry',
    'Get detailed Smith agent swarm telemetry — count, generation, strategy, individual agents',
    {},
    async () => {
      const state = simulation.getState();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                swarm: state.swarm,
                agents: state.smiths.map((s) => ({
                  id: s.id,
                  position: s.position,
                  state: s.state,
                  strategy: s.strategy,
                  generation: s.generation,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Spawn a new Smith agent
  server.tool(
    'spawn_smith',
    'Manually spawn a new Smith agent at specific coordinates in the Matrix',
    {
      x: z.number().min(0).max(19).describe('X coordinate (0-19)'),
      y: z.number().min(0).max(19).describe('Y coordinate (0-19)'),
    },
    async ({ x, y }) => {
      simulation.spawnSmith(x, y);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Smith agent spawned at (${x}, ${y})`,
          },
        ],
      };
    },
  );

  // Override swarm strategy
  server.tool(
    'set_swarm_strategy',
    'Override the swarm's current strategy (CHASE, FLANK, or SURROUND)',
    {
      strategy: z
        .enum(['CHASE', 'FLANK', 'SURROUND'])
        .describe('Swarm strategy to apply'),
    },
    async ({ strategy }) => {
      simulation.setSwarmStrategy(strategy);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Swarm strategy set to ${strategy}`,
          },
        ],
      };
    },
  );

  // Get event log
  server.tool(
    'get_simulation_log',
    'Get the recent event log from the Matrix simulation',
    {},
    async () => {
      const state = simulation.getState();
      return {
        content: [
          {
            type: 'text' as const,
            text: state.events
              .map(
                (e) =>
                  `[t${String(e.tick).padStart(3, '0')}] ${e.message}`,
              )
              .join('\n'),
          },
        ],
      };
    },
  );
}

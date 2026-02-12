import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Simulation } from '../../engine/Simulation';
import { registerTools } from './tools';

// Create and start the simulation
const simulation = new Simulation();
simulation.init();
simulation.start();

// Create MCP server
const server = new McpServer({
  name: 'matrix-smith-swarm',
  version: '1.0.0',
});

registerTools(server, simulation);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Matrix Smith Swarm MCP Server running...');

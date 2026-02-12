# The Matrix: Agent Smith Swarm Simulator

An autonomous AI battle simulation where Agent Smith's swarm AI hunts Neo across a Matrix-themed terminal. Watch as Smith agents replicate, coordinate, and employ sophisticated swarm strategies while Neo's survival AI fights back with shockwave blasts and bullet time.

## Overview

- **Fully autonomous** — no user input required. Launch and watch the battle unfold.
- **Dual UI** — run in your terminal (blessed) or browser (React + Canvas code rain).
- **Agent swarm patterns** — Chase, Flank, and Surround strategies with adaptive switching.
- **Neo AI** — autonomous survival agent with threat heatmap, dodge, bullet time, and shockwave.
- **MCP integration** — query and control the simulation via GitHub Copilot Chat.

## Real World Scenario: Incident Swarm Commander

> *"An incident starts as one Smith. Within minutes, it multiplies across services/endpoints. My console shows the replication graph in real-time, explains the spawn reasons, and coordinates specialized agents — triage, diagnosis, mitigation, and comms — so responders can contain the spread instead of chasing tickets."*

This simulation models how cascading incidents behave in production systems. Each Smith agent represents a failure propagating across services — replicating through dependencies, adapting its strategy as it spreads. Neo represents the incident response system: an autonomous coordinator that triages threats, prioritizes containment, and deploys targeted countermeasures (shockwave = mass remediation, bullet time = buying time for diagnosis).

The same swarm patterns powering this Matrix battle — **Chase** (direct alert routing), **Flank** (preemptive mitigation of downstream services), **Surround** (coordinated containment across all affected endpoints) — map directly to how intelligent incident management platforms could operate. The MCP integration layer demonstrates how a responder could query the state of an active incident swarm, inject new signals, or override response strategy in real time through natural language.

## Quick Start

### Install Dependencies

```bash
# From the matrix-smith-swarm/ directory:
npm install

# For the web UI:
npm run web:install

# For MCP server:
cd mcp-server && npm install
```

### Terminal UI (blessed)

```bash
npm run terminal
```

Green-on-black ASCII grid running directly in your terminal. Press `Q` to quit.

### Web UI (React + Canvas)

```bash
npm run web
```

Opens at `http://localhost:5173` — features Matrix code rain, CRT scanlines, shockwave animations, and a glowing terminal aesthetic.

![UI](UI.png)

### MCP Server

```bash
npm run mcp
```

Exposes the running simulation as MCP tools for GitHub Copilot Chat.

## Architecture

```
matrix-smith-swarm/
├── engine/              # Shared game engine (zero UI deps)
│   ├── types.ts         # All interfaces and types
│   ├── config.ts        # Tunable simulation constants
│   ├── World.ts         # Grid state, bounds, distance
│   ├── NeoAgent.ts      # Autonomous Neo AI (threat heatmap)
│   ├── SmithAgent.ts    # Individual Smith agent (state machine)
│   ├── Swarm.ts         # Swarm coordinator (replication, strategy)
│   ├── Simulation.ts    # Main tick loop, phase management
│   └── strategies/
│       ├── ChaseStrategy.ts     # Direct pursuit
│       ├── FlankStrategy.ts     # Intercept escape routes
│       └── SurroundStrategy.ts  # Form perimeter ring
├── terminal/            # CLI UI (blessed)
│   ├── index.ts
│   ├── TerminalRenderer.ts
│   └── effects.ts
├── web/                 # Browser UI (Vite + React)
│   └── src/
│       ├── components/  # MatrixTerminal, SimGrid, CodeRain, etc.
│       └── styles/      # matrix.css, crt.css
└── mcp-server/          # MCP server for Copilot integration
    └── src/
        ├── index.ts
        └── tools.ts     # get_matrix_state, spawn_smith, etc.
```

## Simulation Phases

| Phase | Ticks | What Happens |
|-------|-------|-------------|
| **HUNT** | 0–50 | 3 Smiths spawn and chase Neo |
| **REPLICATION** | 50–150 | Smiths replicate every 20 ticks, strategies escalate |
| **BURLY BRAWL** | 150–300 | Max swarm density, surround tactics, shockwaves fire |
| **RESOLUTION** | End | Neo survives 300 ticks (wins) or gets captured (Smith wins) |

## Neo's Abilities (Auto-Triggered)

| Ability | Trigger | Effect |
|---------|---------|--------|
| **Move** | Every tick | Moves toward lowest threat-density tile |
| **Dodge** | Smith on same tile | Phase through, 5-tick cooldown |
| **Bullet Time** | 5+ Smiths within 3 tiles | Smiths skip 5 ticks (2 uses) |
| **Shockwave** | 3+ Smiths within 2 tiles | Radial blast — knockback, destroy on wall, stun others (30-tick CD) |

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_matrix_state` | Current grid, Neo position, swarm status, phase |
| `get_swarm_telemetry` | Detailed per-agent data — position, state, strategy |
| `spawn_smith` | Inject a new Smith at (x, y) coordinates |
| `set_swarm_strategy` | Override swarm tactic (CHASE / FLANK / SURROUND) |
| `get_simulation_log` | Recent event log entries |

### Using with Copilot Chat

Add to your VS Code MCP settings:

```json
{
  "mcp": {
    "servers": {
      "matrix-swarm": {
        "command": "npx",
        "args": ["tsx", "mcp-server/src/index.ts"],
        "cwd": "<path-to>/matrix-smith-swarm"
      }
    }
  }
}
```

Then ask Copilot: *"How many Smiths are active?"*, *"Spawn 5 Smiths on the east side"*, *"Switch to surround strategy"*.

## Built With

- **GitHub Copilot** — AI-assisted development throughout
- **TypeScript** — shared engine, terminal, web, and MCP server
- **React + Vite** — web UI with Canvas code rain
- **blessed** — terminal UI with ANSI rendering
- **@modelcontextprotocol/sdk** — MCP server integration

## GitHub Copilot Usage

This project was built using GitHub Copilot for:

- Scaffolding the simulation engine architecture
- Implementing swarm AI strategies (chase, flank, surround)
- Designing Neo's threat heatmap and survival AI
- Creating the Matrix terminal CSS theme and CRT effects
- Building the MCP server tool definitions

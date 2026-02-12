import blessed from 'blessed';
import { SimulationState } from '../engine/types';

export class TerminalRenderer {
  private screen: blessed.Widgets.Screen;
  private gridBox: blessed.Widgets.BoxElement;
  private swarmStatus: blessed.Widgets.BoxElement;
  private neoStatus: blessed.Widgets.BoxElement;
  private logBox: blessed.Widgets.Log;
  private header: blessed.Widgets.BoxElement;
  private footer: blessed.Widgets.BoxElement;
  private lastEventCount = 0;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'THE MATRIX — Agent Smith Swarm Simulator',
      fullUnicode: true,
    });

    // Header
    this.header = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      style: { fg: 'green', bg: 'black' },
    });

    // Game grid
    this.gridBox = blessed.box({
      top: 3,
      left: 0,
      width: '70%',
      height: '55%',
      border: { type: 'line' },
      style: {
        fg: 'green',
        bg: 'black',
        border: { fg: 'green' },
      },
      tags: true,
      label: ' MATRIX GRID ',
    });

    // Swarm status
    this.swarmStatus = blessed.box({
      top: 3,
      right: 0,
      width: '30%',
      height: '28%',
      border: { type: 'line' },
      style: {
        fg: 'green',
        bg: 'black',
        border: { fg: 'green' },
      },
      tags: true,
      label: ' SWARM STATUS ',
    });

    // Neo status
    this.neoStatus = blessed.box({
      top: '31%',
      right: 0,
      width: '30%',
      height: '27%',
      border: { type: 'line' },
      style: {
        fg: 'green',
        bg: 'black',
        border: { fg: 'green' },
      },
      tags: true,
      label: ' NEO STATUS ',
    });

    // Event log
    this.logBox = blessed.log({
      bottom: 3,
      left: 0,
      width: '100%',
      height: '35%',
      border: { type: 'line' },
      style: {
        fg: 'green',
        bg: 'black',
        border: { fg: 'green' },
      },
      tags: true,
      label: ' EVENT LOG ',
      scrollable: true,
      scrollbar: {
        style: { bg: 'green' },
      },
    });

    // Footer
    this.footer = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      style: { fg: 'green', bg: 'black' },
    });

    this.screen.append(this.header);
    this.screen.append(this.gridBox);
    this.screen.append(this.swarmStatus);
    this.screen.append(this.neoStatus);
    this.screen.append(this.logBox);
    this.screen.append(this.footer);

    // Quit keys
    this.screen.key(['escape', 'q', 'C-c'], () => {
      process.exit(0);
    });
  }

  render(state: SimulationState): void {
    this.renderHeader(state);
    this.renderGrid(state);
    this.renderSwarmStatus(state);
    this.renderNeoStatus(state);
    this.renderLog(state);
    this.renderFooter(state);
    this.screen.render();
  }

  private renderHeader(state: SimulationState): void {
    const bar = '░'.repeat(20);
    this.header.setContent(
      `\n {bold}{green-fg}THE MATRIX{/green-fg}{/bold}  ${bar}  TICK: {bold}${state.tick}{/bold}  ${bar}  PHASE: {bold}${state.phase}{/bold}`,
    );
  }

  private renderGrid(state: SimulationState): void {
    const lines: string[] = [];
    for (let y = 0; y < state.grid.length; y++) {
      let line = ' ';
      for (let x = 0; x < state.grid[y].length; x++) {
        const cell = state.grid[y][x];
        switch (cell) {
          case 'neo':
            line += '{bold}{white-fg}N{/white-fg}{/bold} ';
            break;
          case 'smith': {
            const smith = state.smiths.find(
              (s) =>
                s.position.x === x &&
                s.position.y === y &&
                s.state === 'stunned',
            );
            if (smith) {
              line += '{yellow-fg}s{/yellow-fg} ';
            } else {
              line += '{red-fg}S{/red-fg} ';
            }
            break;
          }
          case 'fleet': {
            const fleetAgent = state.fleet.agents.find(
              (a) =>
                a.position.x === x &&
                a.position.y === y &&
                a.status === 'active',
            );
            const fChar = fleetAgent ? fleetAgent.role[0] : 'F';
            line += `{cyan-fg}${fChar}{/cyan-fg} `;
            break;
          }
          default:
            line += '{green-fg}.{/green-fg} ';
        }
      }
      lines.push(line);
    }
    this.gridBox.setContent(lines.join('\n'));
  }

  private renderSwarmStatus(state: SimulationState): void {
    const content = [
      ' {bold}SWARM INTELLIGENCE{/bold}',
      ' ─────────────────',
      ` Agents:   {bold}${state.swarm.count}{/bold}`,
      ` Gen:      {bold}${state.swarm.generation}{/bold}`,
      ` Strategy: {bold}${state.swarm.strategy}{/bold}`,
      ` Next rep: ${state.swarm.nextReplication}t`,
    ].join('\n');
    this.swarmStatus.setContent(content);
  }

  private renderNeoStatus(state: SimulationState): void {
    const neo = state.neo;
    const shockStatus = neo.shockwaveReady
      ? '{green-fg}READY{/green-fg}'
      : `{red-fg}CD: ${neo.shockwaveCooldown}t{/red-fg}`;
    const btStatus =
      neo.bulletTimeLeft > 0
        ? `${neo.bulletTimeLeft} left`
        : '{red-fg}DEPLETED{/red-fg}';
    const aliveStatus = neo.alive
      ? '{green-fg}ACTIVE{/green-fg}'
      : '{red-fg}CAPTURED{/red-fg}';
    const dodgeStatus =
      neo.dodgeCooldown <= 0
        ? '{green-fg}READY{/green-fg}'
        : `{yellow-fg}CD: ${neo.dodgeCooldown}t{/yellow-fg}`;

    const content = [
      ' {bold}THE ONE{/bold}',
      ' ─────────────────',
      ` Status:     ${aliveStatus}`,
      ` Position:   (${neo.position.x}, ${neo.position.y})`,
      ` Shockwave:  ${shockStatus}`,
      ` BulletTime: ${btStatus}`,
      ` Dodge:      ${dodgeStatus}`,
      '',
      ' {bold}{cyan-fg}FLEET{/cyan-fg}{/bold}',
      ' ─────────────────',
      ` Active:     {cyan-fg}${state.fleet.agents.length}{/cyan-fg}`,
      ` Deployed:   {cyan-fg}${state.fleet.totalDeployed}{/cyan-fg}`,
      ` Kills:      {cyan-fg}${state.fleet.smithsDestroyed}{/cyan-fg}`,
      ` Fleet CD:   ${neo.fleetCooldown <= 0 ? '{green-fg}READY{/green-fg}' : `{yellow-fg}CD: ${neo.fleetCooldown}t{/yellow-fg}`}`,
    ].join('\n');
    this.neoStatus.setContent(content);
  }

  private renderLog(state: SimulationState): void {
    // Only log new events
    const newEvents = state.events.slice(this.lastEventCount);
    for (const event of newEvents) {
      let prefix = '>';
      let color = 'green';
      switch (event.type) {
        case 'warning':
          color = 'yellow';
          prefix = '!';
          break;
        case 'critical':
          color = 'red';
          prefix = 'X';
          break;
        case 'shockwave':
          color = 'white';
          prefix = '*';
          break;
        case 'fleet':
          color = 'cyan';
          prefix = '◆';
          break;
      }
      this.logBox.log(
        `{${color}-fg}${prefix} [t${String(event.tick).padStart(3, '0')}] ${event.message}{/${color}-fg}`,
      );
    }
    this.lastEventCount = state.events.length;
  }

  private renderFooter(state: SimulationState): void {
    const progress = Math.min(
      100,
      Math.round((state.tick / 300) * 100),
    );
    const filled = Math.floor(progress / 2);
    const empty = 50 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const result = state.result
      ? state.result === 'NEO_WINS'
        ? '  {bold}{green-fg}NEO WINS{/green-fg}{/bold}'
        : '  {bold}{red-fg}SMITH WINS{/red-fg}{/bold}'
      : '';

    this.footer.setContent(
      `\n {green-fg}[AUTO-SIM] [${bar}] ${progress}%${result}  |  Press Q to exit{/green-fg}`,
    );
  }

  destroy(): void {
    this.screen.destroy();
  }
}

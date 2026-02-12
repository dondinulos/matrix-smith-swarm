import { Simulation } from '../engine/Simulation';
import { TerminalRenderer } from './TerminalRenderer';

const simulation = new Simulation();
const renderer = new TerminalRenderer();

simulation.setOnTick((state) => {
  renderer.render(state);
});

simulation.start();

process.on('SIGINT', () => {
  simulation.stop();
  renderer.destroy();
  process.exit(0);
});

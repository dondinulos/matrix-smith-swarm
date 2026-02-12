import { SimulationState } from '@engine/types';
import { CodeRain } from './CodeRain';
import { SimGrid } from './SimGrid';
import { StatusPanel } from './StatusPanel';
import { EventLog } from './EventLog';
import { ShockwaveEffect } from './ShockwaveEffect';

interface Props {
  state: SimulationState;
}

export const MatrixTerminal: React.FC<Props> = ({ state }) => {
  const showShockwave = state.events.some(
    (e) => e.type === 'shockwave' && e.tick === state.tick,
  );

  return (
    <div className="matrix-terminal">
      <CodeRain />
      {showShockwave && <ShockwaveEffect key={state.tick} />}

      <div className="terminal-content">
        <header className="terminal-header">
          <span className="header-title">THE MATRIX</span>
          <span className="header-bar">{'░'.repeat(20)}</span>
          <span className="header-tick">TICK: {state.tick}</span>
          <span className="header-bar">{'░'.repeat(20)}</span>
          <span className="header-phase">{state.phase}</span>
        </header>

        <div className="terminal-body">
          <div className="terminal-left">
            <SimGrid state={state} />
          </div>
          <div className="terminal-right">
            <StatusPanel state={state} />
          </div>
        </div>

        <EventLog events={state.events} />

        <footer className="terminal-footer">
          <span className="footer-mode">[AUTO-SIM]</span>
          <span className="footer-speed">200ms/tick</span>
          <ProgressBar tick={state.tick} target={300} />
          {state.result && (
            <span
              className={`footer-result ${state.result === 'NEO_WINS' ? 'neo-wins' : 'smith-wins'}`}
            >
              {state.result === 'NEO_WINS'
                ? 'NEO SURVIVES'
                : 'SMITH WINS'}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ tick: number; target: number }> = ({
  tick,
  target,
}) => {
  const pct = Math.min(100, Math.round((tick / target) * 100));
  const filled = Math.floor(pct / 2);
  const empty = 50 - filled;
  return (
    <span className="progress-bar">
      {'█'.repeat(filled)}
      {'░'.repeat(empty)} {pct}%
    </span>
  );
};

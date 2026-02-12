import { SimulationState, FleetAgentRole } from '@engine/types';

const FLEET_CHARS: Record<FleetAgentRole, string> = {
  TRIAGE: 'T',
  DIAGNOSIS: 'D',
  MITIGATION: 'M',
  COMMS: 'C',
};

interface Props {
  state: SimulationState;
}

export const SimGrid: React.FC<Props> = ({ state }) => {
  return (
    <div className="sim-grid">
      <div className="grid-border">
        {state.grid.map((row, y) => (
          <div key={y} className="grid-row">
            {row.map((cell, x) => {
              let className = 'grid-cell empty';
              let char = '.';

              if (cell === 'neo') {
                className = 'grid-cell neo';
                char = 'N';
              } else if (cell === 'smith') {
                const smith = state.smiths.find(
                  (s) =>
                    s.position.x === x &&
                    s.position.y === y &&
                    s.state === 'stunned',
                );
                if (smith) {
                  className = 'grid-cell smith-stunned';
                  char = 's';
                } else {
                  className = 'grid-cell smith';
                  char = 'S';
                }
              } else if (cell === 'fleet') {
                const fleetAgent = state.fleet.agents.find(
                  (a) =>
                    a.position.x === x &&
                    a.position.y === y &&
                    a.status === 'active',
                );
                if (fleetAgent) {
                  className = `grid-cell fleet fleet-${fleetAgent.role.toLowerCase()}`;
                  char = FLEET_CHARS[fleetAgent.role];
                } else {
                  className = 'grid-cell fleet';
                  char = 'F';
                }
              }

              return (
                <span key={x} className={className}>
                  {char}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

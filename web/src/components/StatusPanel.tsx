import { SimulationState } from '@engine/types';

interface Props {
  state: SimulationState;
}

export const StatusPanel: React.FC<Props> = ({ state }) => {
  const { swarm, neo, phase, fleet } = state;

  return (
    <div className="status-panel">
      <div className="status-section">
        <h3>SWARM STATUS</h3>
        <div className="status-divider">─────────────</div>
        <div className="status-row">
          <span className="status-label">Agents:</span>
          <span className="status-value">{swarm.count}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Gen:</span>
          <span className="status-value">{swarm.generation}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Strategy:</span>
          <span className="status-value">{swarm.strategy}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Next rep:</span>
          <span className="status-value">{swarm.nextReplication}t</span>
        </div>
        <div className="status-row">
          <span className="status-label">Phase:</span>
          <span
            className={`status-value phase-${phase.toLowerCase().replace('_', '-')}`}
          >
            {phase}
          </span>
        </div>
      </div>

      <div className="status-section">
        <h3>NEO STATUS</h3>
        <div className="status-divider">─────────────</div>
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span
            className={`status-value ${neo.alive ? 'active' : 'captured'}`}
          >
            {neo.alive ? 'ACTIVE' : 'CAPTURED'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">Position:</span>
          <span className="status-value">
            ({neo.position.x}, {neo.position.y})
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">Shockwave:</span>
          <span
            className={`status-value ${neo.shockwaveReady ? 'ready' : 'cooldown'}`}
          >
            {neo.shockwaveReady
              ? 'READY'
              : `CD: ${neo.shockwaveCooldown}t`}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">BulletTime:</span>
          <span
            className={`status-value ${neo.bulletTimeLeft > 0 ? '' : 'depleted'}`}
          >
            {neo.bulletTimeLeft > 0
              ? `${neo.bulletTimeLeft} left`
              : 'DEPLETED'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">Dodge:</span>
          <span
            className={`status-value ${neo.dodgeCooldown <= 0 ? 'ready' : 'cooldown'}`}
          >
            {neo.dodgeCooldown <= 0
              ? 'READY'
              : `CD: ${neo.dodgeCooldown}t`}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">Fleet:</span>
          <span
            className={`status-value ${neo.fleetCooldown <= 0 ? 'ready' : 'cooldown'}`}
          >
            {neo.fleetCooldown <= 0
              ? 'READY'
              : `CD: ${neo.fleetCooldown}t`}
          </span>
        </div>
      </div>

      <div className="status-section fleet-section">
        <h3>FLEET STATUS</h3>
        <div className="status-divider">─────────────</div>
        <div className="status-row">
          <span className="status-label">Active:</span>
          <span className="status-value fleet-value">{fleet.agents.length}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Deployed:</span>
          <span className="status-value fleet-value">{fleet.totalDeployed}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Kills:</span>
          <span className="status-value fleet-value">{fleet.smithsDestroyed}</span>
        </div>
        {fleet.agents.length > 0 && (
          <div className="fleet-roster">
            {fleet.agents.map((a) => (
              <div key={a.id} className="status-row">
                <span className="status-label fleet-role">{a.role[0]}</span>
                <span className="status-value fleet-value">
                  {a.ticksRemaining}t
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

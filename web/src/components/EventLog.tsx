import { useRef, useEffect } from 'react';
import { SimulationEvent } from '@engine/types';

interface Props {
  events: SimulationEvent[];
}

export const EventLog: React.FC<Props> = ({ events }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="event-log" ref={logRef}>
      {events.map((event, i) => {
        let prefix = '>';
        let className = 'log-info';

        switch (event.type) {
          case 'warning':
            prefix = '!';
            className = 'log-warning';
            break;
          case 'critical':
            prefix = 'X';
            className = 'log-critical';
            break;
          case 'shockwave':
            prefix = '*';
            className = 'log-shockwave';
            break;
          case 'fleet':
            prefix = '◆';
            className = 'log-fleet';
            break;
        }

        return (
          <div key={i} className={`log-entry ${className}`}>
            {prefix} [t{String(event.tick).padStart(3, '0')}]{' '}
            {event.message}
          </div>
        );
      })}
    </div>
  );
};

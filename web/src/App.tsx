import { useEffect, useRef, useState } from 'react';
import { Simulation } from '@engine/Simulation';
import { SimulationState } from '@engine/types';
import { MatrixTerminal } from './components/MatrixTerminal';

function App() {
  const simRef = useRef<Simulation | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);

  useEffect(() => {
    const sim = new Simulation();
    simRef.current = sim;

    sim.setOnTick((newState) => {
      setState({ ...newState });
    });

    sim.start();

    return () => {
      sim.stop();
    };
  }, []);

  if (!state) {
    return (
      <div className="matrix-boot">
        <p>INITIALIZING THE MATRIX...</p>
      </div>
    );
  }

  return <MatrixTerminal state={state} />;
}

export default App;

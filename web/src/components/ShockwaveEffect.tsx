import { useState, useEffect } from 'react';

export const ShockwaveEffect: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="shockwave-overlay">
      <div className="shockwave-flash" />
      <div className="shockwave-ring" />
      <div className="shockwave-ring ring-2" />
      <div className="shockwave-ring ring-3" />
    </div>
  );
};

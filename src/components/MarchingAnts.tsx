import React, { useEffect, useState } from 'react';

interface MarchingAntsProps {
  className?: string;
  children: React.ReactNode;
}

const MarchingAnts: React.FC<MarchingAntsProps> = ({ className = '', children }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 8);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {children}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px dashed #000000',
          borderImage: `url("data:image/svg+xml,%3csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0 0h4v4H0z' fill='%23000'/%3e%3cpath d='M4 4h4v4H4z' fill='%23fff'/%3e%3c/svg%3e") 1`,
          animation: `marching-ants 0.8s linear infinite`,
          animationDelay: `${offset * 0.1}s`
        }}
      />
    </div>
  );
};

export default MarchingAnts;
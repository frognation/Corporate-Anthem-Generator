import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  isActive: boolean;
  pitch: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, pitch }) => {
  const [bars, setBars] = useState<number[]>(new Array(16).fill(10));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive) {
      interval = setInterval(() => {
        setBars(prev => prev.map(() => {
          const baseHeight = pitch * 20; 
          return Math.max(5, Math.min(100, baseHeight + Math.random() * 60));
        }));
      }, 80);
    } else {
      setBars(new Array(16).fill(2));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, pitch]);

  return (
    <div className="flex gap-1 items-end h-16 justify-center py-2 border-b-2 border-gray-800 w-full bg-black/80">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`flex-1 ${i % 2 === 0 ? 'bg-lime-400' : 'bg-cyan-400'}`}
          style={{ height: `${height}%`, transition: 'height 0.1s ease' }}
        />
      ))}
    </div>
  );
};
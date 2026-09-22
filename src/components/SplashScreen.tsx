import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  duration = 2000 
}) => {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, duration - 400);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onFinish]);

  if (!visible) return null;

  return (
    <div
      id="app-splash-screen"
      onClick={() => {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 200);
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-400 cursor-pointer select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Center Big Logo */}
      <div className="relative flex items-center justify-center">
        <div className="w-48 h-48 sm:w-64 sm:h-64 relative flex items-center justify-center">
          <AppLogo className="w-44 h-44 sm:w-60 sm:h-60 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse" />
        </div>
      </div>
    </div>
  );
};

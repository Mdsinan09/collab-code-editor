import React, { useState, useEffect } from 'react';

function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // enter -> settle -> slide -> reveal -> exit
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('settle'), 400),
      setTimeout(() => setPhase('slide'), 900),
      setTimeout(() => setPhase('reveal'), 1400),
      setTimeout(() => setPhase('exit'), 3200),
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!visible) return null;

  const getLogoTransform = () => {
    switch (phase) {
      case 'enter': return 'translate(-50%, -50%) scale(0.5)';
      case 'settle': return 'translate(-50%, -50%) scale(1)';
      case 'slide': return 'translate(calc(-50% - 110px), -50%) scale(1)';
      case 'reveal': return 'translate(calc(-50% - 110px), -50%) scale(1)';
      case 'exit': return 'translate(calc(-50% - 110px), -50%) scale(0.9)';
      default: return 'translate(-50%, -50%)';
    }
  };

  const getTextOpacity = () => {
    switch (phase) {
      case 'enter': return 0;
      case 'settle': return 0;
      case 'slide': return 0;
      case 'reveal': return 1;
      case 'exit': return 0;
      default: return 0;
    }
  };

  const getTextTransform = () => {
    switch (phase) {
      case 'enter': return 'translateY(10px)';
      case 'settle': return 'translateY(10px)';
      case 'slide': return 'translateX(20px)';
      case 'reveal': return 'translateX(0)';
      case 'exit': return 'translateX(-10px)';
      default: return 'translateX(0)';
    }
  };

  const getContainerOpacity = () => {
    switch (phase) {
      case 'exit': return 0;
      default: return 1;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center"
      style={{
        opacity: getContainerOpacity(),
        transition: phase === 'exit' ? 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'auto',
      }}
    >
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow effect behind logo */}
      <div 
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          transform: getLogoTransform(),
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Logo */}
      <div
        className="absolute"
        style={{
          transform: getLogoTransform(),
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          left: '50%',
          top: '50%',
        }}
      >
        <div className="relative">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 48 48" 
            fill="none" 
            className={phase === 'enter' ? 'animate-pulse-once' : ''}
          >
            <rect x="4" y="4" width="40" height="40" rx="10" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2"/>
            <path d="M16 18L10 24L16 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M32 18L38 24L32 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 32L26 16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          </svg>

          {/* Shine effect */}
          <div 
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              background: phase === 'settle' || phase === 'slide' || phase === 'reveal' 
                ? 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)'
                : 'transparent',
              backgroundSize: '200% 100%',
              animation: phase === 'settle' ? 'shine 1s ease-out forwards' : 'none',
            }}
          />
        </div>
      </div>

      {/* Text container */}
      <div
        className="absolute flex flex-col"
        style={{
          opacity: getTextOpacity(),
          transform: getTextTransform(),
          transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          left: '50%',
          top: '50%',
          marginLeft: '-40px',
          marginTop: '-20px',
        }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight whitespace-nowrap">
          SyncLab
        </h1>
        <p 
          className="text-sm text-emerald-400/80 font-medium tracking-wide mt-0.5"
          style={{
            opacity: phase === 'reveal' ? 1 : 0,
            transform: phase === 'reveal' ? 'translateY(0)' : 'translateY(5px)',
            transition: 'opacity 0.4s ease-out 0.2s, transform 0.4s ease-out 0.2s',
          }}
        >
          Real-time collaborative coding
        </p>
      </div>

      {/* Loading bar at bottom */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48">
        <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full"
            style={{
              width: phase === 'enter' ? '0%' : phase === 'settle' ? '30%' : phase === 'slide' ? '60%' : phase === 'reveal' ? '100%' : '100%',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2 font-mono">
          {phase === 'enter' ? 'Initializing...' : phase === 'settle' ? 'Loading workspace...' : phase === 'slide' ? 'Syncing...' : phase === 'reveal' ? 'Ready' : ''}
        </p>
      </div>
    </div>
  );
}

export default LoadingScreen;

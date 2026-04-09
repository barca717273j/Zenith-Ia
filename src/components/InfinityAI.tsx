import React from 'react';
import { motion } from 'motion/react';

interface InfinityAIProps {
  isResponding?: boolean;
}

export const InfinityAI: React.FC<InfinityAIProps> = ({ isResponding = false }) => {
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* Dynamic Background Aura */}
      <motion.div
        animate={{
          scale: isResponding ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isResponding ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-48 h-48 bg-zenit-accent/30 blur-[80px] rounded-full"
      />

      {/* Glass Morphism Ring */}
      <div className="absolute inset-0 rounded-full border border-white/5 bg-white/5 backdrop-blur-[2px] shadow-inner" />

      {/* Premium Infinity Path */}
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full relative z-10 drop-shadow-[0_0_20px_var(--accent-glow)]"
      >
        <defs>
          <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-color)" />
            <stop offset="50%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="var(--accent-color)" />
          </linearGradient>
          <filter id="inf-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shadow Path */}
        <path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="black"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.1"
          className="translate-y-2 blur-md"
        />

        {/* Outer Glow Path */}
        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#inf-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.2"
          filter="url(#inf-glow)"
          animate={{
            opacity: isResponding ? [0.2, 0.5, 0.2] : [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Main Path */}
        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#inf-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />

        {/* Traveling Light Pulse */}
        <motion.circle
          r="3"
          fill="white"
          animate={{
            offsetDistance: ["0%", "100%"],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{
            offsetPath: "path('M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50')",
            filter: 'drop-shadow(0 0 12px #fff)'
          }}
        />
      </svg>

      {/* Floating Energy Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -60, 0],
              x: [0, (Math.random() - 0.5) * 40, 0],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-zenit-accent rounded-full blur-[0.5px] shadow-[0_0_10px_var(--accent-glow)]"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

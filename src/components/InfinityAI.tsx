import React from 'react';
import { motion } from 'motion/react';

interface InfinityAIProps {
  isResponding?: boolean;
}

export const InfinityAI: React.FC<InfinityAIProps> = ({ isResponding = false }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Central Core Glow */}
      <motion.div
        animate={{
          scale: isResponding ? [1, 1.4, 1] : [1, 1.2, 1],
          opacity: isResponding ? [0.6, 0.9, 0.6] : [0.4, 0.5, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 bg-zenith-scarlet/20 blur-[60px] rounded-full"
      />

      {/* Modern Infinity Path */}
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full relative z-10"
      >
        <defs>
          <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2400" />
            <stop offset="50%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#ff2400" />
          </linearGradient>
          <filter id="inf-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Glow Path */}
        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#inf-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#inf-glow)"
          animate={{
            opacity: isResponding ? [0.3, 0.6, 0.3] : [0.15, 0.3, 0.15],
            scale: isResponding ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main Path */}
        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#inf-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {/* Traveling Light Pulse */}
        <motion.circle
          r="2.5"
          fill="white"
          animate={{
            offsetDistance: ["0%", "100%"],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          style={{
            offsetPath: "path('M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50')",
            filter: 'drop-shadow(0 0 10px #fff)'
          }}
        />
      </svg>

      {/* Floating Energy Particles (Stars) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              x: [0, (Math.random() - 0.5) * 20, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-zenith-scarlet rounded-full blur-[0.5px] shadow-[0_0_8px_rgba(255,36,0,0.8)]"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${15 + Math.random() * 70}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

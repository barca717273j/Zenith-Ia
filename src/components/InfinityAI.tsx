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
          scale: isResponding ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isResponding ? [0.5, 0.8, 0.5] : [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 bg-zenith-electric-blue/20 blur-[60px] rounded-full"
      />

      {/* Modern Infinity Path */}
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full relative z-10"
      >
        <defs>
          <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
          <filter id="inf-glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

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
          transition={{ duration: 2, repeat: Infinity }}
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
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Traveling Light Pulse */}
        <motion.circle
          r="2"
          fill="white"
          animate={{
            offsetDistance: ["0%", "100%"],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{
            offsetPath: "path('M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50')",
            filter: 'drop-shadow(0 0 8px #fff)'
          }}
        />
      </svg>

      {/* Floating Energy Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 bg-zenith-cyan rounded-full blur-[1px]"
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

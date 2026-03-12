import React from 'react';
import { motion } from 'framer-motion';

interface InfinityAIProps {
  isResponding?: boolean;
}

export const InfinityAI: React.FC<InfinityAIProps> = ({ isResponding = false }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">

      {/* Glow */}
      <motion.div
        animate={{
          scale: isResponding ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isResponding ? [0.5, 0.8, 0.5] : [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-32 h-32 bg-zenith-electric-blue/20 blur-[60px] rounded-full"
      />

      <svg viewBox="0 0 200 100" className="w-full h-full relative z-10">

        <defs>
          <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2400" />
            <stop offset="50%" stopColor="#8b0000" />
            <stop offset="100%" stopColor="#ff2400" />
          </linearGradient>
        </defs>

        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#inf-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2 }}
        />

      </svg>

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute w-1 h-1 bg-zenith-cyan rounded-full"
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

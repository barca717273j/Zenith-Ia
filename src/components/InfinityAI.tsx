import React from 'react';
import { motion } from 'motion/react';

interface InfinityAIProps {
  isResponding?: boolean;
}

export const InfinityAI: React.FC<InfinityAIProps> = ({ isResponding = false }) => {
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* Deep Core Glow - Multi-layered Blue */}
      <motion.div
        animate={{
          scale: isResponding ? [1, 1.4, 1] : [1, 1.1, 1],
          opacity: isResponding ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-zenith-electric-blue/30 blur-[80px] rounded-full"
      />
      <motion.div
        animate={{
          scale: isResponding ? [1.3, 1, 1.3] : [1.1, 1, 1.1],
          opacity: isResponding ? [0.3, 0.6, 0.3] : [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-zenith-cyan/30 blur-[60px] rounded-full"
      />

      {/* Rotating Energy Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 border border-zenith-electric-blue/10 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-10 border border-zenith-cyan/10 rounded-full border-dashed"
      />

      {/* Floating Digital Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-zenith-neon-blue rounded-full blur-[0.5px]"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 200 100"
        className="w-full h-full relative z-10 drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]"
      >
        <defs>
          <linearGradient id="infinity-gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
          <filter id="glow-heavy-blue">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Shadow Path for depth */}
        <path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="black"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.5"
          transform="translate(4, 6)"
        />

        {/* Main Neon Path - Thicker Base */}
        <motion.path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="url(#infinity-gradient-blue)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#glow-heavy-blue)"
          animate={{
            strokeWidth: isResponding ? [12, 16, 12] : [12, 13, 12],
            opacity: isResponding ? [0.9, 1, 0.9] : 0.95,
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner Core Path - Thin Bright */}
        <path
          d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Orbiting Energy Pulse */}
        <motion.circle
          r="5"
          fill="white"
          filter="url(#glow-heavy-blue)"
          animate={{
            offsetDistance: ["0%", "100%"],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            offsetPath: "path('M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50')",
          }}
        />
        
        {isResponding && (
          <motion.circle
            r="4"
            fill="#00F0FF"
            animate={{
              offsetDistance: ["100%", "0%"],
              scale: [1, 1.8, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              offsetPath: "path('M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50')",
            }}
          />
        )}
      </svg>
    </div>
  );
};

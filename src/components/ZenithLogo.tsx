import React from 'react';
import { motion } from 'motion/react';

interface ZenithLogoProps {
  size?: number;
  className?: string;
}

export const ZenithLogo: React.FC<ZenithLogoProps> = ({ size = 40, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="zenith-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#0066ff" />
          </linearGradient>
          <filter id="zenith-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Outer Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#zenith-grad)"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.2"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Central Geometric Symbol */}
        <motion.path
          d="M 50 20 L 80 50 L 50 80 L 20 50 Z"
          stroke="url(#zenith-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#zenith-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Inner Core */}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="url(#zenith-grad)"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
            filter: ["blur(4px)", "blur(8px)", "blur(4px)"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbiting Particles */}
        {[0, 120, 240].map((angle, i) => (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r="2"
            fill="white"
            animate={{
              x: [Math.cos(angle * Math.PI / 180) * 30, Math.cos((angle + 360) * Math.PI / 180) * 30],
              y: [Math.sin(angle * Math.PI / 180) * 30, Math.sin((angle + 360) * Math.PI / 180) * 30],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

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
      animate={{ 
        opacity: 1, 
        scale: 1,
      }}
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
          <linearGradient id="z-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="z-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Animated Light Path */}
        <motion.path
          d="M 25 25 L 75 25 L 25 75 L 75 75"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "easeInOut" 
          }}
          filter="url(#z-glow)"
        />

        {/* Main Z Body */}
        <motion.path
          d="M 25 25 L 75 25 L 25 75 L 75 75"
          stroke="url(#z-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            filter: ["drop-shadow(0 0 2px #3B82F6)", "drop-shadow(0 0 12px #3B82F6)", "drop-shadow(0 0 2px #3B82F6)"],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </motion.div>
  );
};

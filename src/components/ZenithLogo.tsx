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
            <stop offset="0%" stopColor="#8b0000" />
            <stop offset="100%" stopColor="#ff2400" />
          </linearGradient>
          <filter id="zenith-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Modern Z Logo */}
        <motion.path
          d="M 30 30 L 70 30 L 30 70 L 70 70"
          stroke="url(#zenith-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#zenith-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            filter: ["drop-shadow(0 0 2px #ff2400)", "drop-shadow(0 0 8px #ff2400)", "drop-shadow(0 0 2px #ff2400)"]
          }}
          transition={{ 
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.5 },
            filter: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </svg>
    </motion.div>
  );
};

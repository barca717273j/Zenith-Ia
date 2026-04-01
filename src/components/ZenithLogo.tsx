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
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="100%" stopColor="#8b0000" />
          </linearGradient>
          <filter id="zenith-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Personalized Stylized Z Logo */}
        <motion.path
          d="M 25 25 L 75 25 L 25 75 L 75 75"
          stroke="url(#zenith-grad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#zenith-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            filter: ["drop-shadow(0 0 4px #ff0000)", "drop-shadow(0 0 20px #ff0000)", "drop-shadow(0 0 4px #ff0000)"]
          }}
          transition={{ 
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.5 },
            filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.path
          d="M 40 40 L 60 40 L 40 60 L 60 60"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.circle
          cx="25"
          cy="25"
          r="4"
          fill="#ff2400"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ delay: 1.5, duration: 0.5 }}
        />
        <motion.circle
          cx="75"
          cy="75"
          r="4"
          fill="#8b0000"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ delay: 1.8, duration: 0.5 }}
        />
      </svg>
    </motion.div>
  );
};

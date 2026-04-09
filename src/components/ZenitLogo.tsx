import React from 'react';
import { motion } from 'motion/react';

interface ZenitLogoProps {
  size?: number;
  className?: string;
}

export const ZenitLogo: React.FC<ZenitLogoProps> = ({ size = 40, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`relative flex items-center justify-center bg-white rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[70%] h-[70%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="zenit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="100%" stopColor="#cc0000" />
          </linearGradient>
        </defs>
        
        {/* Simple Stylized "Z" */}
        <motion.path
          d="M 25 30 L 75 30 L 25 70 L 75 70"
          stroke="url(#zenit-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
          }}
          transition={{ 
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.5 },
          }}
        />
      </svg>
    </motion.div>
  );
};

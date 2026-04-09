import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

interface CustomSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({ min, max, value, onChange, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    updateValue(e);
  };

  const updateValue = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newValue = Math.round(min + newPercentage * (max - min));
    onChange(newValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updateValue(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) updateValue(e);
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="space-y-4 w-full select-none">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{label}</label>
          <span className="text-[10px] font-bold text-zenit-accent">{value}%</span>
        </div>
      )}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className="relative h-8 flex items-center cursor-pointer group"
      >
        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-zenit-surface-2 rounded-full overflow-hidden shadow-inner">
          {/* Active Trail (Red) */}
          <motion.div 
            className="h-full bg-zenit-accent shadow-[0_0_15px_rgba(255,36,0,0.4)]"
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          />
        </div>

        {/* Handle */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          initial={false}
          animate={{ 
            left: `${percentage}%`,
            scale: isDragging ? 1.4 : 1
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] border-2 border-zenit-accent flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 bg-zenit-accent rounded-full" />
            
            {/* Ripple effect on drag */}
            {isDragging && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-zenit-accent rounded-full"
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

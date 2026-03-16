import React from 'react';
import { motion } from 'motion/react';
import { Heart, Zap, Moon, Smile } from 'lucide-react';
import { MascoteState } from '../types';

interface MascoteBlockProps {
  state: MascoteState;
  energyLevel?: number;
  t: any;
}

export const MascoteBlock: React.FC<MascoteBlockProps> = ({ state, energyLevel = 75, t }) => {
  const getIcon = () => {
    switch (state) {
      case 'sleeping': return <Moon className="text-blue-400" size={40} />;
      case 'energized': return <Zap className="text-yellow-400" size={40} />;
      case 'happy': return <Smile className="text-emerald-400" size={40} />;
      case 'tired': return <Heart className="text-zenith-scarlet" size={40} />;
      default: return <Smile className="text-white" size={40} />;
    }
  };

  const getLabel = () => {
    return t.mascote[state] || state;
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4 border-white/5 bg-white/[0.01] relative overflow-hidden group">
      <div className="flex items-center space-x-2 absolute top-4 left-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">Neural Link Active</span>
      </div>
      
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          scale: state === 'energized' ? [1, 1.1, 1] : 1
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative z-10">
          {getIcon()}
        </div>
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-zenith-electric-blue blur-3xl -z-10"
        />
      </motion.div>

      <div className="text-center space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{t.mascote.title}</h4>
        <p className="text-xl font-display font-bold text-white uppercase tracking-tight">{getLabel()}</p>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${energyLevel}%` }}
          className="h-full bg-zenith-electric-blue shadow-[0_0_10px_rgba(0,112,243,0.5)]"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-zenith-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};

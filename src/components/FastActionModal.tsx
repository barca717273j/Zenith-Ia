import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Image as ImageIcon, ClipboardList, Sparkles, MessageSquare, Target } from 'lucide-react';

interface FastActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProtocol: () => void;
  onCreatePost: () => void;
}

export const FastActionModal: React.FC<FastActionModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateProtocol, 
  onCreatePost 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm"
          >
            <div className="bg-zenit-surface-1 border border-zenit-border-primary rounded-[3rem] p-8 space-y-8 overflow-hidden relative shadow-2xl">
              {/* Background Glows */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-zenit-accent/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-white italic leading-none">Ação <span className="text-zenit-accent">Rápida</span></h3>
                  <p className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] mt-1">Expansão de Sistema</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                <ActionButton 
                  icon={<ClipboardList size={24} />} 
                  label="Novo Protocolo" 
                  description="Agende uma rotina de alta performance"
                  onClick={() => { onCreateProtocol(); onClose(); }}
                  color="bg-zenit-accent"
                />
                <ActionButton 
                  icon={<MessageSquare size={24} />} 
                  label="Nova Transmissão" 
                  description="Compartilhe seu progresso no Nexus"
                  onClick={() => { onCreatePost(); onClose(); }}
                  color="bg-zenit-surface-2"
                />
              </div>

              <div className="pt-4 flex flex-col items-center space-y-2 opacity-20">
                <div className="w-8 h-[1px] bg-white/40" />
                <p className="text-[7px] font-black uppercase tracking-[0.5em] text-white">Zenith Human OS</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, description, onClick, color }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full p-6 h-32 rounded-[2.5rem] flex flex-col items-start justify-between transition-all relative overflow-hidden group ${
      color === 'bg-zenit-accent' 
        ? 'bg-zenit-accent text-white shadow-xl shadow-zenit-accent/30' 
        : 'bg-zenit-surface-2 text-zenit-text-primary border border-zenit-border-primary hover:bg-zenit-surface-1 shadow-md'
    }`}
  >
    <div className={`p-3 rounded-2xl transition-all duration-500 ${
      color === 'bg-zenit-accent' 
        ? 'bg-white/10 group-hover:bg-white/20' 
        : 'bg-zenit-accent/10 text-zenit-accent group-hover:bg-zenit-accent group-hover:text-white'
    }`}>
      {icon}
    </div>
    
    <div className="text-left space-y-1">
      <p className="font-display font-black uppercase tracking-tight italic leading-none">{label}</p>
      <p className={`text-[8px] font-bold uppercase tracking-widest opacity-60`}>{description}</p>
    </div>
  </motion.button>
);

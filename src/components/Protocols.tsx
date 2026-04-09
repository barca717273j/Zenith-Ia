import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Target, Activity, Plus, Trash2, CheckCircle2, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { NewProtocolModal } from './NewProtocolModal';

export const Protocols: React.FC<{ t: any }> = ({ t }) => {
  const { userData, refreshUserData } = useUser();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProtocols = async () => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProtocols(data || []);
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, [userData?.id]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchProtocols();
      refreshUserData();
    } catch (err) {
      console.error('Error deleting protocol:', err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('protocols')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchProtocols();
    } catch (err) {
      console.error('Error toggling protocol status:', err);
    }
  };

  return (
    <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
          <h1 className="text-3xl font-display font-bold uppercase tracking-tighter italic">
            <span className="text-zenit-accent">Protocolos Neurais</span>
          </h1>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary">Defina sua próxima diretriz</p>
      </header>

      <div className="grid gap-6">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="w-full p-8 rounded-[2rem] border-2 border-dashed border-zenit-border-primary hover:border-zenit-accent/40 hover:bg-zenit-accent/5 transition-all group flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-zenit-surface-1 flex items-center justify-center text-zenit-text-tertiary group-hover:text-zenit-accent transition-colors border border-zenit-border-primary group-hover:border-zenit-accent/30 shadow-inner">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-zenit-text-secondary group-hover:text-zenit-text-primary">Iniciar Novo Protocolo</p>
            <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-widest mt-1">Defina seus parâmetros de evolução</p>
          </div>
        </motion.button>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-zenit-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_var(--accent-glow)]" />
          </div>
        ) : protocols.length > 0 ? (
          protocols.map((protocol) => (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-8 bg-zenit-surface-1 border-zenit-border-primary relative group overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${protocol.status === 'active' ? 'bg-zenit-accent shadow-[0_0_15px_var(--accent-glow)]' : 'bg-zenit-text-tertiary/20'}`} />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl border ${protocol.status === 'active' ? 'bg-zenit-accent/10 border-zenit-accent/20 text-zenit-accent' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zenit-text-primary tracking-tight uppercase italic">{protocol.title}</h3>
                      <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-widest">{protocol.category || 'Geral'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-zenit-text-tertiary uppercase tracking-widest">Intensidade</p>
                      <div className="flex space-x-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`w-3 h-1 rounded-full ${i <= (protocol.intensity || 1) ? 'bg-zenit-accent shadow-[0_0_5px_var(--accent-glow)]' : 'bg-zenit-surface-2'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-zenit-text-tertiary uppercase tracking-widest">Progresso</p>
                      <p className="text-xs font-bold text-zenit-text-secondary">{protocol.progress || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleStatus(protocol.id, protocol.status)}
                    className={`p-3 rounded-xl border transition-all ${protocol.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-text-primary'}`}
                  >
                    {protocol.status === 'active' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(protocol.id)}
                    className="p-3 rounded-xl border border-zenit-border-primary bg-zenit-surface-2 text-zenit-text-tertiary hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zenit-border-primary flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles size={12} className="text-zenit-accent" />
                  <span className="text-[9px] font-bold text-zenit-text-tertiary uppercase tracking-widest">Sincronizado com Zenit Core</span>
                </div>
                <ChevronRight size={14} className="text-zenit-text-tertiary group-hover:text-zenit-accent transition-colors" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 space-y-4 opacity-20">
            <Shield size={48} className="mx-auto" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Nenhum protocolo ativo no sistema</p>
          </div>
        )}
      </div>

      <NewProtocolModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchProtocols();
        }} 
        t={t} 
      />
    </div>
  );
};

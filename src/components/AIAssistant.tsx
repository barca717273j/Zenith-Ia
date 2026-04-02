import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Sparkles, Zap, Brain, Terminal, TrendingUp, Target, Lock } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { TIER_LIMITS } from '../types';
import { supabase } from '../lib/supabase';

import { useUser } from '../contexts/UserContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, t }) => {
  const { userData, refreshUserData, checkLimit, incrementUsage } = useUser();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Saudações. Sou o Infinity Core. Como posso otimizar sua jornada rumo ao ápice hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tier = userData?.subscription_tier || 'basic';
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  const messagesLeft = limits.aiMessagesPerDay - (userData?.ai_messages_count || 0);
  const isLimitReached = messagesLeft <= 0;

  useEffect(() => {
    const checkAndResetLimits = async () => {
      if (!userData) return;
      
      const lastDate = userData.last_message_date ? new Date(userData.last_message_date) : null;
      const today = new Date();
      
      if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
        await supabase
          .from('users')
          .update({ ai_messages_count: 0 })
          .eq('id', userData.id);
        await refreshUserData();
      }
    };

    if (isOpen) {
      checkAndResetLimits();
    }
  }, [isOpen, userData, refreshUserData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check limits
    const limitCheck = await checkLimit('ai_messages');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Increment usage
      await incrementUsage('ai_messages');

      const response = await generateLifeStrategy(userData, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Estou processando as melhores estratégias para você..." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Conexão com o núcleo central instável. Tente novamente em breve." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { label: 'Criar rotina', icon: <Zap size={14} /> },
    { label: 'Analisar produtividade', icon: <TrendingUp size={14} /> },
    { label: 'Sugerir metas', icon: <Target size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[100] bg-zenith-black flex flex-col transition-colors duration-500"
        >
          {/* Header */}
          <header className="p-6 border-b border-zenith-border-primary flex justify-between items-center bg-zenith-surface-1/95 backdrop-blur-3xl relative z-20 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-zenith-accent to-transparent opacity-80 shadow-[0_0_15px_var(--accent-glow)]" />
            
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl bg-zenith-surface-2 border border-zenith-border-primary flex items-center justify-center text-zenith-accent shadow-xl shadow-zenith-accent/10 relative z-10 group-hover:border-zenith-accent/50 transition-all duration-500">
                  <Brain size={28} className="drop-shadow-[0_0_8px_var(--accent-glow)]" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-zenith-accent blur-2xl -z-10"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tighter uppercase text-zenith-text-primary italic">Infinity Core <span className="text-zenith-accent">v2.0</span></h2>
                <div className="flex items-center space-x-2.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-zenith-accent animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
                  <span className="text-[9px] text-zenith-text-tertiary font-black uppercase tracking-[0.25em]">Sincronização Neural Ativa</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-5">
              <div className="text-right hidden sm:block">
                <div className="text-[9px] text-zenith-text-tertiary font-black uppercase tracking-widest opacity-60">Mensagens Restantes</div>
                <div className="text-sm font-black text-zenith-accent drop-shadow-[0_0_5px_var(--accent-glow)]">{messagesLeft}</div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center bg-zenith-surface-2 rounded-2xl border border-zenith-border-primary hover:bg-zenith-surface-3 hover:border-zenith-accent/30 transition-all shadow-lg"
              >
                <X size={24} className="text-zenith-text-tertiary" />
              </motion.button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide bg-zenith-black relative">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,59,59,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,59,59,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
              >
                <div className={`max-w-[85%] flex space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-tertiary' 
                      : 'bg-zenith-accent/10 border-zenith-accent/20 text-zenith-accent'
                  }`}>
                    {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} className="drop-shadow-[0_0_5px_var(--accent-glow)]" />}
                  </div>
                  <div className={`p-5 rounded-3xl text-sm leading-relaxed font-medium shadow-2xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-zenith-accent to-zenith-crimson text-white rounded-tr-none border border-white/10' 
                      : 'bg-zenith-surface-1 text-zenith-text-primary rounded-tl-none border border-zenith-border-primary'
                  }`}>
                    <div className="max-w-none prose prose-invert prose-sm prose-p:leading-relaxed prose-strong:text-zenith-accent">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start relative z-10">
                <div className="bg-zenith-surface-1 p-5 rounded-3xl rounded-tl-none border border-zenith-border-primary flex space-x-2.5 shadow-xl">
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 bg-zenith-accent rounded-full shadow-[0_0_8px_var(--accent-glow)]" />
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2.5 h-2.5 bg-zenith-accent rounded-full shadow-[0_0_8px_var(--accent-glow)]" />
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2.5 h-2.5 bg-zenith-accent rounded-full shadow-[0_0_8px_var(--accent-glow)]" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-6 border-t border-zenith-border-primary bg-zenith-surface-1/95 backdrop-blur-3xl space-y-5 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            {/* Suggestions */}
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.label); handleSend(); }}
                  disabled={isLimitReached}
                  className="flex-shrink-0 flex items-center space-x-2.5 bg-zenith-surface-2 border border-zenith-border-primary px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-zenith-text-tertiary hover:bg-zenith-surface-3 hover:text-zenith-accent hover:border-zenith-accent/30 transition-all disabled:opacity-50 shadow-sm"
                >
                  <span className="text-zenith-accent">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="relative flex items-center w-full group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLimitReached}
                placeholder={isLimitReached ? "LIMITE DIÁRIO ATINGIDO" : "Transmita sua consulta ao núcleo..."}
                className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl py-5 pl-7 pr-20 focus:outline-none focus:border-zenith-accent/50 transition-all font-medium text-zenith-text-primary placeholder:text-zenith-text-tertiary disabled:opacity-50 shadow-inner"
              />
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isLimitReached}
                className="absolute right-3 p-4 bg-zenith-accent text-white rounded-xl shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50 disabled:shadow-none hover:brightness-110 transition-all"
              >
                {isLimitReached ? <Lock size={20} /> : <Send size={20} />}
              </motion.button>
            </div>
            {isLimitReached && (
              <div className="text-center">
                <button 
                  onClick={() => {/* Trigger upgrade modal */}}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-zenith-accent hover:text-white transition-colors duration-300 flex items-center justify-center space-x-2 mx-auto"
                >
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Desbloquear Potencial Ilimitado</span>
                </button>
              </div>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

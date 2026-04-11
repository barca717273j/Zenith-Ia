import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Sparkles, Zap, Terminal, TrendingUp, Target, Lock } from 'lucide-react';
import { ZenitLogo } from './ZenitLogo';
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
    { role: 'assistant', content: "Olá, eu sou o ZENITH. Sua interface neural para otimização humana. Como posso acelerar sua evolução hoje?" }
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
      
      try {
        const lastDate = userData.last_message_date ? new Date(userData.last_message_date) : null;
        const today = new Date();
        
        if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
          const { error } = await supabase
            .from('users')
            .update({ ai_messages_count: 0 })
            .eq('id', userData.id);
          
          if (error) throw error;
          await refreshUserData();
        }
      } catch (err) {
        console.error('Error resetting limits:', err);
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
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ **Limite Atingido:** ${limitCheck.message}` }]);
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
          className="fixed inset-0 z-[100] bg-zenit-black flex flex-col transition-colors duration-500"
        >
          {/* Header */}
          <header className="p-6 flex justify-between items-center bg-zenit-surface-1/80 backdrop-blur-xl border-b border-zenit-border-secondary relative z-20">
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 flex items-center justify-center relative z-10 transition-all duration-500 border border-zenit-border-primary group-hover:border-zenit-accent/30">
                  <ZenitLogo size={32} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-zenit-accent blur-2xl -z-10"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tighter uppercase text-zenit-text-primary italic">Infinity Core <span className="text-zenit-accent">v2.0</span></h2>
                <div className="flex items-center space-x-2.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-zenit-accent animate-pulse" />
                  <span className="text-[9px] text-zenit-text-tertiary font-black uppercase tracking-[0.25em]">Sincronização Neural Ativa</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-5">
              <div className="text-right hidden sm:block">
                <div className="text-[9px] text-zenit-text-tertiary font-black uppercase tracking-widest opacity-60">Mensagens Restantes</div>
                <div className="text-sm font-black text-zenit-accent">{messagesLeft}</div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center bg-zenit-surface-2 rounded-2xl hover:bg-zenit-surface-3 transition-all border border-zenit-border-primary"
              >
                <X size={24} className="text-zenit-text-tertiary" />
              </motion.button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide bg-zenit-black relative">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
              >
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                  <div className={`flex items-center space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg border ${
                      msg.role === 'user' 
                        ? 'bg-zenit-surface-2 text-zenit-text-tertiary border-zenit-border-primary' 
                        : 'bg-zenit-accent/10 border-zenit-accent/20 text-zenit-accent'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zenit-text-tertiary opacity-50">
                      {msg.role === 'user' ? 'Você' : 'Infinity Core'}
                    </span>
                  </div>
                  
                  <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-medium shadow-2xl transition-all ${
                    msg.role === 'user' 
                      ? 'bg-zenit-accent text-white rounded-tr-none shadow-[0_10px_30px_rgba(255,0,0,0.15)]' 
                      : 'bg-zenit-surface-1 text-zenit-text-primary rounded-tl-none border border-zenit-border-primary'
                  }`}>
                    <div className={`max-w-none prose prose-sm prose-p:leading-relaxed ${msg.role === 'user' ? 'prose-invert prose-strong:text-white' : 'prose-invert prose-strong:text-zenit-accent'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start relative z-10">
                <div className="bg-zenit-surface-1 p-6 rounded-[2rem] rounded-tl-none flex space-x-2 border border-zenit-border-primary shadow-xl">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zenit-accent rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zenit-accent rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zenit-accent rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-8 bg-zenit-surface-1/90 backdrop-blur-2xl border-t border-zenit-border-primary space-y-6 relative z-20">
            {/* Suggestions */}
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.label); handleSend(); }}
                  disabled={isLimitReached}
                  className="flex-shrink-0 flex items-center space-x-3 bg-zenit-surface-2 px-6 py-3.5 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] text-zenit-text-tertiary hover:bg-zenit-accent/10 hover:text-zenit-accent hover:border-zenit-accent/30 transition-all disabled:opacity-50 border border-zenit-border-primary shadow-sm"
                >
                  <span className="text-zenit-accent">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="relative flex items-center w-full group">
              <div className="absolute left-6 text-zenit-accent/40 group-focus-within:text-zenit-accent transition-colors">
                <Terminal size={18} />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLimitReached}
                placeholder={isLimitReached ? "LIMITE DIÁRIO ATINGIDO" : "Transmita sua consulta ao núcleo..."}
                className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] py-6 pl-16 pr-24 focus:outline-none focus:border-zenit-accent/50 transition-all font-medium text-zenit-text-primary placeholder:text-zenit-text-tertiary/20 disabled:opacity-50 shadow-inner"
              />
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isLimitReached}
                className="absolute right-3 w-14 h-14 bg-gradient-to-br from-zenit-accent to-zenit-crimson text-white rounded-2xl disabled:opacity-50 hover:brightness-110 transition-all shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center border border-white/10"
              >
                {isLimitReached ? <Lock size={20} /> : <Send size={20} />}
              </motion.button>
            </div>
            {isLimitReached && (
              <div className="text-center">
                <button 
                  onClick={() => {/* Trigger upgrade modal */}}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-zenit-accent hover:text-white transition-colors duration-300 flex items-center justify-center space-x-2 mx-auto"
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

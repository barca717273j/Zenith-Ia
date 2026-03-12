import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Sparkles, Zap, Brain, Terminal, TrendingUp, Target, Lock } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { TIER_LIMITS } from '../types';
import { supabase } from '../supabase';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  userData: any;
  onUpdate: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, t, userData, onUpdate }) => {
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
        onUpdate();
      }
    };

    if (isOpen) {
      checkAndResetLimits();
    }
  }, [isOpen, userData, onUpdate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isLimitReached) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Update message count in Supabase
      const newCount = (userData?.ai_messages_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          ai_messages_count: newCount,
          last_message_date: new Date().toISOString()
        })
        .eq('id', userData.id);
      
      if (updateError) throw updateError;
      
      onUpdate();

      const response = await generateLifeStrategy(userData, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Estou processando as melhores estratégias para você..." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Conexão com o núcleo central instável. Tente novamente em breve." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { label: 'Create routine', icon: <Zap size={14} /> },
    { label: 'Analyze productivity', icon: <TrendingUp size={14} /> },
    { label: 'Suggest goals', icon: <Target size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[100] bg-zenith-black flex flex-col"
        >
          {/* Header */}
          <header className="p-6 border-b border-white/5 flex justify-between items-center bg-zenith-black/90 backdrop-blur-3xl relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zenith-scarlet to-transparent opacity-50" />
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zenith-scarlet shadow-[0_0_20px_rgba(255,36,0,0.3)] relative z-10">
                  <Brain size={24} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-zenith-scarlet blur-xl -z-10"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl tracking-tighter uppercase text-white">AI Mentor Strategist</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zenith-scarlet animate-pulse shadow-[0_0_8px_#ff2400]" />
                  <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Neural Link Active</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Messages Left</div>
                <div className="text-xs font-bold text-zenith-scarlet">{messagesLeft}</div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <X size={20} className="text-white/40" />
              </motion.button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-white/[0.01]">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                    msg.role === 'user' 
                      ? 'bg-white/5 border-white/10 text-white/30' 
                      : 'bg-zenith-scarlet/10 border-zenith-scarlet/20 text-zenith-scarlet'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${
                    msg.role === 'user' 
                      ? 'bg-zenith-crimson text-white rounded-tr-none' 
                      : 'bg-white/[0.03] text-white/90 rounded-tl-none border border-white/5'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/[0.02] p-4 rounded-2xl rounded-tl-none border border-white/5 flex space-x-2">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-zenith-scarlet rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-zenith-scarlet rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-zenith-scarlet rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-6 border-t border-white/5 bg-zenith-black/90 backdrop-blur-3xl space-y-4">
            {/* Suggestions */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.label); handleSend(); }}
                  disabled={isLimitReached}
                  className="flex-shrink-0 flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                  {s.icon}
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
                placeholder={isLimitReached ? "Daily message limit reached" : "Ask the neural core..."}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:border-zenith-scarlet/40 transition-all font-medium text-white placeholder:text-white/20 disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isLimitReached}
                className="absolute right-2 p-3 bg-zenith-crimson text-white rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLimitReached ? <Lock size={18} /> : <Send size={18} />}
              </motion.button>
            </div>
            {isLimitReached && (
              <div className="text-center">
                <button 
                  onClick={() => {/* Trigger upgrade modal */}}
                  className="text-[10px] font-bold uppercase tracking-widest text-zenith-scarlet hover:text-zenith-neon-red transition-colors"
                >
                  Upgrade to unlock more messages
                </button>
              </div>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

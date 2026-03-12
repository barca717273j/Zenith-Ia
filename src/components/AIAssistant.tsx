import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Sparkles, Zap, Brain, TrendingUp, Target, Lock } from 'lucide-react';
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

  const tier = userData?.subscriptionTier || 'basic';
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  const messagesLeft = limits.aiMessagesPerDay - (userData?.aiMessagesCount || 0);
  const isLimitReached = messagesLeft <= 0;

  useEffect(() => {

    const checkAndResetLimits = async () => {

      if (!userData) return;

      const lastDate = userData.lastMessageDate ? new Date(userData.lastMessageDate) : null;
      const today = new Date();

      if (!lastDate || lastDate.toDateString() !== today.toDateString()) {

        await supabase
          .from('users')
          .update({ aiMessagesCount: 0 })
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

      const newCount = (userData?.aiMessagesCount || 0) + 1;

      const { error } = await supabase
        .from('users')
        .update({
          aiMessagesCount: newCount,
          lastMessageDate: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;

      onUpdate();

      const response = await generateLifeStrategy(userData, userMessage);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response || "Processando estratégia..." }
      ]);

    } catch {

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Conexão com o núcleo instável. Tente novamente." }
      ]);

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

          {/* HEADER */}

          <header className="p-6 border-b border-white/5 flex justify-between items-center">

            <div className="flex items-center space-x-4">

              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zenith-scarlet">
                <Brain size={24} />
              </div>

              <div>
                <h2 className="font-bold text-xl uppercase text-white">
                  AI Mentor
                </h2>
              </div>

            </div>

            <button onClick={onClose}>
              <X size={20} />
            </button>

          </header>

          {/* MESSAGES */}

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">

            {messages.map((msg, i) => (

              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >

                <div className="max-w-[85%]">

                  <div className="p-4 rounded-xl bg-white/[0.03] text-white">

                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>

                  </div>

                </div>

              </div>

            ))}

          </div>

          {/* INPUT */}

          <footer className="p-6 border-t border-white/5">

            <div className="relative flex items-center">

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask the neural core..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
              />

              <button
                onClick={handleSend}
                className="absolute right-2 p-2"
              >
                <Send size={18} />
              </button>

            </div>

          </footer>

        </motion.div>

      )}

    </AnimatePresence>

  );
};

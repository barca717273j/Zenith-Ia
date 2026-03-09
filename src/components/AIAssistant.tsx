import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Sparkles, Zap, Brain, Terminal } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export const AIAssistant: React.FC<{ isOpen: boolean; onClose: () => void; t: any }> = ({ isOpen, onClose, t }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Saudações. Sou o Infinity Core. Como posso otimizar sua jornada rumo ao ápice hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await generateLifeStrategy({}, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Estou processando as melhores estratégias para você..." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Conexão com o núcleo central instável. Tente novamente em breve." }]);
    } finally {
      setIsTyping(false);
    }
  };

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
          <header className="p-8 border-b border-white/5 flex justify-between items-center bg-zenith-black/90 backdrop-blur-3xl relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zenith-electric-blue to-transparent opacity-50" />
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-zenith-electric-blue shadow-[0_0_25px_rgba(59,130,246,0.3)] relative z-10">
                  <Brain size={32} />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-zenith-electric-blue blur-xl -z-10"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tighter uppercase text-white">Infinity Mentor</h2>
                <div className="flex items-center space-x-3 mt-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-zenith-electric-blue animate-pulse shadow-[0_0_10px_#3b82f6]" />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">Núcleo Ativo</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center space-x-2">
                    <Terminal size={10} className="text-zenith-cyan" />
                    <span className="text-[10px] text-zenith-cyan/60 font-bold uppercase tracking-[0.3em]">v4.0.2</span>
                  </div>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-[20px] border border-white/10 hover:bg-white/10 transition-all"
            >
              <X size={28} className="text-white/40" />
            </motion.button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide bg-white/[0.01]">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex space-x-5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-12 h-12 rounded-[18px] flex-shrink-0 flex items-center justify-center border shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-white/5 border-white/10 text-white/30' 
                      : 'bg-zenith-electric-blue/10 border-zenith-electric-blue/20 text-zenith-electric-blue'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                  </div>
                  <div className={`p-8 rounded-[32px] text-sm leading-relaxed font-medium relative overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-white/5 text-white rounded-tr-none border border-white/10' 
                      : 'bg-white/[0.02] text-white/90 rounded-tl-none border border-white/5 backdrop-blur-xl'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-zenith-electric-blue/30" />
                    )}
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-zenith-electric-blue prose-headings:text-white prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/[0.02] p-6 rounded-[24px] rounded-tl-none border border-white/5 flex space-x-2.5 backdrop-blur-xl">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 bg-zenith-electric-blue rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2.5 h-2.5 bg-zenith-electric-blue rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2.5 h-2.5 bg-zenith-electric-blue rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <footer className="p-10 border-t border-white/5 bg-zenith-black/90 backdrop-blur-3xl">
            <div className="relative flex items-center max-w-3xl mx-auto w-full group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte ao núcleo neural..."
                className="w-full bg-white/5 border border-white/10 rounded-[28px] py-6 pl-10 pr-24 focus:outline-none focus:border-zenith-electric-blue/40 focus:bg-white/[0.07] transition-all font-medium text-white placeholder:text-white/20"
              />
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 p-5 bg-zenith-electric-blue text-white rounded-[22px] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center"
              >
                <Send size={24} />
              </motion.button>
            </div>
          </footer>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

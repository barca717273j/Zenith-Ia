import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book, Send, Sparkles, Calendar } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';

import { AnimatePresence } from 'motion/react';

interface JournalProps {
  userData: any;
  t: any;
}

export const Journal: React.FC<JournalProps> = ({ userData, t }) => {
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await generateLifeStrategy({ context: 'journal' }, `Analyze this journal entry and provide constructive feedback for growth: ${entry}`);
      setFeedback(response || t.journal.aiReflecting);
    } catch (error) {
      setFeedback(t.journal.connectionLost);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-display tracking-tight">{t.journal.title}</h1>
        <div className="flex items-center space-x-2 text-white/40 text-xs">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString(userData?.language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      <div className="space-y-4">
        <div className="glass-card p-4 min-h-[200px] flex flex-col">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder={t.journal.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm leading-relaxed resize-none placeholder:text-white/20"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAnalyze}
              disabled={!entry.trim() || isAnalyzing}
              className="flex items-center space-x-2 bg-zenith-electric-blue text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Sparkles size={18} />
                </motion.div>
              ) : (
                <Sparkles size={18} />
              )}
              <span>{t.journal.analyze}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border-zenith-electric-blue/20 bg-zenith-electric-blue/5"
            >
              <div className="flex items-center space-x-2 text-zenith-electric-blue mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-display font-bold uppercase tracking-widest">{t.journal.insight}</span>
              </div>
              <p className="text-sm text-white/80 italic leading-relaxed">
                "{feedback}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-display font-medium text-white/60 uppercase tracking-widest">{t.journal.pastReflections}</h3>
        <div className="space-y-3">
          <PastEntry date="Mar 5" preview="Today I felt very productive after the morning routine..." />
          <PastEntry date="Mar 4" preview="Thinking about the new project goals and how to align..." />
        </div>
      </section>
    </div>
  );
};

const PastEntry: React.FC<{ date: string; preview: string }> = ({ date, preview }) => (
  <div className="glass-card p-4 flex items-center space-x-4">
    <div className="text-center min-w-[40px]">
      <p className="text-xs font-bold text-zenith-electric-blue">{date}</p>
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-xs text-white/40 truncate">{preview}</p>
    </div>
    <Book size={14} className="text-white/20" />
  </div>
);

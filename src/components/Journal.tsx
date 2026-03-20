import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book, Send, Sparkles, Calendar } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';
import { supabase } from '../supabase';
import { AnimatePresence } from 'motion/react';

import { useUser } from '../contexts/UserContext';

interface JournalProps {
  t: any;
}

export const Journal: React.FC<JournalProps> = ({ t }) => {
  const { userData, checkLimit, incrementUsage } = useUser();
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pastEntries, setPastEntries] = useState<any[]>([]);

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
    setPastEntries(data || []);
  };

  React.useEffect(() => {
    fetchEntries();
  }, []);

  const handleSave = async () => {
    if (!entry.trim()) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('journal_entries').insert({
        user_id: user.id,
        content: entry,
        ai_feedback: feedback
      });

      setEntry('');
      setFeedback('');
      fetchEntries();
    } catch (error) {
      console.error('Error saving journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!entry.trim()) return;

    const limitCheck = await checkLimit('ai_messages');
    if (!limitCheck.allowed) {
      alert(limitCheck.message || 'Limite de mensagens de IA atingido.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await generateLifeStrategy({ context: 'journal' }, `Analyze this journal entry and provide constructive feedback for growth: ${entry}`);
      setFeedback(response || t.journal.aiReflecting);
      await incrementUsage('ai_messages');
    } catch (error) {
      setFeedback(t.journal.connectionLost);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-display tracking-tight uppercase">{t.journal.title}</h1>
        <div className="flex items-center space-x-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString(userData?.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      <div className="space-y-4">
        <div className="glass-card p-6 min-h-[250px] flex flex-col border-white/5 bg-white/[0.01]">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder={t.journal.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm leading-relaxed resize-none placeholder:text-white/20"
          />
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={!entry.trim() || isAnalyzing}
              className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Sparkles size={14} />
                </motion.div>
              ) : (
                <Sparkles size={14} />
              )}
              <span>{t.journal.analyze}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!entry.trim() || isSaving}
              className="flex items-center space-x-2 bg-zenith-electric-blue text-white px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,112,243,0.3)] hover:shadow-[0_0_30px_rgba(0,112,243,0.5)] transition-all disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 border-zenith-electric-blue/20 bg-zenith-electric-blue/5"
            >
              <div className="flex items-center space-x-2 text-zenith-electric-blue mb-3">
                <Sparkles size={16} />
                <span className="text-[10px] font-display font-bold uppercase tracking-widest">{t.journal.insight}</span>
              </div>
              <p className="text-sm text-white/80 italic leading-relaxed">
                "{feedback}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-display font-bold text-white/60 uppercase tracking-widest">{t.journal.pastReflections}</h3>
        <div className="space-y-3">
          {pastEntries.length > 0 ? (
            pastEntries.map((entry) => (
              <PastEntry 
                key={entry.id} 
                date={new Date(entry.created_at).toLocaleDateString(userData?.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })} 
                preview={entry.content} 
              />
            ))
          ) : (
            <p className="text-xs text-white/20 italic">Nenhuma reflexão anterior encontrada.</p>
          )}
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

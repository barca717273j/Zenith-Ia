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
  const [mood, setMood] = useState('neutral');
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pastEntries, setPastEntries] = useState<any[]>([]);

  const moods = [
    { id: 'happy', icon: '😊', label: 'Feliz', color: 'bg-green-500/20 text-green-400' },
    { id: 'neutral', icon: '😐', label: 'Neutro', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'sad', icon: '😔', label: 'Triste', color: 'bg-yellow-500/20 text-yellow-400' },
    { id: 'anxious', icon: '😰', label: 'Ansioso', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'angry', icon: '😤', label: 'Irritado', color: 'bg-red-500/20 text-red-400' },
  ];

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
        ai_feedback: feedback,
        mood: mood
      });

      setEntry('');
      setFeedback('');
      setMood('neutral');
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
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-display tracking-tighter uppercase italic text-white leading-none">{t.journal.title}</h1>
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30">Neural Reflection Log</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <Calendar size={14} className="text-zenith-electric-blue" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            {new Date().toLocaleDateString(userData?.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {/* Mood Selector */}
        <div className="flex justify-between items-center p-2 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 ${mood === m.id ? `${m.color} shadow-lg scale-105` : 'text-white/20 hover:text-white/40'}`}
            >
              <span className="text-xl mb-1">{m.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-card p-8 min-h-[300px] flex flex-col border-white/5 bg-white/[0.02] relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-zenith-electric-blue/30 group-focus-within:bg-zenith-electric-blue transition-colors" />
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder={t.journal.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base leading-relaxed resize-none placeholder:text-white/10 text-white/80 font-medium"
          />
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-zenith-electric-blue animate-pulse" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Neural Link Active</span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAnalyze}
                disabled={!entry.trim() || isAnalyzing}
                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all disabled:opacity-50 border border-white/5"
              >
                {isAnalyzing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Sparkles size={14} className="text-zenith-electric-blue" />
                  </motion.div>
                ) : (
                  <Sparkles size={14} className="text-zenith-electric-blue" />
                )}
                <span>{t.journal.analyze}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!entry.trim() || isSaving}
                className="flex items-center space-x-2 bg-zenith-electric-blue text-white px-8 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,112,243,0.3)] hover:shadow-[0_15px_40px_rgba(0,112,243,0.5)] transition-all disabled:opacity-50 active:scale-95"
              >
                <Send size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-8 border-zenith-electric-blue/20 bg-zenith-electric-blue/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-zenith-electric-blue" />
              </div>
              <div className="flex items-center space-x-3 text-zenith-electric-blue mb-4">
                <div className="w-8 h-8 rounded-xl bg-zenith-electric-blue/20 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-display font-bold uppercase tracking-[0.3em]">{t.journal.insight}</span>
              </div>
              <p className="text-base text-white/90 italic leading-relaxed font-serif">
                "{feedback}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-display font-bold text-white/60 uppercase tracking-[0.4em]">{t.journal.pastReflections}</h3>
          <div className="h-[1px] flex-1 bg-white/5 mx-4" />
        </div>
        <div className="grid gap-4">
          {pastEntries.length > 0 ? (
            pastEntries.map((entry) => (
              <PastEntry 
                key={entry.id} 
                date={new Date(entry.created_at).toLocaleDateString(userData?.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })} 
                preview={entry.content}
                mood={entry.mood}
              />
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
              <Book size={32} className="mx-auto mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma reflexão anterior</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const PastEntry: React.FC<{ date: string; preview: string; mood?: string }> = ({ date, preview, mood }) => {
  const moodIcon = mood === 'happy' ? '😊' : mood === 'sad' ? '😔' : mood === 'anxious' ? '😰' : mood === 'angry' ? '😤' : '😐';
  
  return (
    <motion.div 
      whileHover={{ x: 10 }}
      className="glass-card p-5 flex items-center space-x-5 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group"
    >
      <div className="text-center min-w-[50px] space-y-1">
        <p className="text-[10px] font-black text-zenith-electric-blue uppercase tracking-tighter">{date.split(' ')[0]}</p>
        <p className="text-[14px] font-bold text-white/40">{date.split(' ')[1]}</p>
      </div>
      <div className="w-[1px] h-8 bg-white/5" />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs">{moodIcon}</span>
          <div className="h-[1px] w-4 bg-white/10" />
        </div>
        <p className="text-xs text-white/40 truncate italic leading-relaxed">"{preview}"</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Book size={16} className="text-white/40" />
      </div>
    </motion.div>
  );
};

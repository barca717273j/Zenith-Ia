import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book, Send, Sparkles, Calendar, RotateCcw, Puzzle, Brain, Zap, Target, Activity } from 'lucide-react';
import { generateLifeStrategy } from '../services/gemini';
import { supabase } from '../lib/supabase';
import { AnimatePresence } from 'motion/react';

import { useUser } from '../contexts/UserContext';
import { useGamification } from './GamificationContext';

interface JournalProps {
  t: any;
  mode?: 'manual' | 'neural';
}

export const Journal: React.FC<JournalProps> = ({ t, mode = 'manual' }) => {
  const { user: authUser, userData, checkLimit, incrementUsage } = useUser();
  const { addXP } = useGamification();
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState('neutral');
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pastEntries, setPastEntries] = useState<any[]>([]);

  const isNeural = mode === 'neural';

  const [showMathGame, setShowMathGame] = useState(false);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [mathScore, setMathScore] = useState(0);

  const dynamicPhrases = [
    "A disciplina é a ponte entre metas e realizações.",
    "Sua mente é seu hardware mais valioso. Otimize-o.",
    "O desconforto é o catalisador da evolução neural.",
    "Consistência supera intensidade no longo prazo.",
    "Você é o arquiteto da sua própria biologia.",
    "O foco é a moeda mais valiosa da era digital.",
    "Transforme obstáculos em algoritmos de crescimento.",
    "A excelência não é um ato, mas um protocolo diário."
  ];

  const [currentPhrase, setCurrentPhrase] = useState(dynamicPhrases[Math.floor(Math.random() * dynamicPhrases.length)]);

  React.useEffect(() => {
    if (isNeural) {
      const interval = setInterval(() => {
        setCurrentPhrase(dynamicPhrases[Math.floor(Math.random() * dynamicPhrases.length)]);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isNeural]);

  const moods = [
    { id: 'happy', icon: '😊', label: 'Feliz', color: 'bg-green-500/20 text-green-400' },
    { id: 'neutral', icon: '😐', label: 'Neutro', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'sad', icon: '😔', label: 'Triste', color: 'bg-yellow-500/20 text-yellow-400' },
    { id: 'anxious', icon: '😰', label: 'Ansioso', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'angry', icon: '😤', label: 'Irritado', color: 'bg-red-500/20 text-red-400' },
  ];

  const fetchEntries = async () => {
    const { data: userDataAuth } = await supabase.auth.getUser();
    const user = userDataAuth?.user || authUser;
    if (!user) return;
    const { data } = await supabase.from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', mode)
      .order('created_at', { ascending: false })
      .limit(5);
    setPastEntries(data || []);
  };

  React.useEffect(() => {
    fetchEntries();
  }, [mode]);

  const handleSave = async () => {
    if (!entry.trim()) return;
    setIsSaving(true);
    try {
      const { data: userDataAuth } = await supabase.auth.getUser();
      const user = userDataAuth?.user || authUser;
      if (!user) return;

      await supabase.from('journal_entries').insert({
        user_id: user.id,
        content: entry,
        ai_feedback: feedback,
        mood: mood,
        type: mode
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
      const response = await generateLifeStrategy({ context: 'journal' }, `Analyze this ${mode} journal entry and provide constructive feedback for growth: ${entry}`);
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
          <h1 className="text-3xl font-black font-display tracking-tighter uppercase italic text-white leading-none">
            {isNeural ? 'Diário Neural' : 'Diário Manual'}
          </h1>
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30">
            {isNeural ? 'Neural Reflection Log' : 'Manual Consciousness Record'}
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <Calendar size={14} className={isNeural ? "text-zenit-accent" : "text-zenit-cyan"} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            {new Date().toLocaleDateString(userData?.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {isNeural && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[2rem] bg-gradient-to-br from-zenit-accent/10 to-transparent border border-zenit-accent/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={40} className="text-zenit-accent" />
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles size={14} className="text-zenit-accent animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zenit-accent">Insight do Dia</span>
            </div>
            <p className="text-sm text-white/80 italic font-medium leading-relaxed">
              "{currentPhrase}"
            </p>
          </motion.div>
        )}

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
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isNeural ? 'bg-zenit-accent/30 group-focus-within:bg-zenit-accent' : 'bg-zenit-cyan/30 group-focus-within:bg-zenit-cyan'}`} />
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Como foi seu dia? Descreva suas vitórias, aprendizados e desafios..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-base leading-relaxed resize-none placeholder:text-white/10 text-white/80 font-medium"
          />
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isNeural ? 'bg-zenit-accent' : 'bg-zenit-cyan'}`} />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">
                {isNeural ? 'Neural Link Active' : 'Manual Mode Active'}
              </span>
            </div>
            
            <div className="flex space-x-3">
              {isNeural && (
                <button
                  onClick={handleAnalyze}
                  disabled={!entry.trim() || isAnalyzing}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all disabled:opacity-50 border border-white/5"
                >
                  {isAnalyzing ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Sparkles size={14} className="text-zenit-accent" />
                    </motion.div>
                  ) : (
                    <Sparkles size={14} className="text-zenit-accent" />
                  )}
                  <span>Analisar</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!entry.trim() || isSaving}
                className={`flex items-center space-x-2 text-white px-8 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 ${isNeural ? 'bg-zenit-accent shadow-[0_10px_30px_rgba(255,36,0,0.3)]' : 'bg-zenit-cyan shadow-[0_10px_30px_rgba(0,255,255,0.3)]'}`}
              >
                <Send size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Entrada'}</span>
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
              className="glass-card p-8 border-zenit-accent/20 bg-zenit-accent/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-zenit-accent" />
              </div>
              <div className="flex items-center space-x-3 text-zenit-accent mb-4">
                <div className="w-8 h-8 rounded-xl bg-zenit-accent/20 flex items-center justify-center">
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

        {isNeural && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-4 bg-zenit-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Treinamento Cognitivo</h3>
              </div>
              {mathScore > 0 && (
                <span className="text-[9px] font-black text-zenit-accent uppercase tracking-widest">Score: {mathScore}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!showMathGame ? (
                <button 
                  onClick={() => setShowMathGame(true)}
                  className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center space-x-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zenit-accent/10 flex items-center justify-center text-zenit-accent group-hover:scale-110 transition-transform">
                    <Puzzle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Matemática</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">Processamento</p>
                  </div>
                </button>
              ) : (
                <div className="col-span-full glass-card p-8 border-zenit-accent/20 bg-zenit-accent/5 relative overflow-hidden">
                  <MathGame 
                    onClose={() => setShowMathGame(false)} 
                    onScoreUpdate={(s) => {
                      setMathScore(s);
                      addXP(s * 2);
                    }}
                  />
                </div>
              )}

              {!showMemoryGame && !showMathGame && (
                <button 
                  onClick={() => setShowMemoryGame(true)}
                  className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center space-x-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zenit-cyan/10 flex items-center justify-center text-zenit-cyan group-hover:scale-110 transition-transform">
                    <Brain size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Memória</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">Retenção Neural</p>
                  </div>
                </button>
              )}

              {showMemoryGame && (
                <div className="col-span-full glass-card p-8 border-zenit-cyan/20 bg-zenit-cyan/5 relative overflow-hidden">
                  <MemoryGame 
                    onClose={() => setShowMemoryGame(false)} 
                    onScoreUpdate={(s) => {
                      addXP(s);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
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
        <p className="text-[10px] font-black text-zenit-accent uppercase tracking-tighter">{date.split(' ')[0]}</p>
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

const MemoryGame: React.FC<{ onClose: () => void; onScoreUpdate: (score: number) => void }> = ({ onClose, onScoreUpdate }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');

  const startNextLevel = () => {
    const nextSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(nextSequence);
    setUserSequence([]);
    setGameState('playing');
    showSequence(nextSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (const id of seq) {
      setActiveId(id);
      await new Promise(r => setTimeout(r, 600));
      setActiveId(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsShowing(false);
  };

  const handlePadClick = (id: number) => {
    if (isShowing || gameState !== 'playing') return;

    const nextUserSeq = [...userSequence, id];
    setUserSequence(nextUserSeq);

    if (id !== sequence[userSequence.length]) {
      setGameState('over');
      onScoreUpdate(score);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      setScore(score + sequence.length * 10);
      setTimeout(startNextLevel, 1000);
    }
  };

  const pads = [
    { id: 0, color: 'bg-zenit-accent', glow: 'shadow-[0_0_30px_rgba(255,36,0,0.5)]' },
    { id: 1, color: 'bg-zenit-cyan', glow: 'shadow-[0_0_30px_rgba(0,255,255,0.5)]' },
    { id: 2, color: 'bg-emerald-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]' },
    { id: 3, color: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]' }
  ];

  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center items-center space-x-4">
        <div className="text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Score</p>
          <p className="text-2xl font-display font-bold text-zenit-accent">{score}</p>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nível</p>
          <p className="text-2xl font-display font-bold text-white">{sequence.length}</p>
        </div>
      </div>

      {gameState === 'start' ? (
        <div className="py-10 space-y-6">
          <Brain size={60} className="mx-auto text-zenit-accent/40" />
          <p className="text-sm text-white/60 max-w-[200px] mx-auto">Memorize a sequência de cores e repita sem errar.</p>
          <button 
            onClick={startNextLevel}
            className="w-full py-4 bg-zenit-accent text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest"
          >
            Iniciar Protocolo
          </button>
        </div>
      ) : gameState === 'playing' ? (
        <div className="grid grid-cols-2 gap-4 aspect-square max-w-[280px] mx-auto">
          {pads.map((pad) => (
            <motion.button
              key={pad.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePadClick(pad.id)}
              className={`rounded-3xl transition-all duration-200 ${pad.color} ${activeId === pad.id ? `${pad.glow} opacity-100 scale-105` : 'opacity-30'}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center space-y-6 py-10">
          <div className="w-20 h-20 rounded-full bg-zenit-crimson/10 flex items-center justify-center mx-auto">
            <Activity size={40} className="text-zenit-crimson" />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-display font-bold text-zenit-crimson uppercase italic">Falha Neural</h4>
            <p className="text-sm text-white/60">Sua memória atingiu o limite. Score final: {score}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => { setSequence([]); setUserSequence([]); setScore(0); setGameState('start'); }}
              className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10 flex items-center justify-center space-x-2"
            >
              <RotateCcw size={14} />
              <span>Reiniciar</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-zenit-accent rounded-2xl text-[9px] font-bold uppercase tracking-widest text-white flex items-center justify-center space-x-2"
            >
              <X size={14} />
              <span>Fechar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MathGame: React.FC<{ onClose: () => void; onScoreUpdate: (score: number) => void }> = ({ onClose, onScoreUpdate }) => {
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [userAns, setUserAns] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(true);

  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;
    
    if (op === '*') {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      ans = a * b;
    } else {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      ans = op === '+' ? a + b : a - b;
    }
    
    setProblem({ a, b, op, ans });
    setUserAns('');
  };

  React.useEffect(() => {
    generateProblem();
  }, []);

  React.useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      onScoreUpdate(score);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleInput = (num: string) => {
    if (!isPlaying) return;
    const newAns = userAns + num;
    setUserAns(newAns);
    
    if (parseInt(newAns) === problem.ans) {
      setScore(s => s + 1);
      setTimeout(generateProblem, 200);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zenit-accent/20 flex items-center justify-center text-zenit-accent">
            <Clock size={16} />
          </div>
          <span className="text-xl font-display font-bold text-white">{timeLeft}s</span>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Acertos</p>
          <p className="text-xl font-display font-bold text-zenit-accent">{score}</p>
        </div>
      </div>

      {isPlaying ? (
        <div className="space-y-6 text-center">
          <div className="text-4xl font-display font-bold text-white italic">
            {problem.a} <span className="text-zenit-accent">{problem.op === '*' ? '×' : problem.op}</span> {problem.b}
          </div>
          <div className="text-3xl font-bold text-white/20 h-10">
            {userAns || '?'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') setUserAns('');
                  else if (btn === 'OK') {} // Auto-check on input
                  else handleInput(btn.toString());
                }}
                className="py-3 bg-white/5 rounded-xl border border-white/10 text-lg font-bold text-white hover:bg-white/10 transition-all active:scale-90"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6 py-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zenit-accent">Treino Finalizado</p>
            <p className="text-sm text-white/60">Você resolveu {score} equações neurais.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => { setTimeLeft(30); setScore(0); setIsPlaying(true); generateProblem(); }}
              className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10 flex items-center justify-center space-x-2"
            >
              <RotateCcw size={14} />
              <span>Reiniciar</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-zenit-accent rounded-2xl text-[9px] font-bold uppercase tracking-widest text-white flex items-center justify-center space-x-2"
            >
              <X size={14} />
              <span>Fechar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Clock: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const X: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

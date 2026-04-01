import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Target, Puzzle, Gamepad2, ArrowLeft, Zap, Sparkles, Trophy, ChevronLeft, Award, Play, RotateCcw } from 'lucide-react';
import { TetrisGame } from './TetrisGame';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';

import { useUser } from '../contexts/UserContext';

interface MentalGymProps {
  t: any;
}

type GymMode = 'menu' | 'memory' | 'focus' | 'logic' | 'tetris';

export const MentalGym: React.FC<MentalGymProps> = ({ t }) => {
  const { userData } = useUser();
  const [mode, setMode] = useState<GymMode>('menu');
  const { addXP } = useGamification();

  const saveScore = async (gameId: string, score: number) => {
    if (!userData?.id) return;
    try {
      await supabase.from('game_scores').insert([{
        user_id: userData.id,
        game_id: gameId,
        score: score
      }]);
    } catch (err) {
      console.error('Error saving score:', err);
    }
  };

  const exercises = [
    {
      id: 'memory',
      title: t.gym.memoryTitle,
      desc: t.gym.memoryDesc,
      icon: <Brain size={24} />,
      color: 'text-zenith-electric-blue',
      bg: 'bg-zenith-electric-blue/10'
    },
    {
      id: 'focus',
      title: t.gym.focusTitle,
      desc: t.gym.focusDesc,
      icon: <Target size={24} />,
      color: 'text-zenith-scarlet',
      bg: 'bg-zenith-scarlet/10'
    },
    {
      id: 'logic',
      title: t.gym.logicTitle,
      desc: t.gym.logicDesc,
      icon: <Puzzle size={24} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      id: 'tetris',
      title: t.gym.tetrisTitle,
      desc: t.gym.tetrisDesc,
      icon: <Gamepad2 size={24} />,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    }
  ];

  const renderExercise = () => {
    switch (mode) {
      case 'tetris':
        return <TetrisGame t={t} onGameOver={(score) => saveScore('tetris', score)} />;
      case 'memory':
        return <MemoryGame t={t} onBack={() => setMode('menu')} addXP={addXP} onGameOver={(score) => saveScore('memory', score)} />;
      case 'focus':
        return <FocusGame t={t} onBack={() => setMode('menu')} addXP={addXP} onGameOver={(score) => saveScore('focus', score)} />;
      case 'logic':
        return <LogicGame t={t} onBack={() => setMode('menu')} addXP={addXP} onGameOver={(score) => saveScore('logic', score)} />;
      default:
        return null;
    }
  };

  if (mode !== 'menu') {
    return (
      <div className="min-h-screen p-6 pb-32">
        <button 
          onClick={() => setMode('menu')}
          className="flex items-center space-x-2 text-white/40 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.gym.back}</span>
        </button>
        {renderExercise()}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-12 pb-32 max-w-4xl mx-auto min-h-screen">
      <header className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-zenith-accent/10 flex items-center justify-center text-zenith-accent border border-zenith-accent/20 shadow-[0_0_20px_rgba(255,59,59,0.1)]">
            <Brain size={28} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold font-display tracking-tighter uppercase leading-none text-zenith-text-primary italic">
              Academia <span className="text-zenith-accent">Mental</span>
            </h1>
            <p className="text-zenith-text-tertiary text-[11px] font-bold uppercase tracking-[0.3em]">{t.gym.subtitle}</p>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-zenith-accent/30 via-zenith-accent/5 to-transparent" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map((ex) => (
          <motion.button
            key={ex.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode(ex.id as GymMode)}
            className="premium-card premium-card-hover flex items-start space-x-5 text-left group relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-zenith-accent/5 blur-[40px] rounded-full group-hover:bg-zenith-accent/10 transition-all duration-500" />
            
            <div className={`w-14 h-14 rounded-2xl ${ex.bg} flex items-center justify-center ${ex.color} group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-lg relative z-10`}>
              {ex.icon}
            </div>
            <div className="flex-1 space-y-2 relative z-10">
              <h3 className="text-lg font-bold text-zenith-text-primary uppercase tracking-wider group-hover:text-zenith-accent transition-colors">{ex.title}</h3>
              <p className="text-xs text-zenith-text-tertiary leading-relaxed font-medium">{ex.desc}</p>
              <div className="pt-2 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-zenith-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                <span>Acessar Protocolo</span>
                <Sparkles size={10} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="premium-card p-10 border-zenith-accent/20 bg-gradient-to-br from-zenith-surface-1 to-zenith-surface-2 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-zenith-accent/10 blur-[100px] rounded-full group-hover:bg-zenith-accent/20 transition-all duration-1000" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-1000" />

        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] text-zenith-text-tertiary uppercase font-black tracking-[0.4em]">Status Cognitivo</p>
              <h2 className="text-6xl font-display font-bold text-zenith-text-primary tracking-tighter italic">
                Nível <span className="text-zenith-accent">Elite</span>
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-zenith-accent/10 px-4 py-2 rounded-xl border border-zenith-accent/20 text-zenith-accent text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,59,59,0.1)]">
                <Zap size={14} />
                <span>Foco: 94%</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Brain size={14} />
                <span>Memória: 88%</span>
              </div>
            </div>
          </div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 rounded-3xl bg-zenith-surface-2 border border-zenith-accent/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,59,59,0.15)]"
          >
            <Sparkles size={48} className="text-zenith-accent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// --- Mini Games ---

const MemoryGame: React.FC<{ t: any; onBack: () => void; addXP: (xp: number) => void; onGameOver: (score: number) => void }> = ({ t, onBack, addXP, onGameOver }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const startLevel = (currentScore: number) => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setUserSequence([]);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setActiveButton(seq[i]);
      await new Promise(r => setTimeout(r, 400));
      setActiveButton(null);
    }
    setIsShowing(false);
  };

  const handleButtonClick = (index: number) => {
    if (isShowing || !isPlaying) return;
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      setGameOver(true);
      setIsPlaying(false);
      onGameOver(score);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setScore(score + 1);
      addXP(20);
      setTimeout(() => startLevel(score + 1), 1000);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-10">
      <div className="text-center space-y-3">
        <p className="text-[11px] text-zenith-text-tertiary font-black uppercase tracking-[0.4em]">Protocolo de Retenção</p>
        <h2 className="text-4xl font-display font-bold italic uppercase tracking-tighter text-zenith-text-primary">
          Memória <span className="text-zenith-accent">Neural</span>
        </h2>
        <div className="inline-flex items-center space-x-3 bg-zenith-surface-2 px-6 py-2 rounded-2xl border border-zenith-border-primary">
          <Trophy size={16} className="text-zenith-accent" />
          <span className="text-xl font-mono font-bold text-zenith-text-primary">Score: {score}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 aspect-square">
        {[0, 1, 2, 3].map((i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleButtonClick(i)}
            className={`rounded-[2.5rem] border-2 transition-all duration-300 relative overflow-hidden ${
              activeButton === i 
                ? 'bg-zenith-accent border-zenith-accent shadow-[0_0_50px_var(--accent-glow)] scale-105' 
                : 'bg-zenith-surface-1 border-zenith-border-primary hover:border-zenith-accent/30'
            }`}
          >
            {activeButton === i && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
              />
            )}
            <div className={`absolute inset-0 flex items-center justify-center opacity-10 ${activeButton === i ? 'opacity-100' : ''}`}>
              <Zap size={48} className={activeButton === i ? 'text-white' : 'text-zenith-text-tertiary'} />
            </div>
          </motion.button>
        ))}
      </div>

      {!isPlaying && !gameOver && (
        <button 
          onClick={() => { setIsPlaying(true); startLevel(0); }}
          className="neon-button w-full py-6 text-xs font-black uppercase tracking-[0.3em]"
        >
          <Play size={18} />
          <span>Inicializar Treino</span>
        </button>
      )}

      {gameOver && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="premium-card border-zenith-accent/30 bg-zenith-accent/5 py-4">
            <p className="text-zenith-accent font-black uppercase tracking-[0.3em] text-sm">Sincronia Perdida</p>
          </div>
          <button 
            onClick={() => { setGameOver(false); setScore(0); setSequence([]); setIsPlaying(true); startLevel(0); }}
            className="neon-button w-full py-6 text-xs font-black uppercase tracking-[0.3em]"
          >
            <RotateCcw size={18} />
            <span>Tentar Novamente</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

const FocusGame: React.FC<{ t: any; onBack: () => void; addXP: (xp: number) => void; onGameOver: (score: number) => void }> = ({ t, onBack, addXP, onGameOver }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const moveTarget = () => {
    setTargetPos({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
  };

  const handleHit = () => {
    if (!isPlaying) return;
    setScore(s => s + 1);
    addXP(5);
    moveTarget();
  };

  React.useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
      onGameOver(score);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  return (
    <div className="max-w-md mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[11px] text-zenith-text-tertiary uppercase font-black tracking-[0.3em]">Tempo Restante</p>
          <p className="text-5xl font-display font-bold italic text-zenith-text-primary leading-none">{timeLeft}s</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[11px] text-zenith-text-tertiary uppercase font-black tracking-[0.3em]">Alvos Atingidos</p>
          <p className="text-5xl font-display font-bold italic text-zenith-accent leading-none">{score}</p>
        </div>
      </div>

      <div className="aspect-square premium-card relative overflow-hidden border-zenith-border-primary bg-zenith-surface-1 group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,59,0.03)_0%,transparent_70%)]" />
        
        {isPlaying && (
          <motion.button
            initial={false}
            animate={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
            onClick={handleHit}
            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zenith-accent shadow-[0_0_30px_var(--accent-glow)] flex items-center justify-center group/target"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </motion.div>
            <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping" />
          </motion.button>
        )}

        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button 
              onClick={() => { setIsPlaying(true); setTimeLeft(30); setScore(0); moveTarget(); }}
              className="neon-button px-12 py-5 text-xs font-black uppercase tracking-[0.3em]"
            >
              <Target size={20} />
              <span>Calibrar Foco</span>
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-10">
            <div className="text-center space-y-2">
              <p className="text-zenith-accent font-black uppercase tracking-[0.4em] text-sm">Protocolo Concluído</p>
              <p className="text-zenith-text-tertiary text-[11px] font-bold uppercase tracking-widest">Performance Analisada</p>
            </div>
            <button 
              onClick={() => { setGameOver(false); setIsPlaying(true); setTimeLeft(30); setScore(0); moveTarget(); }}
              className="neon-button px-12 py-5 text-xs font-black uppercase tracking-[0.3em]"
            >
              <RotateCcw size={20} />
              <span>Reiniciar Ciclo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const LogicGame: React.FC<{ t: any; onBack: () => void; addXP: (xp: number) => void; onGameOver: (score: number) => void }> = ({ t, onBack, addXP, onGameOver }) => {
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [userAns, setUserAns] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;
    
    if (op === '*') {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      ans = a * b;
    } else {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      ans = op === '+' ? a + b : a - b;
    }
    
    setProblem({ a, b, op, ans });
    setUserAns('');
  };

  const handleNumberInput = (num: number) => {
    const newAns = userAns + num;
    setUserAns(newAns);
    
    if (parseInt(newAns) === problem.ans) {
      setScore(s => s + 1);
      addXP(15);
      setTimeout(generateProblem, 200);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(userAns);
    if (isNaN(val)) return;

    if (val === problem.ans) {
      setScore(s => s + 1);
      addXP(15);
      generateProblem();
    } else {
      setUserAns('');
    }
  };

  React.useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
      onGameOver(score);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, onGameOver]);

  return (
    <div className="max-w-md mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[11px] text-zenith-text-tertiary uppercase font-black tracking-[0.3em]">Tempo</p>
          <p className="text-5xl font-display font-bold italic text-zenith-text-primary leading-none">{timeLeft}s</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[11px] text-zenith-text-tertiary uppercase font-black tracking-[0.3em]">Equações</p>
          <p className="text-5xl font-display font-bold italic text-emerald-400 leading-none">{score}</p>
        </div>
      </div>

      <div className="premium-card p-8 sm:p-12 text-center space-y-10 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden">
        {isPlaying ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="text-6xl sm:text-7xl font-display font-bold tracking-tighter text-zenith-text-primary italic">
              {problem.a} <span className="text-zenith-accent">{problem.op === '*' ? '×' : problem.op}</span> {problem.b}
            </div>

            <div className="relative">
              <div className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-[2rem] py-8 text-center text-5xl font-bold text-zenith-text-primary min-h-[100px] flex items-center justify-center shadow-inner">
                {userAns || <span className="text-zenith-text-tertiary opacity-20">?</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ backgroundColor: 'var(--surface-2)', scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleNumberInput(num)}
                  className="py-6 bg-zenith-surface-2 rounded-2xl border border-zenith-border-primary text-3xl font-bold text-zenith-text-primary transition-all shadow-sm hover:border-zenith-accent/30"
                >
                  {num}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setUserAns('')}
                className="py-6 bg-zenith-accent/10 rounded-2xl border border-zenith-accent/20 text-zenith-accent font-black text-2xl uppercase tracking-widest"
              >
                C
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleNumberInput(0)}
                className="py-6 bg-zenith-surface-2 rounded-2xl border border-zenith-border-primary text-3xl font-bold text-zenith-text-primary"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSubmit()}
                className="py-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 font-black text-2xl uppercase tracking-widest"
              >
                OK
              </motion.button>
            </div>
          </motion.div>
        ) : gameOver ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-zenith-accent font-black uppercase tracking-[0.4em] text-sm">Lógica Concluída</p>
              <p className="text-zenith-text-tertiary text-[11px] font-bold uppercase tracking-widest">Processamento Finalizado</p>
            </div>
            <button 
              onClick={() => { setGameOver(false); setIsPlaying(true); setTimeLeft(30); setScore(0); generateProblem(); }}
              className="neon-button w-full py-6 text-xs font-black uppercase tracking-[0.3em]"
            >
              <RotateCcw size={20} />
              <span>Tentar Novamente</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setIsPlaying(true); setTimeLeft(30); setScore(0); generateProblem(); }}
            className="neon-button w-full py-6 text-xs font-black uppercase tracking-[0.3em]"
          >
            <Puzzle size={20} />
            <span>Iniciar Lógica</span>
          </button>
        )}
      </div>
    </div>
  );
};

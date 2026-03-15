import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Target, Puzzle, Gamepad2, ArrowLeft, Zap, Sparkles, Trophy, ChevronLeft, Award } from 'lucide-react';
import { TetrisGame } from './TetrisGame';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';

interface MentalGymProps {
  t: any;
  userData: any;
}

type GymMode = 'menu' | 'memory' | 'focus' | 'logic' | 'tetris';

export const MentalGym: React.FC<MentalGymProps> = ({ t, userData }) => {
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
      <header className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
            <Brain size={24} />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white uppercase">{t.gym.title}</h1>
        </div>
        <p className="text-white/40 text-xs tracking-widest uppercase">{t.gym.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.map((ex) => (
          <motion.button
            key={ex.id}
            whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode(ex.id as GymMode)}
            className="glass-card p-6 flex items-start space-x-4 text-left border-white/5 bg-white/[0.01] group"
          >
            <div className={`w-12 h-12 rounded-2xl ${ex.bg} flex items-center justify-center ${ex.color} group-hover:scale-110 transition-transform`}>
              {ex.icon}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{ex.title}</h3>
              <p className="text-[10px] text-white/40 leading-relaxed">{ex.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="glass-card p-8 border-white/5 bg-white/[0.01] relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-2">
            <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.3em]">Status Cognitivo</p>
            <h2 className="text-4xl font-display font-bold text-white tracking-tighter">Elite</h2>
            <div className="flex items-center space-x-2 text-zenith-scarlet text-[10px] font-bold uppercase tracking-widest">
              <Zap size={12} />
              <span>Foco: 94% | Memória: 88%</span>
            </div>
          </div>
          <div className="w-20 h-20 rounded-full border-2 border-zenith-scarlet/20 flex items-center justify-center">
            <Sparkles size={32} className="text-zenith-scarlet animate-pulse" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-zenith-scarlet/5 to-transparent pointer-events-none" />
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
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold uppercase tracking-widest">Memória Neural</h2>
        <p className="text-2xl font-display font-bold text-zenith-electric-blue">Score: {score}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 aspect-square">
        {[0, 1, 2, 3].map((i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleButtonClick(i)}
            className={`rounded-3xl border-2 transition-all duration-200 ${
              activeButton === i 
                ? 'bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                : 'bg-white/5 border-white/10'
            }`}
          />
        ))}
      </div>

      {!isPlaying && !gameOver && (
        <button 
          onClick={() => { setIsPlaying(true); startLevel(0); }}
          className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-widest"
        >
          Iniciar Treino
        </button>
      )}

      {gameOver && (
        <div className="text-center space-y-4">
          <p className="text-red-500 font-bold uppercase tracking-widest">Fim de Jogo!</p>
          <button 
            onClick={() => { setGameOver(false); setScore(0); setSequence([]); setIsPlaying(true); startLevel(0); }}
            className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-widest"
          >
            Tentar Novamente
          </button>
        </div>
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
    <div className="max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Tempo</p>
          <p className="text-2xl font-display font-bold">{timeLeft}s</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Hits</p>
          <p className="text-2xl font-display font-bold text-zenith-scarlet">{score}</p>
        </div>
      </div>

      <div className="aspect-square glass-card relative overflow-hidden border-white/10 bg-white/[0.02]">
        {isPlaying && (
          <motion.button
            initial={false}
            animate={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
            onClick={handleHit}
            className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zenith-scarlet shadow-[0_0_20px_rgba(255,36,0,0.5)] flex items-center justify-center"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white/50" />
          </motion.button>
        )}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => { setIsPlaying(true); setTimeLeft(30); setScore(0); moveTarget(); }}
              className="btn-primary px-8 py-3 text-[10px] font-bold uppercase tracking-widest"
            >
              Iniciar Foco
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <p className="text-red-500 font-bold uppercase tracking-widest">Treino Concluído!</p>
            <button 
              onClick={() => { setGameOver(false); setIsPlaying(true); setTimeLeft(30); setScore(0); moveTarget(); }}
              className="btn-primary px-8 py-3 text-[10px] font-bold uppercase tracking-widest"
            >
              Tentar Novamente
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAns) === problem.ans) {
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
  }, [isPlaying, timeLeft]);

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Tempo</p>
          <p className="text-2xl font-display font-bold">{timeLeft}s</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Score</p>
          <p className="text-2xl font-display font-bold text-emerald-400">{score}</p>
        </div>
      </div>

      <div className="glass-card p-12 text-center space-y-8 border-white/10 bg-white/[0.02]">
        {isPlaying ? (
          <>
            <div className="text-5xl font-display font-bold tracking-tighter">
              {problem.a} {problem.op === '*' ? '×' : problem.op} {problem.b} = ?
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                autoFocus
                type="number"
                value={userAns}
                onChange={(e) => setUserAns(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-3xl font-bold focus:outline-none focus:border-emerald-400/50"
              />
              <button type="submit" className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-widest">
                Confirmar
              </button>
            </form>
          </>
        ) : gameOver ? (
          <div className="space-y-4">
            <p className="text-red-500 font-bold uppercase tracking-widest">Lógica Concluída!</p>
            <button 
              onClick={() => { setGameOver(false); setIsPlaying(true); setTimeLeft(30); setScore(0); generateProblem(); }}
              className="btn-primary px-12 py-4 text-[10px] font-bold uppercase tracking-widest"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setIsPlaying(true); setTimeLeft(30); setScore(0); generateProblem(); }}
            className="btn-primary px-12 py-4 text-[10px] font-bold uppercase tracking-widest"
          >
            Iniciar Lógica
          </button>
        )}
      </div>
    </div>
  );
};

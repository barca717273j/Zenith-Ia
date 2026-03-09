import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Clock, Sparkles, Brain, Gamepad2, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';
import { useGamification } from './GamificationContext';

const COLS = 10;
const ROWS = 20;
const SESSION_TIME = 180; // 3 minutes in seconds

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#00f0ff' }, // Cyan
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#3b82f6' }, // Electric Blue
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#60a5fa' }, // Light Blue
  O: { shape: [[1, 1], [1, 1]], color: '#93c5fd' }, // Sky Blue
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#2dd4bf' }, // Teal
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#818cf8' }, // Indigo
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#38bdf8' }, // Deep Sky
};

const RANDOM_TETROMINO = () => {
  const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], type: key };
};

export const TetrisGame: React.FC<{ t: any }> = ({ t }) => {
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIME);
  const { addXP } = useGamification();
  
  const timerRef = useRef<any>(null);
  const gameLoopRef = useRef<any>(null);

  const checkCollision = (nextPos: { x: number, y: number }, piece = activePiece?.shape) => {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x] !== 0) {
          const newX = nextPos.x + x;
          const newY = nextPos.y + y;
          if (
            newX < 0 || 
            newX >= COLS || 
            newY >= ROWS || 
            (newY >= 0 && grid[newY][newX] !== '')
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    const rotated = matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());
    return rotated;
  };

  const handleRotate = () => {
    if (!activePiece || !isPlaying) return;
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(pos, rotatedShape)) {
      setActivePiece({ ...activePiece, shape: rotatedShape });
    }
  };

  const move = (dir: { x: number, y: number }) => {
    if (!isPlaying) return;
    const nextPos = { x: pos.x + dir.x, y: pos.y + dir.y };
    if (!checkCollision(nextPos)) {
      setPos(nextPos);
      return true;
    }
    return false;
  };

  const drop = useCallback(() => {
    if (!move({ x: 0, y: 1 })) {
      // Piece landed
      if (pos.y <= 0) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }
      
      const newGrid = [...grid.map(row => [...row])];
      activePiece.shape.forEach((row: number[], y: number) => {
        row.forEach((value: number, x: number) => {
          if (value !== 0) {
            const gridY = pos.y + y;
            const gridX = pos.x + x;
            if (gridY >= 0 && gridY < ROWS) {
              newGrid[gridY][gridX] = activePiece.color;
            }
          }
        });
      });

      // Clear lines
      let linesCleared = 0;
      const filteredGrid = newGrid.filter(row => {
        const isFull = row.every(cell => cell !== '');
        if (isFull) linesCleared++;
        return !isFull;
      });

      while (filteredGrid.length < ROWS) {
        filteredGrid.unshift(Array(COLS).fill(''));
      }

      setGrid(filteredGrid);
      setScore(prev => prev + (linesCleared * 100));
      setActivePiece(RANDOM_TETROMINO());
      setPos({ x: 3, y: 0 });
    }
  }, [activePiece, grid, pos]);

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setTimeLeft(SESSION_TIME);
    setActivePiece(RANDOM_TETROMINO());
    setPos({ x: 3, y: 0 });
  };

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(drop, 800 - Math.min(score / 10, 500));
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [isPlaying, gameOver, drop, score]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setGameOver(true);
            addXP(Math.floor(score / 10));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft, score, addXP]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render piece on top of grid
  const displayGrid = grid.map(row => [...row]);
  if (activePiece && isPlaying) {
    activePiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const gridY = pos.y + y;
          const gridX = pos.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            displayGrid[gridY][gridX] = activePiece.color;
          }
        }
      });
    });
  }

  return (
    <div className="p-6 space-y-6 pb-32 flex flex-col items-center max-w-md mx-auto min-h-screen">
      <header className="w-full flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Brain size={20} className="text-zenith-electric-blue" />
            <h1 className="text-xl font-display font-bold uppercase tracking-[0.2em]">Mental Gym</h1>
          </div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Protocolo de Descompressão</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <Clock size={14} className="text-zenith-cyan" />
          <span className="text-sm font-mono font-bold text-zenith-cyan">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="relative w-full max-w-[260px] aspect-[10/20] rounded-3xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 grid grid-cols-10 gap-[1px] opacity-10 pointer-events-none">
          {[...Array(200)].map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20" />
          ))}
        </div>

        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-zenith-electric-blue/20 flex items-center justify-center mb-8 relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-zenith-electric-blue/30"
              />
              <Gamepad2 size={40} className="text-zenith-electric-blue" />
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-tighter mb-2">Pausa Cognitiva</h2>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-8 leading-relaxed">
              3 minutos para resetar seu foco e reduzir o cortisol.
            </p>
            <button
              onClick={resetGame}
              className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              Iniciar Sessão
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl text-center p-8">
            <div className="w-20 h-20 rounded-full bg-zenith-cyan/20 flex items-center justify-center mb-6">
              <Trophy size={40} className="text-zenith-cyan" />
            </div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">Sessão Concluída</h2>
            <div className="mt-6 space-y-4 w-full">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Score Neural</p>
                <p className="text-3xl font-display font-bold text-white">{score}</p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-zenith-electric-blue bg-zenith-electric-blue/10 py-3 rounded-2xl border border-zenith-electric-blue/20">
                <Sparkles size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">+{Math.floor(score / 10)} XP Recompensado</span>
              </div>
            </div>
            <button
              onClick={resetGame}
              className="mt-8 w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              Nova Sessão
            </button>
          </div>
        )}

        {/* Game Grid Rendering */}
        <div className="grid grid-cols-10 gap-[1px] h-full p-1">
          {displayGrid.map((row, y) => (
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className="w-full h-full rounded-[2px] transition-colors duration-100"
                style={{
                  backgroundColor: cell || 'rgba(255, 255, 255, 0.02)',
                  boxShadow: cell ? `0 0 10px ${cell}80` : 'none'
                }}
              />
            ))
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-[260px] space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button 
            onClick={handleRotate}
            className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:bg-white/20 transition-all"
          >
            <RotateCcw size={24} className="text-white/60" />
          </button>
          <div />
          <button 
            onClick={() => move({ x: -1, y: 0 })}
            className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:bg-white/20 transition-all"
          >
            <ArrowLeft size={24} className="text-white/60" />
          </button>
          <button 
            onClick={drop}
            className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:bg-white/20 transition-all"
          >
            <ArrowDown size={24} className="text-white/60" />
          </button>
          <button 
            onClick={() => move({ x: 1, y: 0 })}
            className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:bg-white/20 transition-all"
          >
            <ArrowRight size={24} className="text-white/60" />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Score Atual</p>
            <p className="text-3xl font-display font-bold tracking-tighter text-white">{score}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
            >
              {isPlaying ? <Pause size={20} className="text-white/60" /> : <Play size={20} className="text-white/60" />}
            </button>
          </div>
        </div>

        <div className="glass-card p-6 border-white/5 bg-white/[0.02] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-zenith-electric-blue/30" />
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] leading-relaxed italic">
            "Pausas estratégicas aumentam a clareza mental e reduzem o estresse acumulado no córtex pré-frontal."
          </p>
        </div>
      </div>
    </div>
  );
};

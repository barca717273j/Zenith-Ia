import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Clock, Sparkles, Brain, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { useGamification } from './GamificationContext';

const COLS = 10;
const ROWS = 20;
const SESSION_TIME = 180; // 3 minutes in seconds
const INITIAL_DROP_TIME = 700;

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.5)' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)' },
  O: { shape: [[1, 1], [1, 1]], color: '#93c5fd', glow: 'rgba(147, 197, 253, 0.5)' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.5)' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#818cf8', glow: 'rgba(129, 140, 248, 0.5)' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
};

const RANDOM_TETROMINO = () => {
  const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], type: key };
};

export const TetrisGame: React.FC<{ t: any }> = ({ t }) => {
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<any>(null);
  const [nextPiece, setNextPiece] = useState<any>(RANDOM_TETROMINO());
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIME);
  const [clearingLines, setClearingLines] = useState<number[]>([]);
  const { addXP } = useGamification();
  
  const timerRef = useRef<any>(null);
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const checkCollision = useCallback((nextPos: { x: number, y: number }, piece = activePiece?.shape) => {
    if (!piece) return false;
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
  }, [activePiece, grid]);

  const rotate = (matrix: number[][]) => {
    return matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());
  };

  const handleRotate = useCallback(() => {
    if (!activePiece || !isPlaying) return;
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(pos, rotatedShape)) {
      setActivePiece({ ...activePiece, shape: rotatedShape });
    }
  }, [activePiece, isPlaying, pos, checkCollision]);

  const move = useCallback((dir: { x: number, y: number }) => {
    if (!isPlaying) return false;
    const nextPos = { x: pos.x + dir.x, y: pos.y + dir.y };
    if (!checkCollision(nextPos)) {
      setPos(nextPos);
      return true;
    }
    return false;
  }, [isPlaying, pos, checkCollision]);

  const drop = useCallback(() => {
    if (!move({ x: 0, y: 1 })) {
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

      // Check for full lines
      const fullLines: number[] = [];
      newGrid.forEach((row, y) => {
        if (row.every(cell => cell !== '')) {
          fullLines.push(y);
        }
      });

      if (fullLines.length > 0) {
        setClearingLines(fullLines);
        setTimeout(() => {
          const filteredGrid = newGrid.filter((_, y) => !fullLines.includes(y));
          while (filteredGrid.length < ROWS) {
            filteredGrid.unshift(Array(COLS).fill(''));
          }
          setGrid(filteredGrid);
          setScore(prev => prev + (fullLines.length * 100));
          setClearingLines([]);
          setActivePiece(nextPiece);
          setNextPiece(RANDOM_TETROMINO());
          setPos({ x: 3, y: 0 });
        }, 200);
      } else {
        setGrid(newGrid);
        setActivePiece(nextPiece);
        setNextPiece(RANDOM_TETROMINO());
        setPos({ x: 3, y: 0 });
      }
    }
  }, [activePiece, grid, pos, move, nextPiece]);

  const gameLoop = useCallback((time: number) => {
    if (!isPlaying || gameOver) return;
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    dropCounterRef.current += deltaTime;

    const currentDropTime = Math.max(100, INITIAL_DROP_TIME - Math.floor(score / 500) * 50);

    if (dropCounterRef.current > currentDropTime) {
      drop();
      dropCounterRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, score, drop]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, gameOver, gameLoop]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setGameOver(true);
            addXP(Math.floor(score / 10) + 100); // Bonus for finishing session
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

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setTimeLeft(SESSION_TIME);
    setActivePiece(RANDOM_TETROMINO());
    setNextPiece(RANDOM_TETROMINO());
    setPos({ x: 3, y: 0 });
    lastTimeRef.current = performance.now();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isPlaying) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dy) > 50 && dy > 0) {
      // Swipe down
      drop();
    } else if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      // Tap
      const width = window.innerWidth;
      const x = touch.clientX;
      if (x < width * 0.3) {
        move({ x: -1, y: 0 });
      } else if (x > width * 0.7) {
        move({ x: 1, y: 0 });
      } else {
        handleRotate();
      }
    }
    touchStartRef.current = null;
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate Ghost Position
  const getGhostPos = () => {
    if (!activePiece) return pos;
    let ghostY = pos.y;
    while (!checkCollision({ x: pos.x, y: ghostY + 1 })) {
      ghostY++;
    }
    return { x: pos.x, y: ghostY };
  };

  const ghostPos = getGhostPos();

  const displayGrid = grid.map(row => [...row]);
  
  // Render Ghost Piece
  if (activePiece && isPlaying) {
    activePiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const gridY = ghostPos.y + y;
          const gridX = ghostPos.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            if (displayGrid[gridY][gridX] === '') {
              displayGrid[gridY][gridX] = 'ghost';
            }
          }
        }
      });
    });
  }

  // Render Active Piece
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
    <div className="p-4 space-y-6 pb-32 flex flex-col items-center max-w-md mx-auto min-h-screen select-none touch-none">
      <header className="w-full flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Brain size={20} className="text-zenith-electric-blue" />
            <h1 className="text-xl font-display font-bold uppercase tracking-[0.2em]">{t.gym.title}</h1>
          </div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest">{t.gym.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <Clock size={14} className="text-zenith-cyan" />
          <span className="text-sm font-mono font-bold text-zenith-cyan">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="w-full flex gap-4 items-start">
        <div 
          className="relative flex-1 aspect-[10/20] rounded-3xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 grid grid-cols-10 gap-[1px] opacity-5 pointer-events-none">
            {[...Array(200)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/10" />
            ))}
          </div>

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-zenith-electric-blue/20 flex items-center justify-center mb-6 relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-zenith-electric-blue/30"
                />
                <Gamepad2 size={32} className="text-zenith-electric-blue" />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-tighter mb-2">{t.gym.pauseTitle}</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-8 leading-relaxed">
                {t.gym.pauseDesc}
              </p>
              <button
                onClick={resetGame}
                className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                {t.gym.start}
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl text-center p-8">
              <div className="w-16 h-16 rounded-full bg-zenith-cyan/20 flex items-center justify-center mb-6">
                <Trophy size={32} className="text-zenith-cyan" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">{t.gym.gameOver}</h2>
              <div className="mt-6 space-y-4 w-full">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{t.gym.scoreLabel}</p>
                  <p className="text-3xl font-display font-bold text-white">{score}</p>
                </div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center space-x-2 text-zenith-electric-blue bg-zenith-electric-blue/10 py-3 rounded-2xl border border-zenith-electric-blue/20"
                >
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">+{Math.floor(score / 10) + 100} {t.gym.xpReward}</span>
                </motion.div>
              </div>
              <button
                onClick={resetGame}
                className="mt-8 w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                {t.gym.newSession}
              </button>
            </div>
          )}

          {/* Game Grid Rendering */}
          <div className="grid grid-cols-10 gap-[1px] h-full p-1">
            {displayGrid.map((row, y) => (
              row.map((cell, x) => (
                <motion.div
                  key={`${x}-${y}`}
                  animate={clearingLines.includes(y) ? { 
                    backgroundColor: ['#fff', cell === 'ghost' ? 'transparent' : cell || 'rgba(255, 255, 255, 0.02)'],
                    boxShadow: ['0 0 20px #fff', 'none']
                  } : {}}
                  className="w-full h-full rounded-[2px] transition-colors duration-100"
                  style={{
                    backgroundColor: cell === 'ghost' ? 'transparent' : cell || 'rgba(255, 255, 255, 0.02)',
                    border: cell === 'ghost' ? `1px dashed ${activePiece?.color}40` : 'none',
                    boxShadow: cell && cell !== 'ghost' ? `0 0 8px ${cell}60` : 'none'
                  }}
                />
              ))
            ))}
          </div>
        </div>

        {/* Side Info */}
        <div className="w-24 space-y-4">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-2">{t.gym.nextPiece}</p>
            <div className="aspect-square flex items-center justify-center">
              {nextPiece && (
                <div className="grid grid-cols-4 gap-[2px]">
                  {nextPiece.shape.map((row: number[], y: number) => (
                    row.map((value: number, x: number) => (
                      <div 
                        key={`${x}-${y}`}
                        className="w-3 h-3 rounded-[1px]"
                        style={{ backgroundColor: value !== 0 ? nextPiece.color : 'transparent' }}
                      />
                    ))
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">{t.gym.scoreCurrent}</p>
            <p className="text-lg font-display font-bold text-white">{score}</p>
          </div>

          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
            >
              {isPlaying ? <Pause size={18} className="text-white/60" /> : <Play size={18} className="text-white/60" />}
            </button>
            <button 
              onClick={resetGame}
              className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
            >
              <RotateCcw size={18} className="text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats & Controls Info */}
      <div className="w-full max-w-[280px] space-y-6">
        {/* Mobile Instructions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-zenith-electric-blue/10 flex items-center justify-center">
              <ArrowLeft size={12} className="text-zenith-electric-blue" />
            </div>
            <span className="text-[9px] text-white/40 uppercase font-bold">{t.gym.controlLeft}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-zenith-electric-blue/10 flex items-center justify-center">
              <ArrowRight size={12} className="text-zenith-electric-blue" />
            </div>
            <span className="text-[9px] text-white/40 uppercase font-bold">{t.gym.controlRight}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-zenith-cyan/10 flex items-center justify-center">
              <ArrowUp size={12} className="text-zenith-cyan" />
            </div>
            <span className="text-[9px] text-white/40 uppercase font-bold">{t.gym.controlRotate}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-zenith-cyan/10 flex items-center justify-center">
              <ArrowDown size={12} className="text-zenith-cyan" />
            </div>
            <span className="text-[9px] text-white/40 uppercase font-bold">{t.gym.controlDrop}</span>
          </div>
        </div>

        <div className="glass-card p-6 border-white/5 bg-white/[0.02] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-zenith-electric-blue/30" />
          <div className="flex items-center space-x-3 mb-2">
            <Zap size={14} className="text-zenith-electric-blue" />
            <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">{t.gym.tipTitle}</p>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] leading-relaxed italic">
            "{t.gym.tipDesc}"
          </p>
        </div>
      </div>
    </div>
  );
};

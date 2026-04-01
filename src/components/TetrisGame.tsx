import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Clock, Sparkles, Brain, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { useGamification } from './GamificationContext';

const COLS = 10;
const ROWS = 20;
const SESSION_TIME = 180; // 3 minutes in seconds
const INITIAL_DROP_TIME = 700;

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#FF3B3B', glow: 'rgba(255, 59, 59, 0.5)' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#8b0000', glow: 'rgba(139, 0, 0, 0.5)' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#FF3B3B', glow: 'rgba(255, 59, 59, 0.5)' },
  O: { shape: [[1, 1], [1, 1]], color: '#FF3B3B', glow: 'rgba(255, 59, 59, 0.5)' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#8b0000', glow: 'rgba(139, 0, 0, 0.5)' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#FF3B3B', glow: 'rgba(255, 59, 59, 0.5)' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#8b0000', glow: 'rgba(139, 0, 0, 0.5)' },
};

const RANDOM_TETROMINO = () => {
  const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], type: key };
};

export const TetrisGame: React.FC<{ t: any; onGameOver?: (score: number) => void }> = ({ t, onGameOver }) => {
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

  useEffect(() => {
    if (gameOver && onGameOver) {
      onGameOver(score);
    }
  }, [gameOver, score, onGameOver]);

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
        // Add extra XP for multiple lines
        const bonusXP = fullLines.length * 20;
        addXP(bonusXP);
        
        setTimeout(() => {
          const filteredGrid = newGrid.filter((_, y) => !fullLines.includes(y));
          while (filteredGrid.length < ROWS) {
            filteredGrid.unshift(Array(COLS).fill(''));
          }
          setGrid(filteredGrid);
          setScore(prev => prev + (fullLines.length * 100 * fullLines.length)); // Exponential score
          setClearingLines([]);
          setActivePiece(nextPiece);
          setNextPiece(RANDOM_TETROMINO());
          setPos({ x: 3, y: 0 });
        }, 400); // Longer delay for animation
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

  const handleManualControl = (key: string) => {
    if (!isPlaying || gameOver) return;
    switch (key) {
      case 'ArrowLeft': move({ x: -1, y: 0 }); break;
      case 'ArrowRight': move({ x: 1, y: 0 }); break;
      case 'ArrowDown': drop(); break;
      case 'ArrowUp': handleRotate(); break;
      case ' ': 
        while (move({ x: 0, y: 1 }));
        drop();
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleManualControl(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, move, drop, handleRotate]);

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
    <div className="p-4 space-y-6 pb-32 flex flex-col items-center max-w-lg mx-auto min-h-screen select-none touch-none relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-zenith-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <header className="w-full flex justify-between items-center bg-[#1A1A1A]/80 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-zenith-accent to-zenith-crimson shadow-[0_0_15px_var(--accent-glow)]">
              <Brain size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary italic">Neural Tetris</h1>
          </div>
          <p className="text-zenith-text-tertiary text-[8px] uppercase tracking-[0.3em] font-bold opacity-60">Cognitive Processing Grid</p>
        </div>
        <div className="flex items-center space-x-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner">
          <Clock size={16} className="text-zenith-accent animate-pulse" />
          <span className="text-lg font-mono font-bold text-zenith-accent drop-shadow-[0_0_8px_var(--accent-glow)] tracking-tighter">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="w-full flex flex-col items-center justify-center gap-6 relative z-10">
        <div 
          className="relative w-full max-w-[260px] aspect-[10/20] rounded-[2rem] overflow-hidden border border-white/10 bg-[#1A1A1A] shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 grid grid-cols-10 gap-[1px] opacity-10 pointer-events-none">
            {[...Array(200)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-zenith-border-primary/20" />
            ))}
          </div>

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-zenith-accent/20 flex items-center justify-center mb-6 relative border border-zenith-accent/30 shadow-[0_0_30px_var(--accent-glow)]">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl border border-zenith-accent/40"
                />
                <Gamepad2 size={32} className="text-zenith-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-2 text-zenith-text-primary italic">Neural Sync</h2>
              <p className="text-zenith-text-tertiary text-[9px] uppercase tracking-[0.25em] mb-8 leading-relaxed font-bold opacity-60">
                Align the neural blocks to optimize cognitive flow.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-8 w-full">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-[8px] uppercase tracking-widest text-zenith-text-tertiary font-bold shadow-inner">
                  <ArrowUp size={12} className="mx-auto mb-2 text-zenith-accent" />
                  Rotate
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-[8px] uppercase tracking-widest text-zenith-text-tertiary font-bold shadow-inner">
                  <ArrowDown size={12} className="mx-auto mb-2 text-zenith-accent" />
                  Drop
                </div>
              </div>

              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-zenith-accent to-zenith-crimson text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] shadow-[0_0_30px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95"
              >
                Initialize Link
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl text-center p-8">
              <div className="w-20 h-20 rounded-full bg-zenith-accent/20 flex items-center justify-center mb-8 border border-zenith-accent/40 shadow-[0_0_40px_var(--accent-glow)]">
                <Trophy size={40} className="text-zenith-accent" />
              </div>
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary italic">{t.gym.gameOver}</h2>
              <div className="mt-8 space-y-5 w-full">
                <div className="bg-white/5 rounded-[1.5rem] p-5 border border-white/10 shadow-inner">
                  <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.3em] mb-2 font-bold opacity-60">{t.gym.scoreLabel}</p>
                  <p className="text-4xl font-display font-bold text-zenith-text-primary italic tracking-tighter">{score}</p>
                </div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center space-x-3 text-zenith-accent bg-zenith-accent/10 py-4 rounded-2xl border border-zenith-accent/20 shadow-[0_0_20px_var(--accent-glow)]"
                >
                  <Sparkles size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">+{Math.floor(score / 10) + 100} {t.gym.xpReward}</span>
                </motion.div>
              </div>
              <button
                onClick={resetGame}
                className="mt-10 w-full bg-gradient-to-r from-zenith-accent to-zenith-crimson text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.4em] shadow-[0_0_30px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95"
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

        {/* Side Info & Controls */}
        <div className="w-full lg:w-48 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-zenith-surface-1 rounded-3xl p-6 border border-zenith-border-primary text-center space-y-2">
              <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold">{t.gym.nextPiece}</p>
              <div className="aspect-square flex items-center justify-center">
                {nextPiece && (
                  <div className="grid grid-cols-4 gap-[2px]">
                    {nextPiece.shape.map((row: number[], y: number) => (
                      row.map((value: number, x: number) => (
                        <div 
                          key={`${x}-${y}`}
                          className="w-4 h-4 rounded-[1px]"
                          style={{ backgroundColor: value !== 0 ? nextPiece.color : 'transparent' }}
                        />
                      ))
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zenith-surface-1 rounded-3xl p-6 border border-zenith-border-primary text-center flex flex-col justify-center">
              <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest mb-1 font-bold">{t.gym.scoreCurrent}</p>
              <p className="text-3xl font-display font-bold text-zenith-text-primary italic">{score}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="py-6 rounded-3xl bg-zenith-surface-1 flex items-center justify-center border border-zenith-border-primary hover:bg-zenith-surface-2 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={24} className="text-zenith-text-tertiary" /> : <Play size={24} className="text-zenith-text-tertiary" />}
            </button>
            <button 
              onClick={resetGame}
              className="py-6 rounded-3xl bg-zenith-surface-1 flex items-center justify-center border border-zenith-border-primary hover:bg-zenith-surface-2 transition-all active:scale-95"
            >
              <RotateCcw size={24} className="text-zenith-text-tertiary" />
            </button>
          </div>

          {/* Mobile Controls - Visible on small screens */}
          <div className="grid grid-cols-3 gap-3 lg:hidden pt-4">
            <div />
            <button 
              onPointerDown={() => handleManualControl('ArrowUp')}
              className="w-full aspect-square rounded-2xl bg-zenith-surface-1 border border-zenith-border-primary flex items-center justify-center text-zenith-text-tertiary active:bg-zenith-surface-2 active:scale-95 transition-all"
            >
              <ArrowUp size={24} />
            </button>
            <div />
            
            <button 
              onPointerDown={() => handleManualControl('ArrowLeft')}
              className="w-full aspect-square rounded-2xl bg-zenith-surface-1 border border-zenith-border-primary flex items-center justify-center text-zenith-text-tertiary active:bg-zenith-surface-2 active:scale-95 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <button 
              onPointerDown={() => handleManualControl('ArrowDown')}
              className="w-full aspect-square rounded-2xl bg-zenith-surface-1 border border-zenith-border-primary flex items-center justify-center text-zenith-text-tertiary active:bg-zenith-surface-2 active:scale-95 transition-all"
            >
              <ArrowDown size={24} />
            </button>
            <button 
              onPointerDown={() => handleManualControl('ArrowRight')}
              className="w-full aspect-square rounded-2xl bg-zenith-surface-1 border border-zenith-border-primary flex items-center justify-center text-zenith-text-tertiary active:bg-zenith-surface-2 active:scale-95 transition-all"
            >
              <ArrowRight size={24} />
            </button>
            
            <div />
            <button 
              onPointerDown={() => handleManualControl(' ')}
              className="w-full aspect-square rounded-2xl bg-zenith-accent/10 border border-zenith-accent/20 flex items-center justify-center text-zenith-accent active:bg-zenith-accent/30 active:scale-95 transition-all"
            >
              <Zap size={24} />
            </button>
            <div />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="premium-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-zenith-accent/30" />
          <div className="flex items-center space-x-3 mb-4">
            <Zap size={18} className="text-zenith-accent" />
            <p className="text-[12px] text-zenith-text-secondary uppercase tracking-[0.2em] font-bold">{t.gym.tipTitle}</p>
          </div>
          <p className="text-[12px] text-zenith-text-tertiary uppercase tracking-[0.15em] leading-relaxed italic font-medium">
            "{t.gym.tipDesc}"
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const COLS = 10;
const ROWS = 15; // Shorter for widget
const INITIAL_DROP_TIME = 800;

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#ff2400' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#8b0000' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#ff0000' },
  O: { shape: [[1, 1], [1, 1]], color: '#ff2400' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#8b0000' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#ff2400' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#8b0000' },
};

const RANDOM_TETROMINO = () => {
  const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], type: key };
};

export const TetrisWidget: React.FC<{ t: any }> = ({ t }) => {
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  const checkCollision = useCallback((nextPos: { x: number, y: number }, piece = activePiece?.shape) => {
    if (!piece) return false;
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x] !== 0) {
          const newX = nextPos.x + x;
          const newY = nextPos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX] !== '')) {
            return true;
          }
        }
      }
    }
    return false;
  }, [activePiece, grid]);

  const rotate = (matrix: number[][]) => matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());

  const handleRotate = useCallback(() => {
    if (!activePiece || !isPlaying) return;
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(pos, rotatedShape)) setActivePiece({ ...activePiece, shape: rotatedShape });
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
            if (gridY >= 0 && gridY < ROWS) newGrid[gridY][gridX] = activePiece.color;
          }
        });
      });
      const filteredGrid = newGrid.filter(row => !row.every(cell => cell !== ''));
      while (filteredGrid.length < ROWS) filteredGrid.unshift(Array(COLS).fill(''));
      setGrid(filteredGrid);
      setScore(prev => prev + (newGrid.length - filteredGrid.length) * 100);
      setActivePiece(RANDOM_TETROMINO());
      setPos({ x: 3, y: 0 });
    }
  }, [activePiece, grid, pos, move]);

  const gameLoop = useCallback((time: number) => {
    if (!isPlaying || gameOver) return;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    dropCounterRef.current += deltaTime;
    if (dropCounterRef.current > INITIAL_DROP_TIME) {
      drop();
      dropCounterRef.current = 0;
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, drop]);

  useEffect(() => {
    if (isPlaying && !gameOver) requestRef.current = requestAnimationFrame(gameLoop);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, gameOver, gameLoop]);

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setActivePiece(RANDOM_TETROMINO());
    setPos({ x: 3, y: 0 });
    lastTimeRef.current = performance.now();
  };

  const displayGrid = grid.map(row => [...row]);
  if (activePiece && isPlaying) {
    activePiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const gridY = pos.y + y;
          const gridX = pos.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) displayGrid[gridY][gridX] = activePiece.color;
        }
      });
    });
  }

  return (
    <div className="glass-card p-4 space-y-4 border-white/5 bg-white/[0.01] relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Gamepad2 size={14} className="text-zenith-scarlet" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t.gamification.tetris}</h3>
        </div>
        <div className="text-[10px] font-mono font-bold text-zenith-scarlet">SCORE: {score}</div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 aspect-[10/15] rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <div className="grid grid-cols-10 gap-[1px] h-full p-0.5">
            {displayGrid.map((row, y) => (
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className="w-full h-full rounded-[1px]"
                  style={{
                    backgroundColor: cell || 'rgba(255, 255, 255, 0.02)',
                    boxShadow: cell ? `0 0 5px ${cell}40` : 'none'
                  }}
                />
              ))
            ))}
          </div>
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <button onClick={resetGame} className="w-10 h-10 rounded-full bg-zenith-scarlet flex items-center justify-center text-white">
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          )}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 mb-2">Game Over</p>
              <button onClick={resetGame} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <RotateCcw size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="w-12 flex flex-col gap-2">
          <button onClick={handleRotate} className="flex-1 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><ArrowUp size={14} /></button>
          <div className="flex gap-1">
            <button onClick={() => move({ x: -1, y: 0 })} className="flex-1 aspect-square rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><ArrowLeft size={12} /></button>
            <button onClick={() => move({ x: 1, y: 0 })} className="flex-1 aspect-square rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><ArrowRight size={12} /></button>
          </div>
          <button onClick={drop} className="flex-1 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><ArrowDown size={14} /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

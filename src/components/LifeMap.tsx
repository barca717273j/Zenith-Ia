import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, Brain, Target, Zap, Heart, Users, Briefcase, Compass } from 'lucide-react';
import { supabase } from '../supabase';

const connections = [
  ['health', 'knowledge'],
  ['knowledge', 'career'],
  ['career', 'wealth'],
  ['wealth', 'growth'],
  ['growth', 'creativity'],
  ['creativity', 'spiritual'],
  ['spiritual', 'relationships'],
  ['relationships', 'health'],
];

interface LifeMapProps {
  userData: any;
  t: any;
}

export const LifeMap: React.FC<LifeMapProps> = ({ userData, t }) => {
  const [progressData, setProgressData] = React.useState<Record<string, number>>({
    health: 0.5,
    wealth: 0.3,
    knowledge: 0.4,
    relationships: 0.6,
    growth: 0.7,
    career: 0.4,
    creativity: 0.3,
    spiritual: 0.2
  });

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Health (Exercises)
    const { count: exerciseCount } = await supabase.from('exercise_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    
    // 2. Wealth (Finance Goals)
    const { data: goals } = await supabase.from('finance_goals').select('current_amount, target_amount').eq('user_id', user.id);
    const wealthProgress = goals?.length ? goals.reduce((acc, g) => acc + (g.current_amount / g.target_amount), 0) / goals.length : 0.1;

    // 3. Knowledge (Mental Gym - using focus_minutes as proxy)
    const { data: uData } = await supabase.from('users').select('focus_minutes, xp, level').eq('id', user.id).single();
    const knowledgeProgress = Math.min(1, (uData?.focus_minutes || 0) / 500);

    // 4. Relationships (Social posts)
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    // 5. Growth (Level)
    const growthProgress = Math.min(1, (uData?.level || 1) / 50);

    setProgressData({
      health: Math.min(1, (exerciseCount || 0) / 20 + 0.1),
      wealth: Math.min(1, wealthProgress + 0.1),
      knowledge: Math.min(1, knowledgeProgress + 0.1),
      relationships: Math.min(1, (postCount || 0) / 10 + 0.1),
      growth: growthProgress,
      career: Math.min(1, (uData?.focus_minutes || 0) / 1000 + 0.2),
      creativity: 0.4, // Placeholder for now
      spiritual: 0.3 // Placeholder for now
    });
  };

  React.useEffect(() => {
    fetchProgress();
  }, []);

  const categories = [
    { id: 'health', label: t.map.categories.health, x: 100, y: 100, progress: progressData.health, icon: <Heart size={14} /> },
    { id: 'wealth', label: t.map.categories.wealth, x: 300, y: 150, progress: progressData.wealth, icon: <Zap size={14} /> },
    { id: 'knowledge', label: t.map.categories.mind, x: 200, y: 300, progress: progressData.knowledge, icon: <Brain size={14} /> },
    { id: 'relationships', label: t.map.categories.social, x: 50, y: 400, progress: progressData.relationships, icon: <Users size={14} /> },
    { id: 'growth', label: t.map.categories.growth, x: 350, y: 450, progress: progressData.growth, icon: <Activity size={14} /> },
    { id: 'career', label: t.map.categories.career, x: 150, y: 550, progress: progressData.career, icon: <Briefcase size={14} /> },
    { id: 'creativity', label: t.map.categories.leisure, x: 300, y: 650, progress: progressData.creativity, icon: <Sparkles size={14} /> },
    { id: 'spiritual', label: t.map.categories.spirit, x: 50, y: 700, progress: progressData.spiritual, icon: <Compass size={14} /> },
  ];

  return (
    <div className="p-6 space-y-10 pb-32 min-h-screen max-w-2xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-zenith-cyan rounded-full animate-pulse" />
          <h1 className="text-3xl font-bold font-display tracking-tighter uppercase leading-none">{t.map.title}</h1>
        </div>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">{t.map.subtitle}</p>
      </header>

      <div className="relative w-full aspect-[1/2] rounded-[40px] border border-white/10 overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
        
        <svg viewBox="0 0 400 800" className="w-full h-full relative z-10">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b0000" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff2400" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Constellation Lines */}
          {connections.map(([fromId, toId], i) => {
            const from = categories.find(c => c.id === fromId)!;
            const to = categories.find(c => c.id === toId)!;
            return (
              <motion.line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            );
          })}

          {/* Nodes */}
          {categories.map((cat) => (
            <g key={cat.id} className="cursor-pointer group">
              {/* Outer Glow Ring */}
              <motion.circle
                cx={cat.x}
                cy={cat.y}
                r={24}
                fill="none"
                stroke={cat.id === 'health' ? '#8b0000' : '#ff2400'}
                strokeWidth="0.5"
                strokeOpacity="0.1"
                animate={{ r: [20, 28, 20], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
              />
              
              {/* Progress Ring */}
              <circle
                cx={cat.x}
                cy={cat.y}
                r={16}
                fill="rgba(0,0,0,0.4)"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="3"
              />
              <motion.circle
                cx={cat.x}
                cy={cat.y}
                r={16}
                fill="none"
                stroke={cat.id === 'health' ? '#8b0000' : '#ff2400'}
                strokeWidth="3"
                strokeDasharray="100.53"
                initial={{ strokeDashoffset: 100.53 }}
                animate={{ strokeDashoffset: 100.53 * (1 - cat.progress) }}
                transition={{ duration: 2, delay: 0.5 }}
                filter="url(#glow)"
              />

              {/* Icon Container */}
              <foreignObject x={cat.x - 10} y={cat.y - 10} width="20" height="20">
                <div className="flex items-center justify-center w-full h-full text-white/60 group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
              </foreignObject>

              {/* Label */}
              <text
                x={cat.x}
                y={cat.y + 40}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="9"
                className="font-display font-bold uppercase tracking-[0.2em] group-hover:fill-white transition-all"
              >
                {cat.label}
              </text>
              <text
                x={cat.x}
                y={cat.y + 52}
                textAnchor="middle"
                fill={cat.id === 'health' ? '#8b0000' : '#ff2400'}
                fontSize="8"
                className="font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {Math.round(cat.progress * 100)}%
              </text>
            </g>
          ))}
        </svg>

        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: Math.random() * 0.3
            }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              y: ['-10%', '110%']
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="glass-card p-6 border-white/5 bg-white/[0.02] flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-zenith-electric-blue/10 flex items-center justify-center border border-zenith-electric-blue/20">
          <Brain size={20} className="text-zenith-electric-blue" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Insight da IA</p>
          <p className="text-xs text-white/70 leading-relaxed italic">
            "Seu equilíbrio neural está otimizado em 68%. Foque na categoria 'Espiritual' para reduzir a entropia cognitiva."
          </p>
        </div>
      </div>

    </div>
  );
};

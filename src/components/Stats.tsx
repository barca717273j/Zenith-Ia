import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';
import { supabase } from '../supabase';

const productivityData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 78 },
  { day: 'Wed', score: 45 },
  { day: 'Thu', score: 90 },
  { day: 'Fri', score: 82 },
  { day: 'Sat', score: 55 },
  { day: 'Sun', score: 70 },
];

const categoryData = [
  { name: 'Work', value: 45 },
  { name: 'Health', value: 25 },
  { name: 'Growth', value: 20 },
  { name: 'Finance', value: 10 },
];

export const Stats: React.FC<{ userData: any }> = ({ userData }) => {
  const [productivityData, setProductivityData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = async () => {
    if (!userData?.id) return;

    // Fetch last 7 days of activity
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    try {
      // Fetch habits and routines to calculate daily scores
      const { data: habits } = await supabase.from('habits').select('completion_history').eq('user_id', userData.id);
      const { data: routines } = await supabase.from('routines').select('last_completed').eq('user_id', userData.id);
      
      const stats = last7Days.map(date => {
        let dailyScore = 20; // Base score
        
        // Count habits completed on this date
        habits?.forEach(h => {
          if (h.completion_history?.includes(date)) {
            dailyScore += 10;
          }
        });

        // Count routines completed on this date
        routines?.forEach(r => {
          if (r.last_completed?.startsWith(date)) {
            dailyScore += 15;
          }
        });
        
        const d = new Date(date);
        return {
          day: days[d.getDay()],
          score: dailyScore
        };
      });

      setProductivityData(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [userData]);

  const categoryData = [
    { name: 'Trabalho', value: 45 },
    { name: 'Saúde', value: 25 },
    { name: 'Crescimento', value: 20 },
    { name: 'Finanças', value: 10 },
  ];

  return (
    <div className="p-6 space-y-8 pb-32">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Analytics</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Desempenho Semanal</p>
      </header>

      <section className="space-y-4">
        <h3 className="text-[10px] font-display font-bold text-white/60 uppercase tracking-widest">Score de Produtividade</h3>
        <div className="glass-card p-4 h-64 w-full border-white/5 bg-white/[0.01]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zenith-scarlet border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff2400" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff2400" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#ff2400' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ff2400" 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-display font-bold text-white/60 uppercase tracking-widest">Distribuição de Foco</h3>
        <div className="glass-card p-4 h-64 w-full border-white/5 bg-white/[0.01]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Bar 
                dataKey="value" 
                fill="#8b0000" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 border-white/5 bg-white/[0.01]">
          <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-1">Foco Médio</p>
          <p className="text-2xl font-display font-bold tracking-tighter">4.5h</p>
        </div>
        <div className="glass-card p-6 border-white/5 bg-white/[0.01]">
          <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-1">Consistência</p>
          <p className="text-2xl font-display font-bold tracking-tighter text-emerald-400">92%</p>
        </div>
      </div>
    </div>
  );
};

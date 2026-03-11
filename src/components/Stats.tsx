import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';

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

export const Stats: React.FC = () => {
  return (
    <div className="p-6 space-y-8 pb-32">
      <header>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-white/40 text-sm">Weekly performance insights</p>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-display font-medium text-white/60 uppercase tracking-widest">Productivity Score</h3>
        <div className="glass-card p-4 h-64 w-full">
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
                contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
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
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-display font-medium text-white/60 uppercase tracking-widest">Focus Distribution</h3>
        <div className="glass-card p-4 h-64 w-full">
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
                contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
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
        <div className="glass-card p-4">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Avg Focus</p>
          <p className="text-xl font-bold">4.5h</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Consistency</p>
          <p className="text-xl font-bold text-emerald-400">92%</p>
        </div>
      </div>
    </div>
  );
};

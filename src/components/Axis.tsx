import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Target, Zap, Loader2, Sparkles, History, Trash2, CheckCircle2, AlertTriangle, Scale, ChevronRight, Activity, Dumbbell, Wallet, Shield, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { GoogleGenAI, Type } from "@google/genai";
import { useGamification } from './GamificationContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Decision {
  id: string;
  title: string;
  analysis: any;
  created_at: string;
}

export const Axis: React.FC<{ t: any }> = ({ t }) => {
  const { userData } = useUser();
  const { dailyProgress } = useGamification();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<Decision[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDecisionEngine, setShowDecisionEngine] = useState(false);

  const axisT = t.axis;

  const [areaProgress, setAreaProgress] = useState({
    body: 0,
    mind: 0,
    financial: 0
  });

  useEffect(() => {
    fetchHistory();
    fetchAreaStats();
  }, [userData?.id]);

  const fetchAreaStats = async () => {
    if (!userData?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Body Progress (Exercises)
      const { data: exercises } = await supabase
        .from('exercise_history')
        .select('id')
        .eq('user_id', userData.id)
        .gte('completed_at', today + 'T00:00:00Z');
      
      const bodyProgress = exercises?.length ? 100 : 0; // Simple: 1 exercise = 100% for the day

      // 2. Mind Progress (Habits in Mind category)
      const { data: mindHabits } = await supabase
        .from('habits')
        .select('completion_history')
        .eq('user_id', userData.id)
        .or('category.eq.Mind,category.eq.Mente,category.eq.mind,category.eq.mente');
      
      let mindProgress = 0;
      if (mindHabits && mindHabits.length > 0) {
        const completed = mindHabits.filter(h => h.completion_history?.includes(today)).length;
        mindProgress = Math.round((completed / mindHabits.length) * 100);
      }

      // 3. Financial Progress (Based on daily budget vs expenses)
      const { data: budgets } = await supabase
        .from('finance_budgets')
        .select('limit_amount, current_amount')
        .eq('user_id', userData.id);
      
      let financialProgress = 100; // Default to 100 if no budgets
      if (budgets && budgets.length > 0) {
        const totalLimit = budgets.reduce((acc, b) => acc + Number(b.limit_amount), 0);
        const totalCurrent = budgets.reduce((acc, b) => acc + Number(b.current_amount), 0);
        if (totalLimit > 0) {
          financialProgress = Math.max(0, Math.round(((totalLimit - totalCurrent) / totalLimit) * 100));
        }
      }

      setAreaProgress({
        body: bodyProgress,
        mind: mindProgress,
        financial: financialProgress
      });
    } catch (err) {
      console.error('Error fetching area stats:', err);
    }
  };

  const fetchHistory = async () => {
    if (!userData?.id) return;
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
      
      if (data) setHistory(data);
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching history:', error);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model,
        contents: `Analise este dilema ou decisão: "${query}". 
        Forneça uma análise estruturada EM PORTUGUÊS BRASILEIRO incluindo:
        1. Prós (lista de strings)
        2. Contras (lista de strings)
        3. Impacto a Longo Prazo (string)
        4. Alinhamento com as metas do usuário (string)
        5. Insight Neural (um conselho profundo e filosófico, string)
        6. Nível de Risco (Low, Medium, High) - Use estes valores exatos em inglês para o campo riskLevel.
        
        Considere a identidade do usuário: ${userData?.identity || 'Guerreiro da Disciplina'}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              longTermImpact: { type: Type.STRING },
              goalAlignment: { type: Type.STRING },
              neuralInsight: { type: Type.STRING },
              riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            },
            required: ["pros", "cons", "longTermImpact", "goalAlignment", "neuralInsight", "riskLevel"]
          }
        }
      });

      const analysis = JSON.parse(response.text || '{}');
      setResult(analysis);

      // Save to Supabase
      if (userData?.id) {
        await supabase.from('decisions').insert([{
          user_id: userData.id,
          title: query,
          analysis: analysis
        }]);
        fetchHistory();
      }
    } catch (error) {
      console.error('Error analyzing decision:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteDecision = async (id: string) => {
    try {
      await supabase.from('decisions').delete().eq('id', id);
      fetchHistory();
    } catch (err) {
      console.error('Error deleting decision:', err);
    }
  };

  // Real data for areas
  const areas = useMemo(() => [
    { 
      id: 'body', 
      label: axisT.areas.body, 
      progress: areaProgress.body, 
      icon: <Dumbbell size={20} />, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    { 
      id: 'mind', 
      label: axisT.areas.mind, 
      progress: areaProgress.mind, 
      icon: <Brain size={20} />, 
      color: 'text-zenith-cyan', 
      bg: 'bg-zenith-cyan/10',
      border: 'border-zenith-cyan/20'
    },
    { 
      id: 'discipline', 
      label: axisT.areas.discipline, 
      progress: dailyProgress, 
      icon: <Shield size={20} />, 
      color: 'text-zenith-scarlet', 
      bg: 'bg-zenith-scarlet/10',
      border: 'border-zenith-scarlet/20'
    },
    { 
      id: 'financial', 
      label: axisT.areas.financial, 
      progress: areaProgress.financial, 
      icon: <Wallet size={20} />, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
  ], [axisT, dailyProgress, areaProgress]);

  const overallProgress = useMemo(() => {
    return Math.round(areas.reduce((acc, curr) => acc + curr.progress, 0) / areas.length);
  }, [areas]);

  const dynamicQuote = useMemo(() => {
    const lowestArea = [...areas].sort((a, b) => a.progress - b.progress)[0];
    
    if (lowestArea.progress < 30) {
      switch (lowestArea.id) {
        case 'body': return axisT.quotes.body;
        case 'mind': return axisT.quotes.mind;
        case 'discipline': return axisT.quotes.discipline;
        case 'financial': return axisT.quotes.financial;
        default: return axisT.quotes.default;
      }
    }
    
    if (overallProgress > 80) {
      return axisT.quotes.elite;
    }
    
    return axisT.quotes.continuous;
  }, [areas, overallProgress, axisT.quotes]);

  return (
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen bg-zenith-black text-zenith-text-primary">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center border border-zenith-scarlet/20">
              <Scale size={20} className="text-zenith-scarlet" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight uppercase leading-none text-zenith-text-primary">{axisT.title}</h1>
              <p className="text-[10px] font-bold text-zenith-text-tertiary uppercase tracking-widest">{axisT.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowDecisionEngine(!showDecisionEngine)}
            className={`p-2 rounded-xl border transition-all ${
              showDecisionEngine 
                ? 'bg-zenith-scarlet text-white border-zenith-scarlet shadow-[0_0_15px_rgba(255,36,0,0.3)]' 
                : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-primary'
            }`}
          >
            <Brain size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showDecisionEngine ? (
          <motion.div
            key="decision-engine"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary">{axisT.decisionEngine}</h3>
              <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-bold uppercase tracking-widest text-zenith-scarlet flex items-center space-x-1">
                <History size={12} />
                <span>{axisT.history}</span>
              </button>
            </div>

            {showHistory ? (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="glass-card p-12 text-center space-y-4 border-zenith-border-primary bg-zenith-surface-1">
                    <div className="w-12 h-12 rounded-full bg-zenith-surface-2 flex items-center justify-center mx-auto">
                      <History size={20} className="text-zenith-text-tertiary" />
                    </div>
                    <p className="text-xs text-zenith-text-tertiary uppercase tracking-widest font-bold">{axisT.noHistory}</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="glass-card p-4 border-zenith-border-primary bg-zenith-surface-1 group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-zenith-text-primary">{item.title}</p>
                          <p className="text-[10px] text-zenith-text-tertiary uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              setResult(item.analysis);
                              setQuery(item.title);
                              setShowHistory(false);
                            }}
                            className="p-2 rounded-lg bg-zenith-surface-2 text-zenith-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight size={14} />
                          </button>
                          <button 
                            onClick={() => deleteDecision(item.id)}
                            className="p-2 rounded-lg bg-zenith-scarlet/10 text-zenith-scarlet opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={axisT.placeholder}
                      className="w-full h-32 bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl p-4 text-sm text-zenith-text-primary placeholder:text-zenith-text-tertiary focus:outline-none focus:border-zenith-scarlet/50 transition-all resize-none shadow-sm"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                      <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-widest">{t.common.neuralLinkActive}</span>
                      <div className="w-1.5 h-1.5 bg-zenith-cyan rounded-full animate-pulse" />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={!query.trim() || isAnalyzing}
                    className="w-full py-4 bg-zenith-scarlet text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zenith-crimson transition-all shadow-[0_0_20px_rgba(255,36,0,0.2)]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{axisT.analyzing}</span>
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        <span>{axisT.analyze}</span>
                      </>
                    )}
                  </button>
                </div>

                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-center">
                      <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center space-x-2 ${
                        result.riskLevel === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        result.riskLevel === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        'bg-zenith-scarlet/10 border-zenith-scarlet/20 text-zenith-scarlet'
                      }`}>
                        <AlertTriangle size={12} />
                        <span>{axisT.riskLevel}: {
                          result.riskLevel === 'Low' ? axisT.low :
                          result.riskLevel === 'Medium' ? axisT.medium :
                          axisT.high
                        }</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass-card p-5 border-emerald-500/10 bg-emerald-500/[0.02] space-y-4">
                        <div className="flex items-center space-x-2 text-emerald-500">
                          <CheckCircle2 size={14} />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.pros}</h3>
                        </div>
                        <ul className="space-y-2">
                          {result.pros.map((pro: string, i: number) => (
                            <li key={i} className="text-xs text-zenith-text-secondary flex items-start space-x-2">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="glass-card p-5 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02] space-y-4">
                        <div className="flex items-center space-x-2 text-zenith-scarlet">
                          <AlertTriangle size={14} />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.cons}</h3>
                        </div>
                        <ul className="space-y-2">
                          {result.cons.map((con: string, i: number) => (
                            <li key={i} className="text-xs text-zenith-text-secondary flex items-start space-x-2">
                              <span className="w-1 h-1 rounded-full bg-zenith-scarlet mt-1.5 shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="glass-card p-6 border-zenith-border-primary bg-zenith-surface-1 space-y-4">
                        <div className="flex items-center space-x-2 text-zenith-cyan">
                          <Target size={14} />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.impact}</h3>
                        </div>
                        <p className="text-xs text-zenith-text-secondary leading-relaxed">{result.longTermImpact}</p>
                      </div>

                      <div className="glass-card p-6 border-zenith-border-primary bg-zenith-surface-1 space-y-4">
                        <div className="flex items-center space-x-2 text-amber-500">
                          <Zap size={14} />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.alignment}</h3>
                        </div>
                        <p className="text-xs text-zenith-text-secondary leading-relaxed">{result.goalAlignment}</p>
                      </div>

                      <div className="glass-card p-8 border-zenith-scarlet/20 bg-gradient-to-br from-zenith-scarlet/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Brain size={40} className="text-zenith-scarlet" />
                        </div>
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center space-x-2 text-zenith-scarlet">
                            <Sparkles size={14} />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.insight}</h3>
                          </div>
                          <p className="text-sm text-zenith-text-primary font-medium italic leading-relaxed">
                            "{result.neuralInsight}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Overall Progress */}
            <section className="glass-card p-8 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Activity size={120} className="text-zenith-scarlet" />
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-display font-bold text-zenith-text-primary uppercase tracking-tight">{overallProgress}%</h2>
                    <p className="text-[10px] font-bold text-zenith-text-tertiary uppercase tracking-[0.2em]">{axisT.overallProgress}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-zenith-scarlet/10 flex items-center justify-center border border-zenith-scarlet/20">
                    <Target size={24} className="text-zenith-scarlet" />
                  </div>
                </div>

                <div className="h-2 bg-zenith-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    className="h-full bg-zenith-scarlet shadow-[0_0_15px_rgba(255,36,0,0.4)]"
                  />
                </div>

                <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-zenith-text-tertiary">
                  <span>{axisT.evolutionLevel} 04</span>
                  <span>{axisT.nextMilestone}: 85%</span>
                </div>
              </div>
            </section>

            {/* Life Areas Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary">{axisT.lifeAreas}</h3>
                <Sparkles size={12} className="text-zenith-scarlet" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {areas.map((area) => (
                  <motion.div
                    key={area.id}
                    whileHover={{ y: -4 }}
                    className="glass-card p-5 border-zenith-border-primary bg-zenith-surface-1 space-y-4 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-xl ${area.bg} ${area.border} flex items-center justify-center ${area.color} transition-all group-hover:scale-110`}>
                        {area.icon}
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-zenith-text-primary">
                        <span>{area.progress}%</span>
                        <ArrowUpRight size={10} className="text-zenith-text-tertiary" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">{area.label}</p>
                      <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${area.progress}%` }}
                          className={`h-full ${area.progress > 0 ? area.color.replace('text-', 'bg-') : 'bg-zenith-text-tertiary/20'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Neural Insight Quote */}
            <section className="glass-card p-6 border-zenith-border-primary bg-zenith-surface-1 border-l-4 border-l-zenith-scarlet">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <Brain size={16} className="text-zenith-scarlet" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-zenith-text-primary font-medium italic leading-relaxed">
                    "{dynamicQuote}"
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-zenith-text-tertiary">— Zenith Neural Link</p>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


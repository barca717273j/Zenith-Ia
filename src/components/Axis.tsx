import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Target, Zap, Loader2, Sparkles, History, Trash2, CheckCircle2, AlertTriangle, Scale, ChevronRight, Activity, Dumbbell, Wallet, Shield, ArrowUpRight, Crown, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { askAI } from '../services/gemini';
import { useGamification } from './GamificationContext';

interface Decision {
  id: string;
  title: string;
  analysis: any;
  created_at: string;
}

export const Axis: React.FC<{ t: any; onBack?: () => void }> = ({ t, onBack }) => {
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
      const prompt = `Analise este dilema ou decisão: "${query}". 
        Forneça uma análise estruturada EM PORTUGUÊS BRASILEIRO incluindo:
        1. Prós (lista de strings)
        2. Contras (lista de strings)
        3. Impacto a Longo Prazo (string)
        4. Alinhamento com as metas do usuário (string)
        5. Insight Neural (um conselho profundo e filosófico, string)
        6. Nível de Risco (Low, Medium, High) - Use estes valores exatos em inglês para o campo riskLevel.
        
        Considere a identidade do usuário: ${userData?.identity || 'Guerreiro da Disciplina'}.`;

      const analysis = await askAI({
        prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            pros: { type: "ARRAY", items: { type: "STRING" } },
            cons: { type: "ARRAY", items: { type: "STRING" } },
            longTermImpact: { type: "STRING" },
            goalAlignment: { type: "STRING" },
            neuralInsight: { type: "STRING" },
            riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"] }
          },
          required: ["pros", "cons", "longTermImpact", "goalAlignment", "neuralInsight", "riskLevel"]
        }
      });

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
      color: 'text-zenit-cyan', 
      bg: 'bg-zenit-cyan/10',
      border: 'border-zenit-cyan/20'
    },
    { 
      id: 'discipline', 
      label: axisT.areas.discipline, 
      progress: dailyProgress, 
      icon: <Shield size={20} />, 
      color: 'text-zenit-scarlet', 
      bg: 'bg-zenit-scarlet/10',
      border: 'border-zenit-scarlet/20'
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
    <div className="p-6 space-y-12 pb-56 max-w-2xl mx-auto min-h-screen bg-zenit-black text-zenit-text-primary relative overflow-hidden">
      {/* Living Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-zenit-scarlet/5 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-zenit-scarlet/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <header className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-12 h-12 flex items-center justify-center bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-95"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="w-16 h-16 rounded-[2rem] bg-zenit-surface-1/40 backdrop-blur-xl border border-zenit-border-primary flex items-center justify-center shadow-2xl">
              <Scale size={32} className="text-zenit-scarlet" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-medium tracking-tight uppercase italic leading-none text-zenit-text-primary">Nexus <span className="text-zenit-scarlet">Neural</span></h1>
              <div className="flex items-center space-x-3 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-pulse" />
                 <p className="text-[10px] font-bold text-zenit-text-tertiary uppercase tracking-[0.45em] opacity-60">{axisT.subtitle}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowDecisionEngine(!showDecisionEngine)}
            className={`w-14 h-14 rounded-[1.5rem] transition-all duration-500 flex items-center justify-center border ${
              showDecisionEngine 
                ? 'bg-zenit-scarlet border-zenit-scarlet text-white shadow-[0_10px_30px_rgba(255,0,0,0.3)]' 
                : 'bg-zenit-surface-1/40 backdrop-blur-xl border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-text-primary'
            }`}
          >
            <Brain size={24} className={`transition-transform duration-700 ${showDecisionEngine ? 'scale-110 rotate-12' : ''}`} />
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
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-5 bg-zenit-accent rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-zenit-text-primary italic">{axisT.decisionEngine}</h3>
              </div>
              <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-bold uppercase tracking-[0.3em] text-zenit-accent hover:text-zenit-crimson transition-colors flex items-center space-x-2">
                <History size={14} />
                <span>{axisT.history}</span>
              </button>
            </div>

            {showHistory ? (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="p-16 rounded-[3rem] text-center space-y-6 bg-zenit-surface-1/40 backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-full bg-zenit-surface-2 flex items-center justify-center mx-auto">
                      <History size={32} className="text-zenit-text-tertiary opacity-30" />
                    </div>
                    <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold">{axisT.noHistory}</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="relative p-6 rounded-[2rem] bg-zenit-surface-1 transition-all overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-zenit-text-primary">{item.title}</p>
                          <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-bold opacity-60">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => {
                              setResult(item.analysis);
                              setQuery(item.title);
                              setShowHistory(false);
                            }}
                            className="w-10 h-10 rounded-xl bg-zenit-surface-2 text-zenit-text-primary flex items-center justify-center active:bg-zenit-accent active:text-white transition-all min-h-[44px] min-w-[44px]"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button 
                            onClick={() => deleteDecision(item.id)}
                            className="w-10 h-10 rounded-xl bg-zenit-accent/10 text-zenit-accent flex items-center justify-center active:bg-zenit-accent active:text-white transition-all min-h-[44px] min-w-[44px]"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-zenit-accent/20 to-zenit-crimson/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Descreva sua decisão ou dilema aqui..."
                      className="relative w-full h-40 bg-zenit-surface-1/80 backdrop-blur-xl rounded-[2rem] p-6 text-sm text-zenit-text-primary placeholder:text-zenit-text-tertiary focus:outline-none focus:border-zenit-accent/50 transition-all resize-none"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center space-x-3">
                      <span className="text-[9px] font-bold text-zenit-text-tertiary uppercase tracking-[0.3em] opacity-60">{t.common.neuralLinkActive}</span>
                      <div className="w-2 h-2 bg-zenit-cyan rounded-full animate-pulse" />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={!query.trim() || isAnalyzing}
                    className="w-full py-5 bg-zenit-accent text-white rounded-full font-bold uppercase tracking-[0.4em] text-xs flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,59,59,0.3)]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Brain size={18} />
                        <span>Analisar Decisão</span>
                      </>
                    )}
                  </button>
                </div>

                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="space-y-10"
                  >
                    <div className="flex justify-center">
                      <div className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] flex items-center space-x-3 ${
                        result.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                        result.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-zenit-accent/10 text-zenit-accent'
                      }`}>
                        <AlertTriangle size={14} />
                        <span>{axisT.riskLevel}: {
                          result.riskLevel === 'Low' ? axisT.low :
                          result.riskLevel === 'Medium' ? axisT.medium :
                          axisT.high
                        }</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative p-8 rounded-[2.5rem] bg-emerald-500/[0.02] space-y-6 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <CheckCircle2 size={60} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center space-x-3 text-emerald-500 relative z-10">
                          <CheckCircle2 size={18} />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] italic">{axisT.pros}</h3>
                        </div>
                        <ul className="space-y-4 relative z-10">
                          {result.pros.map((pro: string, i: number) => (
                            <li key={i} className="text-xs text-zenit-text-secondary flex items-start space-x-3 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="relative p-8 rounded-[2.5rem] bg-zenit-accent/[0.02] space-y-6 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <AlertTriangle size={60} className="text-zenit-accent" />
                        </div>
                        <div className="flex items-center space-x-3 text-zenit-accent relative z-10">
                          <AlertTriangle size={18} />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] italic">{axisT.cons}</h3>
                        </div>
                        <ul className="space-y-4 relative z-10">
                          {result.cons.map((con: string, i: number) => (
                            <li key={i} className="text-xs text-zenit-text-secondary flex items-start space-x-3 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-zenit-accent mt-1.5 shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 rounded-[2.5rem] bg-zenit-surface-1 space-y-6 group transition-colors">
                        <div className="flex items-center space-x-3 text-zenit-cyan">
                          <Target size={18} />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] italic">{axisT.impact}</h3>
                        </div>
                        <p className="text-sm text-zenit-text-secondary leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{result.longTermImpact}</p>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-zenit-surface-1 space-y-6 group transition-colors">
                        <div className="flex items-center space-x-3 text-amber-500">
                          <Zap size={18} />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] italic">{axisT.alignment}</h3>
                        </div>
                        <p className="text-sm text-zenit-text-secondary leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{result.goalAlignment}</p>
                      </div>

                      <div className="relative p-10 rounded-[3rem] bg-zenit-surface-1 border border-zenit-accent/30 shadow-[0_0_30px_rgba(255,59,59,0.1)] overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                          <Brain size={120} className="text-zenit-accent" />
                        </div>
                        <div className="space-y-6 relative z-10">
                          <div className="flex items-center space-x-3 text-zenit-accent">
                            <Sparkles size={20} className="animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.4em] italic">Recomendação Final</h3>
                          </div>
                          <p className="text-lg text-zenit-text-primary font-medium italic leading-relaxed tracking-tight">
                            "{result.neuralInsight}"
                          </p>
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-[1px] bg-zenit-accent/40" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zenit-text-tertiary">Zenit Neural Recommendation</span>
                          </div>
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
            <section className="relative p-10 rounded-[3rem] bg-zenit-surface-1/60 backdrop-blur-xl border border-zenit-border-primary overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                <Activity size={180} className="text-zenit-scarlet" />
              </div>
              
              <div className="space-y-10 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <h2 className="text-7xl font-display font-medium text-zenit-text-primary uppercase tracking-tighter italic leading-none">{overallProgress}%</h2>
                    <div className="flex items-center space-x-3">
                       <div className="w-1 h-3 bg-zenit-scarlet rounded-full" />
                       <p className="text-[10px] font-black text-zenit-text-tertiary uppercase tracking-[0.5em]">{axisT.overallProgress}</p>
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-[2.5rem] bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center shadow-xl">
                    <Target size={36} className="text-zenit-scarlet" />
                  </div>
                </div>

                <div className="relative h-2 bg-zenit-surface-2 rounded-full overflow-hidden border border-zenit-border-primary/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    className="h-full bg-gradient-to-r from-zenit-scarlet/40 to-zenit-scarlet"
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary">
                  <span className="flex items-center space-x-2 text-zenit-scarlet bg-zenit-scarlet/5 px-4 py-2 rounded-full border border-zenit-scarlet/10">
                    <Crown size={12} />
                    <span>Evolution Level 04</span>
                  </span>
                  <span className="opacity-40">{axisT.nextMilestone}: 85%</span>
                </div>
              </div>
            </section>

            {/* Life Areas Grid */}
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-6 bg-zenit-scarlet rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-zenit-text-primary italic">{axisT.lifeAreas}</h3>
                </div>
                <Sparkles size={16} className="text-zenit-scarlet animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {areas.map((area) => (
                  <motion.div
                    key={area.id}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.96 }}
                    className="relative p-8 rounded-[2.5rem] bg-zenit-surface-1/60 backdrop-blur-xl border border-zenit-border-primary transition-all duration-500 overflow-hidden shadow-xl"
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div className={`w-14 h-14 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center text-zenit-text-tertiary transition-all duration-500 group-hover:text-zenit-scarlet`}>
                        {React.cloneElement(area.icon as any, { size: 24 })}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-black text-zenit-text-primary italic font-mono">
                        <span>{area.progress}%</span>
                        <ArrowUpRight size={14} className="text-zenit-text-tertiary opacity-40 shrink-0" />
                      </div>
                    </div>

                    <div className="space-y-5 mt-10 relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary opacity-60 leading-tight">{area.label}</p>
                      <div className="relative h-1 bg-zenit-surface-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${area.progress}%` }}
                          className={`h-full ${area.progress > 0 ? (area.id === 'discipline' ? 'bg-zenit-scarlet' : 'bg-zenit-text-tertiary/60') : 'bg-zenit-text-tertiary/20'}`}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Neural Insight Quote */}
            <section className="relative p-8 rounded-[2.5rem] bg-zenit-surface-1/60 backdrop-blur-xl border-l-4 border-l-zenit-accent overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain size={80} className="text-zenit-accent" />
              </div>
              <div className="flex items-start space-x-6 relative z-10">
                <div className="mt-1 p-3 rounded-xl bg-zenit-accent/10">
                  <Brain size={20} className="text-zenit-accent" />
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-zenit-text-primary font-medium italic leading-relaxed opacity-90">
                    "{dynamicQuote}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-[1px] bg-zenit-accent/30" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary">Zenit Neural Link</p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


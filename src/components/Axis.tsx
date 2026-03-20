import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Target, Zap, Loader2, Sparkles, History, Trash2, CheckCircle2, AlertTriangle, Scale, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useUser } from '../contexts/UserContext';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Decision {
  id: string;
  title: string;
  analysis: any;
  created_at: string;
}

export const Axis: React.FC<{ t: any }> = ({ t }) => {
  const { userData } = useUser();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<Decision[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const axisT = t.axis;

  useEffect(() => {
    fetchHistory();
  }, [userData?.id]);

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
        contents: `Analyze this decision/dilemma: "${query}". 
        Provide a structured analysis including:
        1. Pros (list of strings)
        2. Cons (list of strings)
        3. Long-term Impact (string)
        4. Alignment with user goals (string)
        5. Neural Insight (a deep, philosophical advice, string)
        6. Risk Level (Low, Medium, High)
        
        Consider the user's identity: ${userData?.identity || 'Discipline Warrior'}.`,
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

  return (
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center border border-zenith-scarlet/20">
              <Scale size={20} className="text-zenith-scarlet" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight uppercase leading-none">{axisT.title}</h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{axisT.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <History size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{axisT.history}</h3>
              <button onClick={() => setShowHistory(false)} className="text-[10px] font-bold uppercase tracking-widest text-zenith-scarlet">Voltar</button>
            </div>
            
            {history.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-4 border-white/5 bg-white/[0.02]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <History size={20} className="text-white/20" />
                </div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-bold">{axisT.noHistory}</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="glass-card p-4 border-white/5 bg-white/[0.02] group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white/80">{item.title}</p>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setResult(item.analysis);
                          setQuery(item.title);
                          setShowHistory(false);
                        }}
                        className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
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
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Input Section */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={axisT.placeholder}
                  className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-zenith-scarlet/50 transition-all resize-none"
                />
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Neural Link Active</span>
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

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Risk Badge */}
                  <div className="flex justify-center">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center space-x-2 ${
                      result.riskLevel === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                      result.riskLevel === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-zenith-scarlet/10 border-zenith-scarlet/20 text-zenith-scarlet'
                    }`}>
                      <AlertTriangle size={12} />
                      <span>Risk Level: {result.riskLevel}</span>
                    </div>
                  </div>

                  {/* Pros & Cons Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-5 border-emerald-500/10 bg-emerald-500/[0.02] space-y-4">
                      <div className="flex items-center space-x-2 text-emerald-500">
                        <CheckCircle2 size={14} />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.pros}</h3>
                      </div>
                      <ul className="space-y-2">
                        {result.pros.map((pro: string, i: number) => (
                          <li key={i} className="text-xs text-white/60 flex items-start space-x-2">
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
                          <li key={i} className="text-xs text-white/60 flex items-start space-x-2">
                            <span className="w-1 h-1 rounded-full bg-zenith-scarlet mt-1.5 shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Deep Analysis */}
                  <div className="space-y-4">
                    <div className="glass-card p-6 border-white/5 bg-white/[0.02] space-y-4">
                      <div className="flex items-center space-x-2 text-zenith-cyan">
                        <Target size={14} />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.impact}</h3>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{result.longTermImpact}</p>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-white/[0.02] space-y-4">
                      <div className="flex items-center space-x-2 text-amber-500">
                        <Zap size={14} />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.alignment}</h3>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{result.goalAlignment}</p>
                    </div>

                    {/* Neural Insight */}
                    <div className="glass-card p-8 border-zenith-scarlet/20 bg-gradient-to-br from-zenith-scarlet/5 to-transparent relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Brain size={40} className="text-zenith-scarlet" />
                      </div>
                      <div className="space-y-4 relative z-10">
                        <div className="flex items-center space-x-2 text-zenith-scarlet">
                          <Sparkles size={14} />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{axisT.insight}</h3>
                        </div>
                        <p className="text-sm text-white font-medium italic leading-relaxed">
                          "{result.neuralInsight}"
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown, Sparkles, Zap, MessageSquare, X, Send, Bot } from 'lucide-react';
import { supabase } from '../supabase';
import { GoogleGenAI } from "@google/genai";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
}

interface FinanceTrackerProps {
  userData: any;
  t: any;
}

export const FinanceTracker: React.FC<FinanceTrackerProps> = ({ userData, t }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    fetchTransactions();
  }, [userData]);

  const fetchTransactions = async () => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .eq('user_id', userData.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      const { error } = await supabase
        .from('finance')
        .insert([{
          user_id: userData.id,
          description,
          amount: parseFloat(amount),
          type,
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;
      
      setDescription('');
      setAmount('');
      setShowAddModal(false);
      fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const askFinanceAI = async () => {
    if (!aiMessage) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise as seguintes transações financeiras e responda à pergunta do usuário: "${aiMessage}". 
        Transações: ${JSON.stringify(transactions)}. 
        Responda de forma curta, profissional e útil, como um mentor financeiro premium.`,
      });
      const response = await model;
      setAiResponse(response.text || 'Desculpe, não consegui analisar seus dados agora.');
    } catch (err) {
      console.error('AI Error:', err);
      setAiResponse('Erro ao conectar com o Mentor Financeiro.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display tracking-tighter uppercase leading-none">Capital</h1>
          <div className="flex items-center space-x-2">
            <div className="h-1 w-12 bg-zenith-electric-blue rounded-full" />
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Fluxo de Ativos</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIChat(true)}
            className="w-12 h-12 rounded-2xl bg-zenith-electric-blue/10 border border-zenith-electric-blue/20 flex items-center justify-center text-zenith-electric-blue hover:bg-zenith-electric-blue/20 transition-all"
          >
            <Bot size={24} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-zenith-electric-blue transition-all group"
          >
            <Plus size={24} className="text-white/60 group-hover:text-zenith-electric-blue transition-colors" />
          </motion.button>
        </div>
      </header>

      {/* Balance Card */}
      <div className="glass-card p-8 border-white/10 bg-white/[0.02] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet size={100} />
        </div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-zenith-electric-blue/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Zap size={12} className="text-zenith-electric-blue" />
              <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold">Saldo Consolidado</p>
            </div>
            <h2 className="text-4xl font-display font-bold tracking-tighter text-white">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Entradas</p>
              <p className="text-lg font-bold text-zenith-cyan tracking-tight">R$ {totalIncome.toLocaleString('pt-BR')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Saídas</p>
              <p className="text-lg font-bold text-white/40 tracking-tight">R$ {totalExpense.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-zenith-electric-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <PiggyBank size={32} className="text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Nenhum registro financeiro</h3>
            <p className="text-sm text-white/40 max-w-[200px] mx-auto">Comece adicionando seu primeiro gasto ou receita para ativar o monitoramento.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest"
          >
            Adicionar Registro
          </button>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center space-x-3">
            <TrendingUp size={18} className="text-white/40" />
            <h3 className="text-xs font-display font-bold text-white/60 uppercase tracking-[0.2em]">Fluxo Recente</h3>
          </div>
          <div className="space-y-4">
            {transactions.map((t) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-5 flex items-center justify-between border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    t.type === 'income' 
                      ? 'bg-zenith-cyan/10 text-zenith-cyan border-zenith-cyan/20' 
                      : 'bg-white/5 text-white/20 border-white/10'
                  }`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">{t.description}</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-0.5">{t.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold tracking-tighter ${t.type === 'income' ? 'text-white' : 'text-white/40'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-8 space-y-8 bg-zenith-dark border-white/10"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold uppercase tracking-tighter">Novo Registro</h3>
                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${type === 'income' ? 'bg-zenith-cyan text-black' : 'text-white/40'}`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                  >
                    Despesa
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold ml-1">Descrição</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all"
                      placeholder="Ex: Freelance, Aluguel..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold ml-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full btn-primary py-4 text-[10px] uppercase tracking-[0.3em]">
                  Salvar Registro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIChat && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="glass-card w-full max-w-md h-[80vh] flex flex-col bg-zenith-dark border-white/10"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zenith-electric-blue/5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-zenith-electric-blue/20 flex items-center justify-center text-zenith-electric-blue">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest">Mentor Financeiro</h3>
                    <p className="text-[9px] text-zenith-electric-blue font-bold uppercase tracking-widest">Análise Neural Ativa</p>
                  </div>
                </div>
                <button onClick={() => setShowAIChat(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {aiResponse ? (
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-lg bg-zenith-electric-blue/20 flex items-center justify-center text-zenith-electric-blue flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 text-sm text-white/80 leading-relaxed">
                      {aiResponse}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <Sparkles className="mx-auto text-zenith-electric-blue/40" size={32} />
                    <p className="text-xs text-white/30 uppercase tracking-widest leading-relaxed">
                      Pergunte sobre seus gastos, peça sugestões de economia ou análise de orçamento.
                    </p>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex items-center space-x-3 text-zenith-electric-blue">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Processando dados...</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="relative">
                  <input 
                    type="text"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && askFinanceAI()}
                    placeholder="Como está meu orçamento este mês?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all"
                  />
                  <button 
                    onClick={askFinanceAI}
                    disabled={isAiLoading || !aiMessage}
                    className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-zenith-electric-blue text-white flex items-center justify-center disabled:opacity-50 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GoalCard: React.FC<{ icon: React.ReactNode; label: string; current: number; target: number; color: 'cyan' | 'purple' }> = ({ icon, label, current, target, color }) => {
  const progress = (current / target) * 100;
  const accentColor = color === 'cyan' ? 'text-zenith-cyan' : 'text-zenith-electric-blue';
  const barColor = color === 'cyan' ? 'bg-zenith-cyan' : 'bg-zenith-electric-blue';
  const glowColor = color === 'cyan' ? 'shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card p-6 min-w-[220px] space-y-5 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${accentColor} border border-white/10`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-white tracking-tight">{label}</p>
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">R$ {current} / R$ {target}</p>
          <span className={`text-[10px] font-mono font-bold ${accentColor}`}>{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${barColor} ${glowColor} rounded-full`}
        />
      </div>
    </motion.div>
  );
};

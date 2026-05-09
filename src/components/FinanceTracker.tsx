import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown, Sparkles, Zap, MessageSquare, X, Send, Bot, Activity, Timer, BarChart3, PieChart, ArrowLeft, Cpu, Terminal, Target } from 'lucide-react';
import { askAI } from '../services/gemini';
import { supabase } from '../lib/supabase';
import { Language } from '../translations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';
import Markdown from 'react-markdown';

import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS, SubscriptionTier } from '../types';
import { Lock } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon?: any;
}

interface FinanceTrackerProps {
  t: any;
  language: Language;
  setAppTab: (tab: string) => void;
}

export const FinanceTracker: React.FC<FinanceTrackerProps & { onBack: () => void }> = ({ t, language, setAppTab, onBack }) => {
  const { userData } = useUser();
  const tier = userData?.subscription_tier || 'basic';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const formatCurrency = (amount: number) => {
    const config: Record<Language, { locale: string, currency: string }> = {
      'en': { locale: 'en-US', currency: 'USD' },
      'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
      'pt-PT': { locale: 'pt-PT', currency: 'EUR' },
      'fr': { locale: 'fr-FR', currency: 'EUR' },
      'es': { locale: 'es-ES', currency: 'EUR' },
      'ja': { locale: 'ja-JP', currency: 'JPY' }
    };

    const { locale, currency } = config[language] || config['en'];
    return amount.toLocaleString(locale, { style: 'currency', currency });
  };
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'budget' | 'goals'>('flow');
  
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');

  // Remove access check as requested to make it free
  useEffect(() => {
    if (userData?.id) {
      fetchTransactions();
      fetchBudgets();
      fetchGoals();
    }
  }, [userData]);

  /* 
    The premium lock screen block has been removed to make all finance 
    functionalities free for all users as requested.
  */

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const fetchTransactions = async () => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finances')
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

  const fetchBudgets = async () => {
    if (!userData?.id) return;
    try {
      const { data, error } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('user_id', userData.id);
      if (error) throw error;
      
      const mappedBudgets: Budget[] = (data || []).map(b => ({
        id: b.id,
        category: b.category,
        limit: Number(b.limit_amount),
        spent: Number(b.current_amount)
      }));
      
      setBudgets(mappedBudgets);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setBudgets([]);
    }
  };

  const fetchGoals = async () => {
    if (!userData?.id) return;
    try {
      const { data, error } = await supabase
        .from('finance_goals')
        .select('*')
        .eq('user_id', userData.id);
      if (error) throw error;

      const mappedGoals: Goal[] = (data || []).map(g => ({
        id: g.id,
        name: g.name,
        target: Number(g.target_amount),
        current: Number(g.current_amount),
        icon: null // Default icon if not in DB
      }));

      setGoals(mappedGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setGoals([]);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { data: transaction } = await supabase
        .from('finances')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // If it was an expense with a category, decrease the budget spent amount
      if (transaction && transaction.type === 'expense' && transaction.category) {
        const { data: budget } = await supabase
          .from('finance_budgets')
          .select('*')
          .eq('user_id', userData.id)
          .eq('category', transaction.category)
          .single();

        if (budget) {
          await supabase
            .from('finance_budgets')
            .update({ current_amount: Math.max(0, Number(budget.current_amount) - Number(transaction.amount)) })
            .eq('id', budget.id);
          fetchBudgets();
        }
      }

      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finance_budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finance_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      const amountVal = parseFloat(amount);
      const { error } = await supabase
        .from('finances')
        .insert([{
          user_id: userData.id,
          title: description,
          description: '',
          amount: amountVal,
          type,
          category: category || null,
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      // Update budget if it's an expense and has a category
      if (type === 'expense' && category) {
        const { data: budget } = await supabase
          .from('finance_budgets')
          .select('*')
          .eq('user_id', userData.id)
          .eq('category', category)
          .single();

        if (budget) {
          await supabase
            .from('finance_budgets')
            .update({ current_amount: Number(budget.current_amount) + amountVal })
            .eq('id', budget.id);
          fetchBudgets();
        }
      }
      
      setDescription('');
      setAmount('');
      setCategory('');
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
      const financeData = {
        transactions: transactions.slice(0, 20),
        budgets,
        totalBalance: totalIncome - totalExpense,
        totalIncome: totalIncome,
        totalExpenses: totalExpense
      };

      const prompt = `Você é o Estrategista Financeiro de Elite da ZENITH. Sua missão é realizar uma auditoria neural completa e projetar um protocolo de expansão de capital.
          
          DATASET FINANCEIRO:
          ${JSON.stringify(financeData)}
          
          REQUISIÇÃO DO USUÁRIO: "${aiMessage}"
          
          FRAMEWORK DE RESPOSTA (OBRIGATÓRIO):
          1. 🧠 DIAGNÓSTICO NEURAL: Uma análise cirúrgica do comportamento financeiro atual e saúde da liquidez.
          2. 📊 MATRIZ DE PADRÕES: Identifique ineficiências críticas, vazamentos de capital e vetores de crescimento subutilizados.
          3. ⚡ PROTOCOLO DE ALAVANCAGEM: 3 ações táticas de alto impacto para otimizar o fluxo e acelerar o atingimento de metas.
          4. 🎯 PROJEÇÃO DE CENÁRIO: Simulação probabilística de 90 dias baseada na manutenção ou ajuste dos protocolos atuais.
          
          Diretrizes: Use linguagem de alta finanças e performance. Seja provocativo, analítico e focado em resultados exponenciais.`;

      const text = await askAI({ 
        prompt,
        systemInstruction: "Você é o Mentor Financeiro Supremo do ecossistema ZENITH. Sua inteligência é voltada para a otimização matemática da riqueza e a engenharia de liberdade financeira."
      });
      
      setAiResponse(text || 'Desculpe, não consegui analisar seus dados agora.');
      setAiMessage('');
    } catch (err: any) {
      console.error('AI Error:', err);
      setAiResponse(`Erro ao conectar com o Mentor Financeiro: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory || !newBudgetLimit || !userData?.id) return;
    
    try {
      const { error } = await supabase
        .from('finance_budgets')
        .insert([{
          user_id: userData.id,
          category: newBudgetCategory,
          limit_amount: parseFloat(newBudgetLimit),
          current_amount: 0
        }]);

      if (error) throw error;
      
      setNewBudgetCategory('');
      setNewBudgetLimit('');
      setShowAddBudgetModal(false);
      fetchBudgets();
    } catch (err) {
      console.error('Error adding budget:', err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !userData?.id) return;
    
    try {
      const { error } = await supabase
        .from('finance_goals')
        .insert([{
          user_id: userData.id,
          name: newGoalName,
          target_amount: parseFloat(newGoalTarget),
          current_amount: 0
        }]);

      if (error) throw error;
      
      setNewGoalName('');
      setNewGoalTarget('');
      setShowAddGoalModal(false);
      fetchGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  return (
    <div className="p-0 space-y-0 pb-56 max-w-2xl mx-auto min-h-screen bg-zenit-black selection:bg-zenit-scarlet/30">
      {/* High-End Technical Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zenit-black/80 backdrop-blur-3xl border-b border-zenit-border-primary px-6 py-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <button 
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center bg-zenit-surface-2 border border-zenit-border-secondary rounded-2xl text-zenit-text-tertiary hover:text-white hover:border-white/20 transition-all active:scale-95 group shadow-inner"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-display font-black uppercase tracking-tighter text-white italic">
                ZENITH <span className="text-zenit-scarlet drop-shadow-[0_0_8px_rgba(255,26,26,0.3)]">CAPITAL</span>
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-[1.5px] bg-zenit-scarlet/40 rounded-full" />
                <p className="text-[7.5px] text-zenit-text-tertiary font-black uppercase tracking-[0.5em] italic">Neural Wealth Hub</p>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIChat(true)}
            className="w-11 h-11 rounded-2xl bg-zenit-surface-2 border border-zenit-border-secondary flex items-center justify-center text-zenit-scarlet transition-all shadow-lg active:bg-zenit-scarlet active:text-white"
          >
            <Bot size={20} className="animate-pulse" />
          </motion.button>
        </div>
      </header>

      <div className="pt-32 px-4 space-y-10">
        {/* High-End Technical Liquidity Hub */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-10 rounded-[3.5rem] bg-zenit-surface-1/40 border border-zenit-border-primary overflow-hidden shadow-2xl group backdrop-blur-3xl"
        >
          {/* Neural Gradient Underlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,26,26,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
          
          <div className="relative z-10 flex flex-col items-center space-y-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3 px-4 py-1.5 rounded-full bg-zenit-surface-2 border border-zenit-border-primary mb-2 shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-pulse shadow-[0_0_8px_rgba(255,26,26,0.8)]" />
                <span className="text-[9px] text-white font-black uppercase tracking-[0.4em] italic">Ativos_Sincronizados</span>
              </div>
              <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.6em] font-black italic opacity-40">SALDO TOTAL DISPONÍVEL</p>
              <h2 className="text-6xl font-display font-black tracking-tight text-white italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                {formatCurrency(balance)}
              </h2>
            </div>
            
            {/* Split Flow Metrics */}
            <div className="grid grid-cols-2 w-full gap-6 p-6 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5" />
              
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-[8px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-black italic">Entradas</span>
                </div>
                <span className="text-xl font-display font-black italic text-emerald-500">{formatCurrency(totalIncome)}</span>
                <div className="w-full h-1 bg-zenit-surface-3 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3 pl-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-zenit-scarlet/10 border border-zenit-scarlet/20">
                    <ArrowDownLeft size={14} className="text-zenit-scarlet" />
                  </div>
                  <span className="text-[8px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-black italic">Saídas</span>
                </div>
                <span className="text-xl font-display font-black italic text-white">{formatCurrency(totalExpense)}</span>
                <div className="w-full h-1 bg-zenit-surface-3 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalExpense / (totalIncome || 1)) * 100}%` }}
                    className="h-full bg-zenit-scarlet shadow-[0_0_10px_rgba(255,26,26,0.4)]" 
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full gap-5">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setType('income'); setShowAddModal(true); }}
                className="flex-1 h-16 bg-zenit-surface-2 hover:bg-zenit-surface-3 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] transition-all border border-zenit-border-secondary active:scale-95 italic shadow-lg flex items-center justify-center space-x-3"
              >
                <Plus size={16} />
                <span>Fixar Receita</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setType('expense'); setShowAddModal(true); }}
                className="flex-1 h-16 bg-zenit-scarlet hover:brightness-110 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 italic shadow-[0_15px_40px_rgba(255,26,26,0.3)] border border-white/10 flex items-center justify-center space-x-3"
              >
                <CreditCard size={16} />
                <span>Lançar Gasto</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Dense Technical Tabs */}
        <div className="flex bg-zenit-surface-1 p-1.5 rounded-[1.8rem] border border-zenit-border-primary backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {(['flow', 'budget', 'goals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[8px] uppercase tracking-[0.4em] font-black rounded-[1.2rem] transition-all relative italic ${
                activeTab === tab ? 'text-zenit-black' : 'text-zenit-text-tertiary hover:text-white'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="finance-tab-active"
                  className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  style={{ borderRadius: 'inherit' }}
                />
              )}
              <span className="relative z-10 transition-colors duration-500">
                {tab === 'flow' ? 'TRANSACTIONS' : tab === 'budget' ? 'ALOCATIONS' : 'PROJECTIONS'}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Content Area - Technical Data Strips */}
        <div className="pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'flow' && (
              <motion.div 
                key="flow"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Activity size={14} className="text-zenit-scarlet" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-secondary italic">Neural Log Stream</h3>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-zenit-surface-2 border border-zenit-border-secondary text-[7px] font-mono text-zenit-text-tertiary">
                    RECORDS: {transactions.length}
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-16 rounded-[3rem] border border-dashed border-zenit-border-primary bg-zenit-surface-1/30 flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-zenit-surface-1 border border-zenit-border-primary flex items-center justify-center opacity-20">
                       <BarChart3 size={24} />
                    </div>
                    <p className="text-[10px] text-zenit-text-tertiary uppercase font-black tracking-[0.4em] italic opacity-40">Dataset Vazio</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((t_item, idx) => (
                      <motion.div 
                        key={t_item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group flex flex-col p-6 rounded-[2rem] bg-zenit-surface-1 border border-zenit-border-primary hover:border-zenit-scarlet/30 transition-all duration-500 shadow-lg relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-20 transition-opacity">
                            <span className="text-[6px] font-mono">HASH_{t_item.id.slice(0,8).toUpperCase()}</span>
                         </div>
                         
                         <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-6">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                                  t_item.type === 'income' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                    : 'bg-zenit-scarlet/10 text-zenit-scarlet border-zenit-scarlet/20'
                               }`}>
                                  {t_item.type === 'income' ? <Plus size={20} /> : <div className="w-4 h-0.5 bg-current" />}
                               </div>
                               <div>
                                  <h4 className="text-base font-black text-white italic tracking-tight uppercase group-hover:translate-x-1 transition-transform">{t_item.title}</h4>
                                  <div className="flex items-center space-x-3 mt-1.5">
                                     <span className="text-[8px] px-2 py-0.5 rounded bg-zenit-surface-2 text-zenit-text-tertiary font-black uppercase tracking-widest">{t_item.category || 'GLOBAL'}</span>
                                     <span className="text-[8px] text-zenit-text-tertiary/40 font-mono tracking-tighter">{new Date(t_item.date).toLocaleDateString()}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                               <span className={`text-xl font-display font-black italic ${t_item.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                                  {t_item.type === 'income' ? '+' : '-'} {formatCurrency(t_item.amount)}
                                </span>
                                <button 
                                  onClick={() => deleteTransaction(t_item.id)}
                                  className="text-[7px] text-zenit-text-tertiary/30 hover:text-zenit-scarlet uppercase tracking-widest font-black transition-all mt-2 opacity-0 group-hover:opacity-100"
                                >
                                  EXPURGAR_DADO
                                </button>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'budget' && (
              <motion.div 
                key="budget"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-4 mb-6">
                   <div className="flex items-center space-x-3">
                      <BarChart3 size={14} className="text-zenit-scarlet" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-secondary italic">Neural Budget Clusters</h3>
                   </div>
                   <button 
                     onClick={() => setShowAddBudgetModal(true)}
                     className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-scarlet/20 hover:bg-zenit-scarlet hover:text-white transition-all shadow-lg active:scale-90"
                   >
                     <Plus size={18} />
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {budgets.map((b, idx) => {
                    const progress = (b.spent / b.limit) * 100;
                    const isOver = progress > 100;
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-[3rem] bg-zenit-surface-1 border border-zenit-border-primary hover:border-zenit-scarlet/40 transition-all duration-700 relative overflow-hidden group shadow-xl"
                      >
                         <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="space-y-2">
                               <h4 className="text-xl font-display font-black text-white italic uppercase tracking-tighter">{b.category}</h4>
                               <div className="flex items-center space-x-3">
                                  <div className={`w-2 h-2 rounded-full ${isOver ? 'bg-zenit-scarlet animate-ping' : 'bg-emerald-500'}`} />
                                  <span className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em] italic">
                                     SAÚDE DO LIMITE: {isOver ? 'CRÍTICO' : 'ESTÁVEL'}
                                  </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className={`text-4xl font-display font-black italic ${isOver ? 'text-zenit-scarlet drop-shadow-[0_0_15px_rgba(255,26,26,0.4)]' : 'text-white'}`}>
                                  {Math.round(progress)}%
                               </span>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary bg-zenit-surface-2 p-3 rounded-xl border border-zenit-border-primary">
                               <span>CONSUMIDO: {formatCurrency(b.spent)}</span>
                               <span className="opacity-40">TETO: {formatCurrency(b.limit)}</span>
                            </div>
                            <div className="relative h-1.5 w-full bg-zenit-surface-2 rounded-full overflow-hidden shadow-inner">
                               <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min(100, progress)}%` }}
                                 className={`h-full relative rounded-full transition-all duration-1000 ${
                                   isOver ? 'bg-zenit-scarlet' : 'bg-white'
                                 }`}
                               >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                               </motion.div>
                            </div>
                         </div>
                         
                         <button 
                            onClick={() => deleteBudget(b.id)}
                            className="absolute bottom-4 right-8 text-[7px] text-zenit-text-tertiary/20 hover:text-zenit-scarlet uppercase tracking-widest font-black transition-all opacity-0 group-hover:opacity-100"
                         >
                            CANCEL_LIMIT
                         </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'goals' && (
              <motion.div 
                key="goals"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-4 mb-6">
                   <div className="flex items-center space-x-3">
                      <PiggyBank size={14} className="text-zenit-scarlet" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-secondary italic">Neural Profit Targets</h3>
                   </div>
                   <button 
                     onClick={() => setShowAddGoalModal(true)}
                     className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-border-secondary hover:bg-zenit-scarlet hover:text-white transition-all shadow-lg active:scale-90"
                   >
                     <Plus size={18} />
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {goals.map((goal, idx) => (
                    <GoalCard 
                      key={goal.id}
                      idx={idx}
                      icon={<TrendingUp size={24} />} 
                      label={goal.name} 
                      current={goal.current} 
                      target={goal.target} 
                      color="scarlet" 
                      formatCurrency={formatCurrency}
                      t={t}
                      onDelete={() => deleteGoal(goal.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Simplified AI Chat Entry */}
      {!loading && (
        <div className="fixed bottom-32 left-4 right-4 z-40 lg:hidden">
          <button 
            onClick={() => setShowAIChat(true)}
            className="w-full h-14 bg-zenit-surface-1/80 backdrop-blur-3xl border border-zenit-border-primary rounded-2xl flex items-center px-5 space-x-3 shadow-xl active:scale-[0.98] transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet">
              <Bot size={18} />
            </div>
            <span className="text-[10px] font-bold text-zenit-text-tertiary uppercase tracking-[0.2em]">{t.finance.aiFinancePlaceholder?.split(' ')[0]} AI Mentor...</span>
          </button>
        </div>
      )}

      {/* Chart Section */}
      <div className="glass-card p-10 border-zenit-border-primary bg-zenit-surface-1 rounded-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-zenit-scarlet/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center">
              <BarChart3 size={16} className="text-zenit-scarlet" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-secondary">Análise de Fluxo</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-zenit-scarlet" />
              <span className="text-[9px] font-bold text-zenit-text-tertiary uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-zenit-text-tertiary/20" />
              <span className="text-[9px] font-bold text-zenit-text-tertiary uppercase tracking-widest">Saídas</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Entradas', value: totalIncome },
              { name: 'Saídas', value: totalExpense }
            ]} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zenit-border-secondary" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: '900' }}
                className="text-zenit-text-tertiary"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-zenit-text-tertiary" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-primary)', borderRadius: '20px', fontSize: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                cursor={{ fill: 'var(--surface-2)' }}
              />
              <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                <Cell fill="url(#incomeGradient)" />
                <Cell fill="url(#expenseGradient)" />
              </Bar>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.2} className="text-zenit-text-tertiary" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0.05} className="text-zenit-text-tertiary" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-zenit-scarlet border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : activeTab === 'flow' ? (
        transactions.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <div className="w-20 h-20 bg-zenit-surface-1 rounded-full flex items-center justify-center mx-auto border border-zenit-border-primary">
              <PiggyBank size={32} className="text-zenit-text-tertiary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zenit-text-primary">{t.finance.noTransactions}</h3>
              <p className="text-sm text-zenit-text-secondary max-w-[200px] mx-auto">{t.finance.startTracking}</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest"
            >
              {t.finance.addTransaction}
            </button>
          </div>
        ) : (
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <TrendingUp size={18} className="text-zenit-text-tertiary" />
              <h3 className="text-xs font-display font-bold text-zenit-text-secondary uppercase tracking-[0.2em]">{t.finance.recentTransactions}</h3>
            </div>
            <div className="space-y-4">
              {transactions.map((t_item) => (
                <motion.div 
                  key={t_item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 flex items-center justify-between border-zenit-border-primary bg-zenit-surface-1 hover:bg-zenit-surface-2 transition-all duration-500 group rounded-[32px]"
                >
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border transition-all duration-500 ${
                      t_item.type === 'income' 
                        ? 'bg-zenit-scarlet/10 text-zenit-scarlet border-zenit-scarlet/20 group-hover:bg-zenit-scarlet group-hover:text-white' 
                        : 'bg-zenit-surface-2 text-zenit-text-tertiary border-zenit-border-primary group-hover:bg-zenit-surface-1 group-hover:text-zenit-text-primary'
                    }`}>
                      {t_item.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zenit-text-primary tracking-tight">{t_item.title}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-black">{t_item.category}</span>
                        <div className="w-1 h-1 rounded-full bg-zenit-border-primary" />
                        <span className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-black">
                          {new Date(t_item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-display font-bold tracking-tighter ${t_item.type === 'income' ? 'text-zenit-text-primary' : 'text-zenit-text-tertiary'}`}>
                      {t_item.type === 'income' ? '+' : '-'} {formatCurrency(t_item.amount)}
                    </p>
                    <button 
                      onClick={() => deleteTransaction(t_item.id)}
                      className="text-[9px] text-zenit-text-tertiary/30 hover:text-zenit-scarlet uppercase tracking-widest font-bold mt-2 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remover
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )
      ) : activeTab === 'budget' ? (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-zenit-surface-1 flex items-center justify-center">
                <Sparkles size={16} className="text-zenit-text-tertiary" />
              </div>
              <h3 className="text-xs font-display font-bold text-zenit-text-secondary uppercase tracking-[0.2em]">{t.finance.budgets}</h3>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddBudgetModal(true)}
              className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-scarlet/20 min-h-[44px] min-w-[44px]"
            >
              <Plus size={20} />
            </motion.button>
          </div>
          <div className="space-y-6">
            {budgets.map((b, idx) => {
              const progress = (b.spent / b.limit) * 100;
              const isOver = progress > 100;
              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-8 space-y-6 border-zenit-border-primary bg-zenit-surface-1 rounded-[32px] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-zenit-text-primary">
                    <PieChart size={60} />
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-zenit-text-primary tracking-tight">{b.category}</p>
                      <p className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.2em]">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-2">
                      <span className={`text-2xl font-display font-bold ${isOver ? 'text-red-500' : 'text-zenit-text-primary'}`}>
                        {Math.round(progress)}%
                      </span>
                      <button 
                        onClick={() => deleteBudget(b.id)}
                        className="text-[9px] text-zenit-text-tertiary/30 hover:text-zenit-scarlet uppercase tracking-widest font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <div className="relative h-2 w-full bg-zenit-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress)}%` }}
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                        isOver 
                          ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                          : 'bg-gradient-to-r from-zenit-scarlet to-zenit-crimson shadow-[0_0_20px_rgba(255,26,26,0.4)]'
                      }`}
                    />
                  </div>
                  {isOver && (
                    <p className="text-[9px] text-red-500 font-black uppercase tracking-widest animate-pulse">
                      Limite Excedido - Atenção Necessária
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-zenit-surface-1 flex items-center justify-center">
                <PiggyBank size={16} className="text-zenit-text-tertiary" />
              </div>
              <h3 className="text-xs font-display font-bold text-zenit-text-secondary uppercase tracking-[0.2em]">{t.finance.goals}</h3>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddGoalModal(true)}
              className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-scarlet/20 min-h-[44px] min-w-[44px]"
            >
              <Plus size={20} />
            </motion.button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {goals.map((goal, idx) => (
              <GoalCard 
                key={goal.id}
                idx={idx}
                icon={goal.icon} 
                label={goal.name} 
                current={goal.current} 
                target={goal.target} 
                color="scarlet" 
                formatCurrency={formatCurrency}
                t={t}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add Budget Modal */}
      <AnimatePresence>
        {showAddBudgetModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddBudgetModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-0 border-zenit-border-primary bg-zenit-surface-1 rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zenit-border-primary flex justify-between items-center bg-zenit-surface-1">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold text-zenit-text-primary tracking-tight uppercase italic">Novo <span className="text-zenit-scarlet">Orçamento</span></h3>
                  <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em]">Neural Wealth Protocol</p>
                </div>
                <button 
                  onClick={() => setShowAddBudgetModal(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-secondary shadow-inner active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Categoria</label>
                  <input
                    type="text"
                    value={newBudgetCategory}
                    onChange={(e) => setNewBudgetCategory(e.target.value)}
                    placeholder="Ex: Alimentação, Lazer..."
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] px-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Limite Mensal</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-text-tertiary font-bold">R$</span>
                    <input
                      type="number"
                      value={newBudgetLimit}
                      onChange={(e) => setNewBudgetLimit(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] pl-14 pr-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddBudget}
                  className="w-full py-6 rounded-[2rem] bg-zenit-text-primary text-zenit-black text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl shadow-zenit-text-primary/10 mt-4"
                >
                  Salvar Orçamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddGoalModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-0 border-zenit-border-primary bg-zenit-surface-1 rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zenit-border-primary flex justify-between items-center bg-zenit-surface-1">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold text-zenit-text-primary tracking-tight uppercase italic">{t.finance.addGoal.split(' ')[0]} <span className="text-zenit-scarlet">{t.finance.addGoal.split(' ')[1]}</span></h3>
                  <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em]">Neural Wealth Protocol</p>
                </div>
                <button 
                  onClick={() => setShowAddGoalModal(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-secondary shadow-inner active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.finance.goalName}</label>
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="Ex: Reserva de Emergência"
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] px-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.finance.targetAmount}</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-text-tertiary font-bold">R$</span>
                    <input
                      type="number"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] pl-14 pr-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddGoal}
                  className="w-full py-6 rounded-[2rem] bg-zenit-text-primary text-zenit-black text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl shadow-zenit-text-primary/10 mt-4"
                >
                  {t.finance.saveGoal}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-0 border-zenit-border-primary bg-zenit-surface-1 rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zenit-border-primary flex justify-between items-center bg-zenit-surface-1">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold text-zenit-text-primary tracking-tight uppercase italic">{t.finance.newTransaction.split(' ')[0]} <span className="text-zenit-scarlet">{t.finance.newTransaction.split(' ')[1]}</span></h3>
                  <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em]">{t.finance.wealthProtocol}</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-secondary shadow-inner active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
                <div className="flex bg-zenit-surface-2 p-1.5 rounded-2xl border border-zenit-border-primary shadow-inner">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 ${type === 'income' ? 'bg-zenit-scarlet text-white shadow-lg shadow-zenit-scarlet/20' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                  >
                    {t.finance.income}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 ${type === 'expense' ? 'bg-zenit-text-primary text-zenit-black shadow-lg shadow-zenit-text-primary/10' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                  >
                    {t.finance.expenses}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.finance.description}</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.finance.description}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] px-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.finance.amount}</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-text-tertiary font-bold">R$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] pl-14 pr-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                      />
                    </div>
                  </div>

                  {type === 'expense' && budgets.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Categoria (Opcional)</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[2rem] px-6 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/50 transition-all shadow-inner appearance-none"
                      >
                        <option value="">Sem categoria</option>
                        {budgets.map(b => (
                          <option key={b.id} value={b.category}>{b.category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full py-6 rounded-[2rem] bg-zenit-text-primary text-zenit-black text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl shadow-zenit-text-primary/10 mt-4">
                  {t.finance.save}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIChat && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-zenit-black/95 backdrop-blur-2xl transition-colors duration-500">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full max-w-2xl mx-auto w-full relative overflow-hidden"
            >
              {/* Technical Overlays */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]" />
              <div className="absolute top-0 left-0 w-full h-1 bg-zenit-scarlet/30 animate-pulse" />

              <div className="p-8 border-b border-zenit-border-primary flex justify-between items-center bg-zenit-surface-1 relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 rounded-[24px] bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet shadow-2xl relative">
                    <div className="absolute inset-0 rounded-[24px] border border-zenit-scarlet/20 animate-pulse" />
                    <Bot size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight text-white italic">NEURAL <span className="text-zenit-scarlet">STRATEGIST</span></h3>
                    <p className="text-[8px] text-zenit-scarlet font-black uppercase tracking-[0.4em] mt-1 italic">ACTIVE FLOW INTELLIGENCE v4.2</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIChat(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:bg-zenit-surface-3 hover:text-white transition-all border border-zenit-border-secondary shadow-inner"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide relative z-10">
                {aiResponse ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-none"
                  >
                    <div className="p-10 border border-zenit-border-primary bg-zenit-surface-1/50 rounded-[40px] leading-relaxed text-zenit-text-secondary font-light text-xl shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zenit-scarlet/20 group-hover:bg-zenit-scarlet transition-colors" />
                      <div className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-zenit-text-secondary">
                        <Markdown>{aiResponse}</Markdown>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-12 opacity-30">
                    <div className="relative">
                      <div className="absolute inset-0 bg-zenit-scarlet/20 blur-[100px] rounded-full animate-pulse" />
                      <div className="relative z-10 w-32 h-32 rounded-[40px] bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center">
                        <Cpu size={60} className="text-zenit-scarlet animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-[10px] uppercase tracking-[0.6em] font-black text-white italic">aguardando protocolo de análise</p>
                       <p className="text-[7px] uppercase tracking-[0.4em] text-zenit-text-tertiary font-black italic">nexus secure connection stable</p>
                    </div>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex items-center space-x-6 text-zenit-scarlet animate-pulse">
                    <div className="flex space-x-1.5 pt-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] italic">Sincronizando Dataset de Fluxo...</span>
                  </div>
                )}
              </div>

              <div className="p-8 bg-zenit-surface-1 border-t border-zenit-border-primary relative z-10">
                <div className="relative max-w-2xl mx-auto">
                  <div className="absolute left-6 top-6 pointer-events-none">
                     <Terminal size={18} className="text-zenit-scarlet" />
                  </div>
                  <textarea 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askFinanceAI())}
                    placeholder="DIGITAR COMANDO DE ESTRATÉGIA..."
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[32px] p-6 pl-16 pr-24 text-zenit-text-primary placeholder:text-zenit-text-tertiary focus:outline-none focus:border-zenit-scarlet/50 transition-all resize-none h-24 font-black text-xs uppercase tracking-widest shadow-inner shadow-black/40"
                  />
                  <button 
                    onClick={askFinanceAI}
                    disabled={isAiLoading || !aiMessage.trim()}
                    className="absolute right-3 top-3 w-14 h-14 rounded-[20px] bg-zenit-scarlet text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    <Send size={24} />
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

const GoalCard: React.FC<{ idx: number; icon: React.ReactNode; label: string; current: number; target: number; color: 'cyan' | 'purple' | 'scarlet'; formatCurrency: (amount: number) => string; t: any; onDelete: () => void }> = ({ idx, icon, label, current, target, color, formatCurrency, t, onDelete }) => {
  const progress = (current / target) * 100;
  const remaining = target - current;
  const accentColor = color === 'cyan' ? 'text-zenit-cyan' : color === 'purple' ? 'text-zenit-electric-blue' : 'text-zenit-scarlet';
  const barColor = color === 'cyan' ? 'bg-zenit-cyan' : color === 'purple' ? 'bg-zenit-electric-blue' : 'bg-zenit-scarlet';
  const glowColor = color === 'cyan' ? 'shadow-[0_0_20px_rgba(0,240,255,0.4)]' : color === 'purple' ? 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'shadow-[0_0_20px_rgba(255,26,26,0.4)]';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="p-8 space-y-10 border border-zenit-border-primary bg-zenit-surface-1 rounded-[4rem] relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
    >
      {/* High-Tech Background Artifacts */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-white pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
         <Target size={160} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-zenit-scarlet/20 to-transparent animate-scanline" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-2">
           <div className={`w-20 h-20 rounded-[28px] bg-zenit-surface-2 flex items-center justify-center ${accentColor} border-2 border-zenit-border-primary shadow-inner group-hover:bg-zenit-surface-3 transition-colors duration-500`}>
             {icon}
           </div>
           <p className="text-[7.5px] text-zenit-text-tertiary font-black uppercase tracking-[0.5em] italic mt-4 pl-1">ID_ PROTOCOL_TARGET</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-zenit-text-tertiary font-black uppercase tracking-[0.5em] italic mb-3 opacity-40">PROJEÇÃO_PERCENTUAL</p>
          <div className="relative inline-block">
             <span className="text-6xl font-display font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{Math.round(progress)}%</span>
             <div className="absolute -bottom-1 inset-x-0 h-0.5 bg-zenit-scarlet scale-x-50 opacity-50" />
          </div>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase group-hover:translate-x-2 transition-transform duration-500">{label}</h4>
            <div className="flex items-center space-x-3">
               <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-ping" />
               <p className="text-[10px] text-zenit-scarlet font-black uppercase tracking-[0.4em] italic bg-zenit-scarlet/5 px-3 py-1 rounded-full border border-zenit-scarlet/10">
                  DÉFICIT: {formatCurrency(remaining)}
               </p>
            </div>
          </div>
          <div className="text-right space-y-1">
             <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em] mb-1 italic opacity-40">OBJETIVO_FINAL_ZENITH</p>
             <p className="text-2xl font-display font-black text-white/40 tracking-tighter italic">{formatCurrency(target)}</p>
          </div>
        </div>
        
        {/* Futuristic Liquidity Gauge */}
        <div className="relative py-4">
           <div className="relative h-2.5 w-full bg-zenit-surface-2 rounded-full overflow-hidden shadow-inner border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                className={`absolute inset-y-0 left-0 ${barColor} ${glowColor} rounded-full transition-all duration-1000 flex items-center justify-end overflow-hidden`}
              >
                 <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-scanline" />
                 <div className="w-4 h-full bg-white/20 blur-md mr-1 animate-pulse" />
              </motion.div>
           </div>
           {/* Progress Markers */}
           <div className="flex justify-between mt-3 px-1">
              {[0, 25, 50, 75, 100].map(m => (
                <div key={m} className={`flex flex-col items-center space-y-1 ${progress >= m ? 'text-white' : 'text-zenit-text-tertiary opacity-20'}`}>
                   <div className={`w-[1px] h-1.5 transition-colors ${progress >= m ? 'bg-zenit-scarlet' : 'bg-zenit-text-tertiary'}`} />
                   <span className="text-[7px] font-mono font-black italic">{m}%</span>
                </div>
              ))}
           </div>
        </div>

        <div className="flex justify-between items-center bg-zenit-black/30 p-6 rounded-[2rem] border border-white/5 backdrop-blur-3xl group-hover:border-zenit-scarlet/20 transition-all duration-700">
           <div className="flex items-center space-x-4">
              <div className="w-2 h-2 rounded-full bg-zenit-scarlet animate-pulse shadow-[0_0_10px_rgba(255,26,26,0.5)]" />
              <div className="space-y-0.5">
                 <span className="text-[9px] text-white font-black uppercase tracking-[0.4em] italic block">SINAL_PROTOCOL_ESTÁVEL</span>
                 <span className="text-[7px] text-zenit-text-tertiary font-black uppercase tracking-[0.2em] italic">Transmissão Criptografada Zenith v9.1</span>
              </div>
           </div>
           <button 
             onClick={onDelete}
             className="px-6 py-2.5 rounded-xl text-[8px] text-zenit-text-tertiary/40 hover:text-white hover:bg-zenit-scarlet uppercase tracking-widest font-black transition-all border border-transparent hover:border-zenit-scarlet shadow-2xl shadow-zenit-scarlet/20"
           >
             ANULAR_PROJEÇÃO
           </button>
        </div>
      </div>
    </motion.div>
  );
};

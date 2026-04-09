import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown, Sparkles, Zap, MessageSquare, X, Send, Bot, Activity, Timer, BarChart3, PieChart } from 'lucide-react';
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

export const FinanceTracker: React.FC<FinanceTrackerProps> = ({ t, language, setAppTab }) => {
  const { userData } = useUser();
  const tier = userData?.subscription_tier || 'basic';
  const hasAccess = TIER_LIMITS[tier as SubscriptionTier]?.hasFinanceTracking || false;

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

  useEffect(() => {
    if (userData?.id && hasAccess) {
      fetchTransactions();
      fetchBudgets();
      fetchGoals();
    }
  }, [userData, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-zenit-surface-1 border border-zenit-border-primary flex items-center justify-center shadow-2xl shadow-zenit-scarlet/10">
          <Lock size={40} className="text-zenit-scarlet" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zenit-text-primary tracking-tight">{t.finance.premiumTitle}</h2>
          <p className="text-sm text-zenit-text-tertiary max-w-xs mx-auto leading-relaxed">
            {t.finance.premiumDesc}
          </p>
        </div>
        <button 
          onClick={() => setAppTab('profile')}
          className="bg-zenit-text-primary text-zenit-black px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-zenit-text-primary/5"
        >
          {t.finance.upgradeNow}
        </button>
      </div>
    );
  }

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
    <div className="p-6 space-y-12 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display tracking-tighter uppercase leading-none text-zenit-text-primary">
            Fluxo <span className="text-zenit-scarlet">Capital</span>
          </h1>
          <div className="flex items-center space-x-3">
            <div className="h-1 w-16 bg-gradient-to-r from-zenit-scarlet to-transparent rounded-full" />
            <p className="text-zenit-text-tertiary text-[10px] font-bold uppercase tracking-[0.3em]">
              Gestão de Ativos e Liquidez
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIChat(true)}
            className="w-16 h-16 rounded-[24px] bg-zenit-scarlet/5 border border-zenit-scarlet/20 flex items-center justify-center text-zenit-scarlet hover:bg-zenit-scarlet/10 transition-all shadow-2xl shadow-zenit-scarlet/5"
          >
            <Bot size={32} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="w-16 h-16 rounded-[24px] bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center hover:bg-zenit-surface-3 hover:border-zenit-scarlet/50 transition-all duration-500 group shadow-2xl"
          >
            <Plus size={32} className="text-zenit-text-tertiary group-hover:text-zenit-scarlet transition-colors" />
          </motion.button>
        </div>
      </header>

      {/* Balance Card */}
      <div className="glass-card p-10 border-zenit-border-primary bg-zenit-surface-1 relative overflow-hidden group rounded-[40px]">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 text-zenit-text-primary">
          <Wallet size={120} />
        </div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-zenit-scarlet/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-zenit-scarlet animate-pulse" />
              <p className="text-zenit-text-tertiary text-[10px] uppercase tracking-[0.4em] font-black">{t.finance.balance}</p>
            </div>
            <h2 className="text-6xl font-display font-bold tracking-tighter text-zenit-text-primary">
              {formatCurrency(balance)}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zenit-border-secondary">
            <div className="space-y-2">
              <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.finance.income}</p>
              <div className="flex items-baseline space-x-2">
                <ArrowUpRight size={14} className="text-zenit-scarlet" />
                <p className="text-2xl font-display font-bold text-zenit-text-primary tracking-tight">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.finance.expenses}</p>
              <div className="flex items-baseline space-x-2">
                <ArrowDownLeft size={14} className="text-zenit-text-tertiary" />
                <p className="text-2xl font-display font-bold text-zenit-text-secondary tracking-tight">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
        <div className="flex bg-zenit-surface-1 p-1.5 rounded-[24px] border border-zenit-border-primary backdrop-blur-xl">
          {(['flow', 'budget', 'goals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] uppercase tracking-[0.2em] font-black rounded-[18px] transition-all duration-500 relative overflow-hidden ${
                activeTab === tab 
                  ? 'text-white' 
                  : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-gradient-to-br from-zenit-scarlet to-zenit-crimson shadow-lg"
                />
              )}
              <span className="relative z-10">
                {tab === 'flow' ? t.finance.flow : tab === 'budget' ? t.finance.budgets : t.finance.goals}
              </span>
            </button>
          ))}
        </div>

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
                  <stop offset="0%" stopColor="#ff1a1a" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ff1a1a" stopOpacity={0.3} />
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddBudgetModal(true)}
              className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-scarlet/20"
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddGoalModal(true)}
              className="w-10 h-10 rounded-xl bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet border border-zenit-scarlet/20"
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
          <div className="fixed inset-0 z-[100] flex flex-col bg-zenit-black transition-colors duration-500">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full max-w-2xl mx-auto w-full"
            >
              <div className="p-8 border-b border-zenit-border-primary flex justify-between items-center bg-zenit-surface-1">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-[20px] bg-zenit-scarlet/10 flex items-center justify-center text-zenit-scarlet shadow-2xl shadow-zenit-scarlet/20">
                    <Bot size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight text-zenit-text-primary">{t.finance.zenitStrategist}</h3>
                    <p className="text-[10px] text-zenit-scarlet font-black uppercase tracking-[0.3em]">{t.finance.activeFinanceIntelligence}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIChat(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-1 flex items-center justify-center text-zenit-text-tertiary hover:bg-zenit-surface-2 hover:text-zenit-text-primary transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {aiResponse ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-none"
                  >
                    <div className="glass-card p-10 border-zenit-border-primary bg-zenit-surface-1 rounded-[40px] leading-relaxed text-zenit-text-secondary font-light text-lg shadow-2xl">
                      <Markdown>{aiResponse}</Markdown>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-zenit-scarlet/20 blur-[60px] rounded-full animate-pulse" />
                      <Bot size={100} className="relative z-10 text-zenit-scarlet" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.5em] font-black text-zenit-text-primary">{t.finance.waitingAnalysisCommand}</p>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex items-center space-x-4 text-zenit-scarlet">
                    <div className="w-3 h-3 rounded-full bg-zenit-scarlet animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t.finance.processingDataFlow}</span>
                  </div>
                )}
              </div>

              <div className="p-8 bg-zenit-surface-1 border-t border-zenit-border-primary">
                <div className="relative max-w-2xl mx-auto">
                  <textarea 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askFinanceAI())}
                    placeholder={t.finance.aiFinancePlaceholder}
                    className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-[32px] p-6 pr-20 text-zenit-text-primary placeholder:text-zenit-text-tertiary focus:outline-none focus:border-zenit-scarlet/50 transition-all resize-none h-28 font-light text-lg"
                  />
                  <button 
                    onClick={askFinanceAI}
                    disabled={isAiLoading || !aiMessage.trim()}
                    className="absolute right-4 bottom-4 w-16 h-16 rounded-[20px] bg-zenit-scarlet text-white flex items-center justify-center shadow-2xl shadow-zenit-scarlet/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={28} />
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
      whileHover={{ y: -4 }}
      className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 rounded-[32px] relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-zenit-scarlet/5 transition-colors" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-14 h-14 rounded-[20px] bg-white/5 flex items-center justify-center ${accentColor} border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className="text-right flex flex-col items-end space-y-2">
          <span className={`text-3xl font-display font-bold text-white`}>{Math.round(progress)}%</span>
          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{t.finance.completed}</p>
          <button 
            onClick={onDelete}
            className="text-[9px] text-white/10 hover:text-zenit-scarlet uppercase tracking-widest font-bold transition-colors opacity-0 group-hover:opacity-100"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-xl font-bold text-white tracking-tight">{label}</h4>
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">
              {t.finance.remaining} {formatCurrency(remaining)}
            </p>
          </div>
          <p className="text-sm font-bold text-white/40">
            {formatCurrency(target)}
          </p>
        </div>
        
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            className={`absolute inset-y-0 left-0 ${barColor} ${glowColor} rounded-full transition-all duration-1000`}
          />
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown, Sparkles, Zap, MessageSquare, X, Send, Bot, Activity, Timer, BarChart3, PieChart } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../supabase';
import { Language } from '../translations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';
import Markdown from 'react-markdown';

import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS } from '../types';
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

interface FinanceTrackerProps {
  t: any;
  language: Language;
  setAppTab: (tab: string) => void;
}

export const FinanceTracker: React.FC<FinanceTrackerProps> = ({ t, language, setAppTab }) => {
  const { userData } = useUser();
  const tier = userData?.subscription_tier || 'free';
  const hasAccess = TIER_LIMITS[tier]?.hasFinanceTracking || false;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

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
  
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    if (userData?.id && hasAccess) {
      fetchTransactions();
      fetchBudgets();
      fetchGoals();
    }
  }, [userData, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 min-h-[400px]">
        <div className="w-20 h-20 bg-zenith-scarlet/10 rounded-full flex items-center justify-center">
          <Lock className="text-zenith-scarlet" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-zenith-text-primary">{t.finance.premiumTitle || 'Finance Tracking is Premium'}</h2>
        <p className="text-zenith-text-tertiary max-w-md">
          {t.finance.premiumDesc || 'Upgrade your plan to access advanced financial management, budget tracking, and AI-powered financial insights.'}
        </p>
        <button 
          onClick={() => setAppTab('subscription')}
          className="px-8 py-3 bg-gradient-to-r from-zenith-scarlet to-zenith-crimson text-white rounded-xl font-bold hover:bg-opacity-80 transition-all shadow-lg shadow-zenith-scarlet/20"
        >
          {t.finance.upgradeNow || 'Upgrade Now'}
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
    try {
      const { data, error } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('user_id', userData.id);
      if (error) throw error;
      if (data && data.length > 0) {
        setBudgets(data);
      } else {
        setBudgets([
          { category: 'Alimentação', limit: 1000, spent: 450 },
          { category: 'Transporte', limit: 500, spent: 120 },
          { category: 'Lazer', limit: 300, spent: 280 },
        ]);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setBudgets([
        { category: 'Alimentação', limit: 1000, spent: 450 },
        { category: 'Transporte', limit: 500, spent: 120 },
        { category: 'Lazer', limit: 300, spent: 280 },
      ]);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_goals')
        .select('*')
        .eq('user_id', userData.id);
      if (error) throw error;
      if (data && data.length > 0) {
        setGoals(data);
      } else {
        setGoals([
          { id: '1', name: 'Reserva de Emergência', target: 5000, current: 1200 },
          { id: '2', name: 'Viagem Japão', target: 15000, current: 3500 },
        ]);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setGoals([
        { id: '1', name: 'Reserva de Emergência', target: 5000, current: 1200 },
        { id: '2', name: 'Viagem Japão', target: 15000, current: 3500 },
      ]);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      const { error } = await supabase
        .from('finances')
        .insert([{
          user_id: userData.id,
          title: description,
          description: '',
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
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey) throw new Error('AI not configured: Missing API Key');

      const ai = new GoogleGenAI({ apiKey });
      
      const financeData = {
        transactions: transactions.slice(0, 20),
        budgets,
        totalBalance: totalIncome - totalExpense,
        totalIncome: totalIncome,
        totalExpenses: totalExpense
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o Estrategista Financeiro de Elite da Zenith IA. Sua missão é realizar uma auditoria neural completa e projetar um protocolo de expansão de capital.
          
          DATASET FINANCEIRO:
          ${JSON.stringify(financeData)}
          
          REQUISIÇÃO DO USUÁRIO: "${aiMessage}"
          
          FRAMEWORK DE RESPOSTA (OBRIGATÓRIO):
          1. 🧠 DIAGNÓSTICO NEURAL: Uma análise cirúrgica do comportamento financeiro atual e saúde da liquidez.
          2. 📊 MATRIZ DE PADRÕES: Identifique ineficiências críticas, vazamentos de capital e vetores de crescimento subutilizados.
          3. ⚡ PROTOCOLO DE ALAVANCAGEM: 3 ações táticas de alto impacto para otimizar o fluxo e acelerar o atingimento de metas.
          4. 🎯 PROJEÇÃO DE CENÁRIO: Simulação probabilística de 90 dias baseada na manutenção ou ajuste dos protocolos atuais.
          
          Diretrizes: Use linguagem de alta finanças e performance. Seja provocativo, analítico e focado em resultados exponenciais.`,
        config: {
          systemInstruction: "Você é o Mentor Financeiro Supremo do ecossistema Zenith. Sua inteligência é voltada para a otimização matemática da riqueza e a engenharia de liberdade financeira."
        }
      });
      
      setAiResponse(response.text || 'Desculpe, não consegui analisar seus dados agora.');
      setAiMessage('');
    } catch (err: any) {
      console.error('AI Error:', err);
      setAiResponse(`Erro ao conectar com o Mentor Financeiro: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;
    
    try {
      const { error } = await supabase
        .from('finance_goals')
        .insert([{
          user_id: userData.id,
          name: newGoalName,
          target: parseFloat(newGoalTarget),
          current: 0
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
          <h1 className="text-4xl font-bold font-display tracking-tighter uppercase leading-none text-zenith-text-primary">
            Fluxo <span className="text-zenith-scarlet">Capital</span>
          </h1>
          <div className="flex items-center space-x-3">
            <div className="h-1 w-16 bg-gradient-to-r from-zenith-scarlet to-transparent rounded-full" />
            <p className="text-zenith-text-tertiary text-[10px] font-bold uppercase tracking-[0.3em]">
              Gestão de Ativos e Liquidez
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIChat(true)}
            className="w-16 h-16 rounded-[24px] bg-zenith-scarlet/5 border border-zenith-scarlet/20 flex items-center justify-center text-zenith-scarlet hover:bg-zenith-scarlet/10 transition-all shadow-2xl shadow-zenith-scarlet/5"
          >
            <Bot size={32} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="w-16 h-16 rounded-[24px] bg-zenith-surface-2 border border-zenith-border-primary flex items-center justify-center hover:bg-zenith-surface-3 hover:border-zenith-scarlet/50 transition-all duration-500 group shadow-2xl"
          >
            <Plus size={32} className="text-zenith-text-tertiary group-hover:text-zenith-scarlet transition-colors" />
          </motion.button>
        </div>
      </header>

      {/* Balance Card */}
      <div className="glass-card p-10 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden group rounded-[40px]">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 text-zenith-text-primary">
          <Wallet size={120} />
        </div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-zenith-scarlet/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-zenith-scarlet animate-pulse" />
              <p className="text-zenith-text-tertiary text-[10px] uppercase tracking-[0.4em] font-black">{t.finance.balance}</p>
            </div>
            <h2 className="text-6xl font-display font-bold tracking-tighter text-zenith-text-primary">
              {formatCurrency(balance)}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zenith-border-secondary">
            <div className="space-y-2">
              <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">{t.finance.income}</p>
              <div className="flex items-baseline space-x-2">
                <ArrowUpRight size={14} className="text-zenith-scarlet" />
                <p className="text-2xl font-display font-bold text-zenith-text-primary tracking-tight">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">{t.finance.expenses}</p>
              <div className="flex items-baseline space-x-2">
                <ArrowDownLeft size={14} className="text-zenith-text-tertiary" />
                <p className="text-2xl font-display font-bold text-zenith-text-secondary tracking-tight">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
        <div className="flex bg-zenith-surface-1 p-1.5 rounded-[24px] border border-zenith-border-primary backdrop-blur-xl">
          {(['flow', 'budget', 'goals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] uppercase tracking-[0.2em] font-black rounded-[18px] transition-all duration-500 relative overflow-hidden ${
                activeTab === tab 
                  ? 'text-white' 
                  : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-gradient-to-br from-zenith-scarlet to-zenith-crimson shadow-lg"
                />
              )}
              <span className="relative z-10">
                {tab === 'flow' ? t.finance.flow : tab === 'budget' ? t.finance.budgets : t.finance.goals}
              </span>
            </button>
          ))}
        </div>

      {/* Chart Section */}
      <div className="glass-card p-10 border-zenith-border-primary bg-zenith-surface-1 rounded-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-zenith-scarlet/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center">
              <BarChart3 size={16} className="text-zenith-scarlet" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zenith-text-secondary">Análise de Fluxo</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-zenith-scarlet" />
              <span className="text-[9px] font-bold text-zenith-text-tertiary uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-zenith-text-tertiary/20" />
              <span className="text-[9px] font-bold text-zenith-text-tertiary uppercase tracking-widest">Saídas</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Entradas', value: totalIncome },
              { name: 'Saídas', value: totalExpense }
            ]} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zenith-border-secondary" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: '900' }}
                className="text-zenith-text-tertiary"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-zenith-text-tertiary" />
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
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.2} className="text-zenith-text-tertiary" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0.05} className="text-zenith-text-tertiary" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-zenith-scarlet border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : activeTab === 'flow' ? (
        transactions.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <div className="w-20 h-20 bg-zenith-surface-1 rounded-full flex items-center justify-center mx-auto border border-zenith-border-primary">
              <PiggyBank size={32} className="text-zenith-text-tertiary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zenith-text-primary">{t.finance.noTransactions}</h3>
              <p className="text-sm text-zenith-text-secondary max-w-[200px] mx-auto">{t.finance.startTracking}</p>
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
              <TrendingUp size={18} className="text-zenith-text-tertiary" />
              <h3 className="text-xs font-display font-bold text-zenith-text-secondary uppercase tracking-[0.2em]">{t.finance.recentTransactions}</h3>
            </div>
            <div className="space-y-4">
              {transactions.map((t_item) => (
                <motion.div 
                  key={t_item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 flex items-center justify-between border-zenith-border-primary bg-zenith-surface-1 hover:bg-zenith-surface-2 transition-all duration-500 group rounded-[32px]"
                >
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border transition-all duration-500 ${
                      t_item.type === 'income' 
                        ? 'bg-zenith-scarlet/10 text-zenith-scarlet border-zenith-scarlet/20 group-hover:bg-zenith-scarlet group-hover:text-white' 
                        : 'bg-zenith-surface-2 text-zenith-text-tertiary border-zenith-border-primary group-hover:bg-zenith-surface-1 group-hover:text-zenith-text-primary'
                    }`}>
                      {t_item.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zenith-text-primary tracking-tight">{t_item.title}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-black">{t_item.category}</span>
                        <div className="w-1 h-1 rounded-full bg-zenith-border-primary" />
                        <span className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-black">
                          {new Date(t_item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-display font-bold tracking-tighter ${t_item.type === 'income' ? 'text-zenith-text-primary' : 'text-zenith-text-tertiary'}`}>
                      {t_item.type === 'income' ? '+' : '-'} {formatCurrency(t_item.amount)}
                    </p>
                    <button 
                      onClick={() => deleteTransaction(t_item.id)}
                      className="text-[9px] text-zenith-text-tertiary/30 hover:text-zenith-scarlet uppercase tracking-widest font-bold mt-2 transition-colors opacity-0 group-hover:opacity-100"
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zenith-surface-1 flex items-center justify-center">
              <Sparkles size={16} className="text-zenith-text-tertiary" />
            </div>
            <h3 className="text-xs font-display font-bold text-zenith-text-secondary uppercase tracking-[0.2em]">{t.finance.budgets}</h3>
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
                  className="glass-card p-8 space-y-6 border-zenith-border-primary bg-zenith-surface-1 rounded-[32px] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-zenith-text-primary">
                    <PieChart size={60} />
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-zenith-text-primary tracking-tight">{b.category}</p>
                      <p className="text-[10px] text-zenith-text-tertiary font-black uppercase tracking-[0.2em]">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-display font-bold ${isOver ? 'text-red-500' : 'text-zenith-text-primary'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 w-full bg-zenith-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress)}%` }}
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                        isOver 
                          ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                          : 'bg-gradient-to-r from-zenith-scarlet to-zenith-crimson shadow-[0_0_20px_rgba(255,26,26,0.4)]'
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
              <div className="w-8 h-8 rounded-xl bg-zenith-surface-1 flex items-center justify-center">
                <PiggyBank size={16} className="text-zenith-text-tertiary" />
              </div>
              <h3 className="text-xs font-display font-bold text-zenith-text-secondary uppercase tracking-[0.2em]">{t.finance.goals}</h3>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddGoalModal(true)}
              className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet border border-zenith-scarlet/20"
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
              />
            ))}
          </div>
        </section>
      )}

      {/* Add Goal Modal */}
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
              className="relative w-full max-w-md glass-card p-8 border-zenith-border-primary bg-zenith-surface-1"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zenith-text-primary">{t.finance.addGoal}</h2>
                <button onClick={() => setShowAddGoalModal(false)} className="text-zenith-text-tertiary hover:text-zenith-text-primary">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary">{t.finance.goalName}</label>
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl p-4 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                    placeholder="Ex: Reserva de Emergência"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary">{t.finance.targetAmount}</label>
                  <input
                    type="number"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl p-4 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                    placeholder="0.00"
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]">
                  {t.finance.saveGoal}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-8 space-y-8 bg-zenith-surface-1 border-zenith-border-primary"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">{t.finance.newTransaction}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zenith-text-tertiary hover:text-zenith-text-primary"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex bg-zenith-surface-1 p-1 rounded-xl border border-zenith-border-primary">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${type === 'income' ? 'bg-zenith-scarlet text-white' : 'text-zenith-text-tertiary'}`}
                  >
                    {t.finance.income}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-zenith-surface-2 text-zenith-text-primary' : 'text-zenith-text-tertiary'}`}
                  >
                    {t.finance.expenses}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">{t.finance.description}</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-xl p-4 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                      placeholder={t.finance.description}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">{t.finance.amount}</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-xl p-4 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full btn-primary py-4 text-[10px] uppercase tracking-[0.3em]">
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
          <div className="fixed inset-0 z-[100] flex flex-col bg-zenith-black transition-colors duration-500">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full max-w-2xl mx-auto w-full"
            >
              <div className="p-8 border-b border-zenith-border-primary flex justify-between items-center bg-zenith-surface-1">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-[20px] bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet shadow-2xl shadow-zenith-scarlet/20">
                    <Bot size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight text-zenith-text-primary">Estrategista Zenith</h3>
                    <p className="text-[10px] text-zenith-scarlet font-black uppercase tracking-[0.3em]">Inteligência Financeira Ativa</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIChat(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenith-surface-1 flex items-center justify-center text-zenith-text-tertiary hover:bg-zenith-surface-2 hover:text-zenith-text-primary transition-all"
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
                    <div className="glass-card p-10 border-zenith-border-primary bg-zenith-surface-1 rounded-[40px] leading-relaxed text-zenith-text-secondary font-light text-lg shadow-2xl">
                      <Markdown>{aiResponse}</Markdown>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-zenith-scarlet/20 blur-[60px] rounded-full animate-pulse" />
                      <Bot size={100} className="relative z-10 text-zenith-scarlet" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.5em] font-black text-zenith-text-primary">Aguardando Comando de Análise...</p>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex items-center space-x-4 text-zenith-scarlet">
                    <div className="w-3 h-3 rounded-full bg-zenith-scarlet animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Processando Fluxo de Dados...</span>
                  </div>
                )}
              </div>

              <div className="p-8 bg-zenith-surface-1 border-t border-zenith-border-primary">
                <div className="relative max-w-2xl mx-auto">
                  <textarea 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askFinanceAI())}
                    placeholder="Ex: Como posso alavancar meus aportes este mês?"
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-[32px] p-6 pr-20 text-zenith-text-primary placeholder:text-zenith-text-tertiary focus:outline-none focus:border-zenith-scarlet/50 transition-all resize-none h-28 font-light text-lg"
                  />
                  <button 
                    onClick={askFinanceAI}
                    disabled={isAiLoading || !aiMessage.trim()}
                    className="absolute right-4 bottom-4 w-16 h-16 rounded-[20px] bg-zenith-scarlet text-white flex items-center justify-center shadow-2xl shadow-zenith-scarlet/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
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

const GoalCard: React.FC<{ idx: number; icon: React.ReactNode; label: string; current: number; target: number; color: 'cyan' | 'purple' | 'scarlet'; formatCurrency: (amount: number) => string }> = ({ idx, icon, label, current, target, color, formatCurrency }) => {
  const progress = (current / target) * 100;
  const remaining = target - current;
  const accentColor = color === 'cyan' ? 'text-zenith-cyan' : color === 'purple' ? 'text-zenith-electric-blue' : 'text-zenith-scarlet';
  const barColor = color === 'cyan' ? 'bg-zenith-cyan' : color === 'purple' ? 'bg-zenith-electric-blue' : 'bg-zenith-scarlet';
  const glowColor = color === 'cyan' ? 'shadow-[0_0_20px_rgba(0,240,255,0.4)]' : color === 'purple' ? 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'shadow-[0_0_20px_rgba(255,26,26,0.4)]';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
      whileHover={{ y: -4 }}
      className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 rounded-[32px] relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-zenith-scarlet/5 transition-colors" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-14 h-14 rounded-[20px] bg-white/5 flex items-center justify-center ${accentColor} border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className="text-right">
          <span className={`text-3xl font-display font-bold text-white`}>{Math.round(progress)}%</span>
          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">Concluído</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-xl font-bold text-white tracking-tight">{label}</h4>
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">
              Faltam {formatCurrency(remaining)}
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

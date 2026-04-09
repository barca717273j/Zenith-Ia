import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Plus, X, Video, FileText, Tag, 
  BarChart, Save, Trash2, Users, Settings, 
  Activity, Shield, Database, Search, Filter, ChevronRight,
  MessageSquare, Zap, AlertTriangle, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

import { useUser } from '../contexts/UserContext';

export const AdminPanel: React.FC<{ t: any; onBack?: () => void }> = ({ t, onBack }) => {
  const { userData } = useUser();
  const [activeTab, setActiveTab] = useState<'exercises' | 'users' | 'system'>('exercises');
  const [exercises, setExercises] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalExercises: 0,
    premiumUsers: 0,
    totalPosts: 0,
    totalHabits: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newTier, setNewTier] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ 
    title: string; 
    message: string; 
    onConfirm: () => void; 
  } | null>(null);
  
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    category: 'strength',
    duration: '',
    difficulty: 'beginner',
    is_premium: false,
    video_url: '',
    xp_reward: 50
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'exercises') await fetchExercises();
    if (activeTab === 'users') await fetchUsers();
    if (activeTab === 'system') await fetchSystemStats();
    setLoading(false);
  };

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setExercises(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
  };

  const fetchSystemStats = async () => {
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: exCount } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
    const { count: premCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).neq('subscription_tier', 'basic');
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { count: habitCount } = await supabase.from('habits').select('*', { count: 'exact', head: true });
    
    setStats({
      totalUsers: userCount || 0,
      activeUsers: Math.floor((userCount || 0) * 0.85), // Improved heuristic
      totalExercises: exCount || 0,
      premiumUsers: premCount || 0,
      totalPosts: postCount || 0,
      totalHabits: habitCount || 0
    });
  };

  const handleUpdateTier = async () => {
    if (!selectedUser || !newTier) return;
    const { error } = await supabase
      .from('users')
      .update({ subscription_tier: newTier })
      .eq('id', selectedUser.id);
    
    if (!error) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, subscription_tier: newTier } : u));
      setSelectedUser(null);
      setNewTier('');
    }
  };

  const handleSeedData = async () => {
    setConfirmAction({
      title: 'Semear Dados',
      message: 'Deseja popular o banco com dados profissionais? Isso adicionará exercícios e configurações padrão.',
      onConfirm: async () => {
        setConfirmAction(null);
        setLoading(true);
        
        const seedExercises = [
          {
            title: 'Treino A - Peito e Tríceps',
            description: 'Foco em hipertrofia de empurrar. Supino Reto, Supino Inclinado, Crucifixo, Tríceps Corda e Tríceps Testa.',
            category: 'split',
            duration: '60 min',
            difficulty: 'intermediate',
            is_premium: true,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            xp_reward: 150
          },
          {
            title: 'Yoga para Foco Mental',
            description: 'Sessão guiada para clareza e redução de ansiedade. Foco em respiração e equilíbrio.',
            category: 'yoga',
            duration: '20 min',
            difficulty: 'beginner',
            is_premium: false,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            xp_reward: 80
          },
          {
            title: 'Meditação de Visualização',
            description: 'Técnica de visualização criativa para metas de longo prazo.',
            category: 'mind',
            duration: '15 min',
            difficulty: 'beginner',
            is_premium: false,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            xp_reward: 60
          },
          {
            title: 'Dieta de Alta Performance',
            description: 'Sugestões de refeições para manter energia estável durante o dia.',
            category: 'nutrition',
            duration: '10 min',
            difficulty: 'beginner',
            is_premium: true,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            xp_reward: 50
          }
        ];

        const { error } = await supabase.from('exercises').insert(seedExercises);
        
        // Seed Finance Budgets and Goals for the admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const seedBudgets = [
            { user_id: user.id, category: 'Alimentação', limit_amount: 1500, current_amount: 0 },
            { user_id: user.id, category: 'Transporte', limit_amount: 500, current_amount: 0 },
            { user_id: user.id, category: 'Lazer', limit_amount: 800, current_amount: 0 }
          ];
          const seedGoals = [
            { user_id: user.id, title: 'Fundo de Emergência', target_amount: 10000, current_amount: 2500, deadline: '2026-12-31' },
            { user_id: user.id, title: 'Viagem Zenit', target_amount: 5000, current_amount: 1200, deadline: '2026-08-15' }
          ];
          
          await supabase.from('finance_budgets').insert(seedBudgets);
          await supabase.from('finance_goals').insert(seedGoals);
        }

        if (!error) {
          setMessage({ type: 'success', text: 'Dados semeados com sucesso!' });
          fetchExercises();
        } else {
          console.error('Seed error:', error);
          setMessage({ type: 'error', text: 'Erro ao semear dados.' });
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleSave = async () => {
    if (!newExercise.title || !newExercise.video_url) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .insert([newExercise]);

      if (error) throw error;

      setShowAddModal(false);
      setMessage({ type: 'success', text: 'Exercício salvo com sucesso!' });
      setNewExercise({
        title: '',
        description: '',
        category: 'strength',
        duration: '',
        difficulty: 'beginner',
        is_premium: false,
        video_url: '',
        xp_reward: 50
      });
      fetchExercises();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving exercise:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar exercício' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmAction({
      title: 'Excluir Exercício',
      message: 'Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmAction(null);
        const { error } = await supabase.from('exercises').delete().eq('id', id);
        if (!error) {
          setMessage({ type: 'success', text: 'Exercício excluído com sucesso!' });
          fetchExercises();
        } else {
          setMessage({ type: 'error', text: 'Erro ao excluir exercício.' });
        }
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-10 pb-32 max-w-4xl mx-auto min-h-screen relative">
      <button 
        onClick={onBack}
        className="fixed top-8 left-8 z-[60] p-4 bg-zenit-surface-1 rounded-[20px] border border-zenit-border-primary backdrop-blur-xl hover:bg-zenit-surface-2 transition-all group"
      >
        <ChevronRight size={20} className="rotate-180 text-zenit-text-tertiary group-hover:text-zenit-text-primary transition-colors" />
      </button>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-12 sm:mt-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-zenit-scarlet" />
            <h1 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary">
              Terminal <span className="text-zenit-scarlet">Admin</span>
            </h1>
          </div>
          <p className="text-zenit-text-tertiary text-[10px] uppercase tracking-[0.3em] font-bold">Zenit Core Infrastructure</p>
        </div>
        
        <div className="flex bg-zenit-surface-1 p-1 rounded-2xl border border-zenit-border-primary w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'exercises' ? 'bg-zenit-scarlet text-white shadow-lg' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
          >
            <Database size={14} />
            <span>Conteúdo</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'users' ? 'bg-zenit-scarlet text-white shadow-lg' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
          >
            <Users size={14} />
            <span>Usuários</span>
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'system' ? 'bg-zenit-scarlet text-white shadow-lg' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
          >
            <Activity size={14} />
            <span>Sistema</span>
          </button>
        </div>
      </header>

      {activeTab === 'system' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Total Usuários" value={stats.totalUsers} icon={<Users />} />
          <StatCard label="Usuários Ativos" value={stats.activeUsers} icon={<Activity />} />
          <StatCard label="Assinantes Premium" value={stats.premiumUsers} icon={<Shield />} />
          <StatCard label="Exercícios no Catálogo" value={stats.totalExercises} icon={<Database />} />
          <StatCard label="Postagens Nexus" value={stats.totalPosts} icon={<MessageSquare />} />
          <StatCard label="Hábitos Monitorados" value={stats.totalHabits} icon={<Zap />} />
        </div>
      )}

          <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zenit-text-tertiary" />
            <input 
              type="text" 
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 pl-12 pr-6 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all"
            />
          </div>
          {activeTab === 'exercises' && (
            <div className="flex space-x-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSeedData}
                className="w-14 h-14 rounded-2xl bg-zenit-surface-1 text-zenit-text-tertiary flex items-center justify-center border border-zenit-border-primary"
                title="Seed Data"
              >
                <Database size={20} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 rounded-2xl bg-zenit-scarlet text-white flex items-center justify-center shadow-xl shadow-zenit-scarlet/20"
              >
                <Plus size={28} />
              </motion.button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-zenit-scarlet border-t-transparent rounded-full animate-spin shadow-lg shadow-zenit-scarlet/20" />
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === 'exercises' && exercises.map((ex) => (
              <motion.div 
                key={ex.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex items-center justify-between border-zenit-border-secondary bg-zenit-surface-1/50 hover:bg-zenit-surface-2 transition-all group"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-2xl bg-zenit-surface-2 flex items-center justify-center overflow-hidden border border-zenit-border-primary">
                    <img src={`https://picsum.photos/seed/${ex.id}/200/200`} alt="" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zenit-text-primary tracking-tight">{ex.title}</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-zenit-scarlet font-bold uppercase tracking-widest bg-zenit-scarlet/10 px-2 py-0.5 rounded-lg">{ex.category}</span>
                      <span className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-widest">{ex.difficulty}</span>
                      <span className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-widest">{ex.duration}</span>
                      <span className="text-[10px] text-zenit-accent font-bold uppercase tracking-widest">+{ex.xp_reward} XP</span>
                      {ex.is_premium && <Shield size={12} className="text-yellow-500" />}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(ex.id)}
                  className="p-4 text-zenit-text-tertiary hover:text-red-500 transition-all rounded-2xl hover:bg-red-500/10"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}

            {activeTab === 'users' && filteredUsers.map((user) => (
              <motion.div 
                key={user.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex items-center justify-between border-zenit-border-secondary bg-zenit-surface-1/50 hover:bg-zenit-surface-2 transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 rounded-2xl bg-zenit-scarlet/10 flex items-center justify-center border border-zenit-scarlet/20">
                    <span className="text-zenit-scarlet font-display font-bold text-xl">{user.email?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zenit-text-primary tracking-tight">{user.display_name || user.email}</h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${user.subscription_tier !== 'basic' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zenit-surface-2 text-zenit-text-tertiary'}`}>
                        {user.subscription_tier || 'Free'}
                      </span>
                      <span className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-widest">XP: {user.xp || 0}</span>
                      {user.is_admin && <span className="text-[9px] text-zenit-scarlet font-bold uppercase tracking-widest bg-zenit-scarlet/10 px-2 py-0.5 rounded-lg">Admin</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setNewTier(user.subscription_tier || 'Free');
                    }}
                    className="p-4 text-zenit-text-tertiary hover:text-zenit-scarlet transition-all rounded-2xl hover:bg-zenit-scarlet/10"
                  >
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-4 text-zenit-text-tertiary hover:text-red-500 transition-all rounded-2xl hover:bg-red-500/10"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      {/* User Management Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zenit-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card w-full max-w-md p-10 space-y-8 bg-zenit-black border-zenit-border-primary"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary">Gerenciar Usuário</h2>
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest">{selectedUser.display_name || selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-12 h-12 rounded-2xl bg-zenit-surface-1 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Plano de Assinatura</label>
                  <select 
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all appearance-none text-sm"
                  >
                    <option value="basic">Básico</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                    <option value="annual">Anual</option>
                    <option value="lifetime">Vitalício</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-zenit-surface-1 rounded-2xl border border-zenit-border-primary">
                  <div className="flex items-center space-x-3">
                    <Shield size={18} className="text-zenit-scarlet" />
                    <label className="text-[10px] text-zenit-text-secondary uppercase tracking-widest font-bold">Privilégios Admin</label>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedUser.is_admin}
                    onChange={async (e) => {
                      const { error } = await supabase
                        .from('users')
                        .update({ is_admin: e.target.checked })
                        .eq('id', selectedUser.id);
                      if (!error) {
                        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, is_admin: e.target.checked } : u));
                        setSelectedUser({ ...selectedUser, is_admin: e.target.checked });
                      }
                    }}
                    className="w-6 h-6 rounded-lg border-zenit-border-primary bg-zenit-surface-2 text-zenit-scarlet focus:ring-zenit-scarlet"
                  />
                </div>

                <button 
                  onClick={handleUpdateTier}
                  className="w-full py-6 rounded-2xl bg-zenit-scarlet text-white text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-zenit-scarlet/20 hover:shadow-zenit-scarlet/40 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zenit-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card w-full max-w-lg p-10 space-y-8 bg-zenit-black border-zenit-border-primary overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary">Novo Exercício</h2>
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest">Expanda o catálogo neural</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-2xl bg-zenit-surface-1 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Título</label>
                  <input 
                    type="text" 
                    value={newExercise.title}
                    onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                    className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all"
                    placeholder="Nome do exercício..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">URL do Vídeo (YouTube Embed)</label>
                  <input 
                    type="text" 
                    value={newExercise.video_url}
                    onChange={(e) => setNewExercise({ ...newExercise, video_url: e.target.value })}
                    className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Duração</label>
                    <input 
                      type="text" 
                      value={newExercise.duration}
                      onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
                      className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all text-sm"
                      placeholder="Ex: 15 min"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Recompensa XP</label>
                    <input 
                      type="number" 
                      value={newExercise.xp_reward}
                      onChange={(e) => setNewExercise({ ...newExercise, xp_reward: parseInt(e.target.value) })}
                      className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Categoria</label>
                    <select 
                      value={newExercise.category}
                      onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                      className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all appearance-none text-sm"
                    >
                      <option value="training">Treino</option>
                      <option value="body">Corpo</option>
                      <option value="mind">Mente</option>
                      <option value="spirituality">Espírito</option>
                      <option value="nutrition">Nutrição</option>
                      <option value="yoga">Yoga</option>
                      <option value="split">Divisões</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Dificuldade</label>
                    <select 
                      value={newExercise.difficulty}
                      onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                      className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all appearance-none text-sm"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold ml-1">Descrição</label>
                  <textarea 
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                    className="w-full bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl py-4 px-6 text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet transition-all h-32 resize-none text-sm"
                    placeholder="Instruções de execução..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zenit-surface-1 rounded-2xl border border-zenit-border-primary">
                  <div className="flex items-center space-x-3">
                    <Shield size={18} className="text-yellow-500" />
                    <label className="text-[10px] text-zenit-text-secondary uppercase tracking-widest font-bold">Conteúdo Premium</label>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={newExercise.is_premium}
                    onChange={(e) => setNewExercise({ ...newExercise, is_premium: e.target.checked })}
                    className="w-6 h-6 rounded-lg border-zenit-border-primary bg-zenit-surface-2 text-zenit-scarlet focus:ring-zenit-scarlet"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-6 rounded-2xl bg-zenit-scarlet text-white text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-zenit-scarlet/20 hover:shadow-zenit-scarlet/40 transition-all"
                >
                  Salvar Exercício
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zenit-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm p-10 space-y-8 bg-zenit-black border-zenit-border-primary"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zenit-scarlet/10 flex items-center justify-center mx-auto mb-6 border border-zenit-scarlet/20">
                  <AlertTriangle className="text-zenit-scarlet" size={32} />
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic">{confirmAction.title}</h3>
                <p className="text-xs text-zenit-text-tertiary leading-relaxed">{confirmAction.message}</p>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-4 rounded-2xl bg-zenit-surface-1 text-zenit-text-tertiary text-[10px] font-bold uppercase tracking-widest hover:bg-zenit-surface-2 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAction.onConfirm}
                  className="flex-1 py-4 rounded-2xl bg-zenit-scarlet text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-zenit-scarlet/20 hover:shadow-zenit-scarlet/40 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center space-x-4 ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <AlertCircle size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-4 text-zenit-text-tertiary hover:text-zenit-text-primary">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="glass-card p-6 space-y-4 border-zenit-border-secondary bg-zenit-surface-1/50 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-1 bg-zenit-scarlet/10 group-hover:bg-zenit-scarlet/30 transition-all" />
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary group-hover:text-zenit-scarlet transition-all">
        {icon}
      </div>
      <p className="text-3xl font-display font-bold text-zenit-text-primary tracking-tighter">{value}</p>
    </div>
    <p className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-widest">{label}</p>
  </div>
);

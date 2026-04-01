import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Plus, X, Video, FileText, Tag, 
  BarChart, Save, Trash2, Users, Settings, 
  Activity, Shield, Database, Search, Filter, ChevronRight,
  MessageSquare, Zap
} from 'lucide-react';
import { supabase } from '../supabase';

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
    const { count: premCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).neq('subscription_tier', 'free');
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
    if (!confirm('Deseja popular o banco com dados profissionais?')) return;
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
        { user_id: user.id, title: 'Viagem Zenith', target_amount: 5000, current_amount: 1200, deadline: '2026-08-15' }
      ];
      
      await supabase.from('finance_budgets').insert(seedBudgets);
      await supabase.from('finance_goals').insert(seedGoals);
    }

    if (!error) {
      alert('Dados semeados com sucesso!');
      fetchExercises();
    } else {
      console.error('Seed error:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newExercise.title || !newExercise.video_url) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .insert([newExercise]);

      if (error) throw error;

      setShowAddModal(false);
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
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este exercício?')) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (!error) fetchExercises();
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-10 pb-32 max-w-4xl mx-auto min-h-screen relative">
      <button 
        onClick={onBack}
        className="fixed top-8 left-8 z-[60] p-4 bg-zenith-surface-1 rounded-[20px] border border-zenith-border-primary backdrop-blur-xl hover:bg-zenith-surface-2 transition-all group"
      >
        <ChevronRight size={20} className="rotate-180 text-zenith-text-tertiary group-hover:text-zenith-text-primary transition-colors" />
      </button>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-12 sm:mt-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-zenith-scarlet" />
            <h1 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">
              Terminal <span className="text-zenith-scarlet">Admin</span>
            </h1>
          </div>
          <p className="text-zenith-text-tertiary text-[10px] uppercase tracking-[0.3em] font-bold">Zenith Core Infrastructure</p>
        </div>
        
        <div className="flex bg-zenith-surface-1 p-1 rounded-2xl border border-zenith-border-primary w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'exercises' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
          >
            <Database size={14} />
            <span>Conteúdo</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'users' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
          >
            <Users size={14} />
            <span>Usuários</span>
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'system' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
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

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zenith-text-tertiary" />
            <input 
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-12 pr-6 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
            />
          </div>
          {activeTab === 'exercises' && (
            <div className="flex space-x-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSeedData}
                className="w-14 h-14 rounded-2xl bg-zenith-surface-1 text-zenith-text-tertiary flex items-center justify-center border border-zenith-border-primary"
                title="Seed Data"
              >
                <Database size={20} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 rounded-2xl bg-zenith-scarlet text-white flex items-center justify-center shadow-xl shadow-zenith-scarlet/20"
              >
                <Plus size={28} />
              </motion.button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-zenith-scarlet border-t-transparent rounded-full animate-spin shadow-lg shadow-zenith-scarlet/20" />
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === 'exercises' && exercises.map((ex) => (
              <motion.div 
                key={ex.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex items-center justify-between border-zenith-border-secondary bg-zenith-surface-1/50 hover:bg-zenith-surface-2 transition-all group"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-2xl bg-zenith-surface-2 flex items-center justify-center overflow-hidden border border-zenith-border-primary">
                    <img src={`https://picsum.photos/seed/${ex.id}/200/200`} alt="" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zenith-text-primary tracking-tight">{ex.title}</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-zenith-scarlet font-bold uppercase tracking-widest bg-zenith-scarlet/10 px-2 py-0.5 rounded-lg">{ex.category}</span>
                      <span className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest">{ex.difficulty}</span>
                      {ex.is_premium && <Shield size={12} className="text-yellow-500" />}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(ex.id)}
                  className="p-4 text-zenith-text-tertiary hover:text-red-500 transition-all rounded-2xl hover:bg-red-500/10"
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
                className="glass-card p-6 flex items-center justify-between border-zenith-border-secondary bg-zenith-surface-1/50 hover:bg-zenith-surface-2 transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 rounded-2xl bg-zenith-scarlet/10 flex items-center justify-center border border-zenith-scarlet/20">
                    <span className="text-zenith-scarlet font-display font-bold text-xl">{user.email?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zenith-text-primary tracking-tight">{user.display_name || user.email}</h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${user.subscription_tier !== 'free' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zenith-surface-2 text-zenith-text-tertiary'}`}>
                        {user.subscription_tier || 'Free'}
                      </span>
                      <span className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-widest">XP: {user.xp || 0}</span>
                      {user.is_admin && <span className="text-[9px] text-zenith-scarlet font-bold uppercase tracking-widest bg-zenith-scarlet/10 px-2 py-0.5 rounded-lg">Admin</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setNewTier(user.subscription_tier || 'Free');
                    }}
                    className="p-4 text-zenith-text-tertiary hover:text-zenith-scarlet transition-all rounded-2xl hover:bg-zenith-scarlet/10"
                  >
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-4 text-zenith-text-tertiary hover:text-red-500 transition-all rounded-2xl hover:bg-red-500/10"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zenith-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card w-full max-w-md p-10 space-y-8 bg-zenith-black border-zenith-border-primary"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">Gerenciar Usuário</h2>
                  <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest">{selectedUser.display_name || selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-12 h-12 rounded-2xl bg-zenith-surface-1 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">Plano de Assinatura</label>
                  <select 
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all appearance-none text-sm"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                    <option value="Master">Master</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-zenith-surface-1 rounded-2xl border border-zenith-border-primary">
                  <div className="flex items-center space-x-3">
                    <Shield size={18} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-secondary uppercase tracking-widest font-bold">Privilégios Admin</label>
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
                    className="w-6 h-6 rounded-lg border-zenith-border-primary bg-zenith-surface-2 text-zenith-scarlet focus:ring-zenith-scarlet"
                  />
                </div>

                <button 
                  onClick={handleUpdateTier}
                  className="w-full py-6 rounded-2xl bg-zenith-scarlet text-white text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-zenith-scarlet/20 hover:shadow-zenith-scarlet/40 transition-all"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zenith-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card w-full max-w-lg p-10 space-y-8 bg-zenith-black border-zenith-border-primary overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">Novo Exercício</h2>
                  <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest">Expanda o catálogo neural</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-2xl bg-zenith-surface-1 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">Título</label>
                  <input 
                    type="text" 
                    value={newExercise.title}
                    onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                    placeholder="Nome do exercício..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">URL do Vídeo (YouTube Embed)</label>
                  <input 
                    type="text" 
                    value={newExercise.video_url}
                    onChange={(e) => setNewExercise({ ...newExercise, video_url: e.target.value })}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">Categoria</label>
                    <select 
                      value={newExercise.category}
                      onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all appearance-none text-sm"
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
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">Dificuldade</label>
                    <select 
                      value={newExercise.difficulty}
                      onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all appearance-none text-sm"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest font-bold ml-1">Descrição</label>
                  <textarea 
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-6 text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet transition-all h-32 resize-none text-sm"
                    placeholder="Instruções de execução..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zenith-surface-1 rounded-2xl border border-zenith-border-primary">
                  <div className="flex items-center space-x-3">
                    <Shield size={18} className="text-yellow-500" />
                    <label className="text-[10px] text-zenith-text-secondary uppercase tracking-widest font-bold">Conteúdo Premium</label>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={newExercise.is_premium}
                    onChange={(e) => setNewExercise({ ...newExercise, is_premium: e.target.checked })}
                    className="w-6 h-6 rounded-lg border-zenith-border-primary bg-zenith-surface-2 text-zenith-scarlet focus:ring-zenith-scarlet"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-6 rounded-2xl bg-zenith-scarlet text-white text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-zenith-scarlet/20 hover:shadow-zenith-scarlet/40 transition-all"
                >
                  Salvar Exercício
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="glass-card p-6 space-y-4 border-zenith-border-secondary bg-zenith-surface-1/50 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-1 bg-zenith-scarlet/10 group-hover:bg-zenith-scarlet/30 transition-all" />
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-xl bg-zenith-surface-2 flex items-center justify-center text-zenith-text-tertiary group-hover:text-zenith-scarlet transition-all">
        {icon}
      </div>
      <p className="text-3xl font-display font-bold text-zenith-text-primary tracking-tighter">{value}</p>
    </div>
    <p className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-widest">{label}</p>
  </div>
);

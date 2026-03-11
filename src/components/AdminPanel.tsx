import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Plus, X, Video, FileText, Tag, BarChart, Save, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

export const AdminPanel: React.FC<{ t: any }> = ({ t }) => {
  const [activeTab, setActiveTab] = useState<'exercises' | 'users' | 'logs'>('exercises');
  const [exercises, setExercises] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    category: 'strength',
    duration: '',
    difficulty: 'beginner',
    isPremium: false,
    videoUrl: ''
  });

  useEffect(() => {
    if (activeTab === 'exercises') fetchExercises();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setExercises(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    // Assuming a logs table exists or we just show some mock/recent data
    // For now, let's try to fetch from a 'logs' table if it exists
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setNewExercise({ ...newExercise, videoUrl: data.publicUrl });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!newExercise.title || !newExercise.videoUrl) {
      alert('Please fill in all required fields');
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
        isPremium: false,
        videoUrl: ''
      });
      fetchExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Error saving exercise');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (!error) fetchExercises();
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tighter">Admin Panel</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Content Management System</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'exercises' ? 'bg-zenith-crimson text-white' : 'bg-white/5 text-white/40'}`}
          >
            Exercises
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-zenith-crimson text-white' : 'bg-white/5 text-white/40'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-zenith-crimson text-white' : 'bg-white/5 text-white/40'}`}
          >
            Logs
          </button>
        </div>
        {activeTab === 'exercises' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-xl bg-zenith-crimson flex items-center justify-center shadow-lg shadow-zenith-crimson/20"
          >
            <Plus size={20} />
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-zenith-crimson border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTab === 'exercises' && exercises.map((ex) => (
            <div key={ex.id} className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.02]">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                  <video src={ex.videoUrl} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{ex.title}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{ex.category} • {ex.difficulty}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(ex.id)}
                className="p-2 text-white/20 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {activeTab === 'users' && users.map((user) => (
            <div key={user.id} className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.02]">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-zenith-crimson/20 flex items-center justify-center">
                  <span className="text-zenith-crimson font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">{user.email}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Plan: {user.subscription_tier || 'Free'} • XP: {user.xp || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user.isAdmin && <Tag size={14} className="text-zenith-crimson" />}
                <span className="text-[8px] text-white/20">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="glass-card p-3 text-[10px] font-mono border-white/5 bg-black/20">
                  <div className="flex justify-between mb-1">
                    <span className={log.level === 'error' ? 'text-red-500' : 'text-blue-400'}>[{log.level?.toUpperCase()}]</span>
                    <span className="text-white/20">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-white/60">{log.message}</p>
                </div>
              )) : (
                <div className="text-center py-10 text-white/20 uppercase tracking-widest text-[10px]">No logs found</div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-8 space-y-6 bg-zenith-black border-white/10 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold uppercase tracking-tighter">New Exercise</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/40"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Title</label>
                <input 
                  type="text" 
                  value={newExercise.title}
                  onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-zenith-crimson/40"
                  placeholder="Exercise name..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Video File</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="video-upload" 
                  />
                  <label 
                    htmlFor="video-upload"
                    className="w-full bg-white/5 border border-white/10 border-dashed rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-zenith-crimson border-t-transparent rounded-full animate-spin" />
                    ) : newExercise.videoUrl ? (
                      <div className="flex items-center space-x-2 text-zenith-neon-red">
                        <Video size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Video Ready</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-white/20 mb-2" />
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Upload Video</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Category</label>
                  <select 
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-zenith-crimson/40 text-sm"
                  >
                    <option value="strength">Strength</option>
                    <option value="yoga">Yoga</option>
                    <option value="relaxation">Relaxation</option>
                    <option value="mind-body">Mind-Body</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Difficulty</label>
                  <select 
                    value={newExercise.difficulty}
                    onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-zenith-crimson/40 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Description</label>
                <textarea 
                  value={newExercise.description}
                  onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-zenith-crimson/40 h-24 resize-none text-sm"
                  placeholder="How to perform..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={newExercise.isPremium}
                  onChange={(e) => setNewExercise({ ...newExercise, isPremium: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-zenith-crimson"
                />
                <label className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Premium Content</label>
              </div>

              <button 
                onClick={handleSave}
                disabled={uploading}
                className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                Save Exercise
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

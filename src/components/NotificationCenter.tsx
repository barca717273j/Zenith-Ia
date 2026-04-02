import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Zap, Target, Award, Sparkles, Shield, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'boost';
  read: boolean;
  created_at: string;
}

export const NotificationCenter: React.FC<{ userId: string }> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Zenith', {
            body: payload.new.title,
            icon: '/zenith-logo.png'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="text-yellow-500" size={18} />;
      case 'boost': return <Zap className="text-zenith-scarlet" size={18} />;
      case 'success': return <Sparkles className="text-emerald-500" size={18} />;
      case 'warning': return <Shield className="text-orange-500" size={18} />;
      case 'error': return <X className="text-red-500" size={18} />;
      default: return <Info className="text-zenith-cyan" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-zenith-scarlet text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-zenith-black">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 max-h-[480px] z-[90] glass-card bg-zenith-black/95 border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">Notificações</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest">{unreadCount} pendentes</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-zenith-scarlet font-bold uppercase tracking-widest hover:underline"
                  >
                    Ler tudo
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-start space-x-4 group ${n.read ? 'opacity-40 grayscale' : 'bg-white/[0.03] hover:bg-white/[0.05]'}`}
                    >
                      <div className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold text-white group-hover:text-zenith-scarlet transition-colors">{n.title}</p>
                        <p className="text-[10px] text-white/40 leading-relaxed">{n.message}</p>
                        <p className="text-[8px] text-white/10 font-mono">{new Date(n.created_at).toLocaleTimeString()}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-zenith-scarlet mt-2 shadow-[0_0_10px_rgba(255,38,33,0.5)]" />}
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-10">
                      <Bell size={32} />
                    </div>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Silêncio Absoluto</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

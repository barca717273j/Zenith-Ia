import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, User, Heart, MessageSquare, Share2, Plus, X, 
  Image as ImageIcon, Send, MoreHorizontal, Grid, 
  Bookmark, Shield, Award, Zap, Flame, Camera, 
  ChevronRight, ArrowLeft, Loader2, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Profile } from './Profile';
import { useGamification } from './GamificationContext';
import { useUser } from '../contexts/UserContext';
import { ensureBucketExists } from '../services/storageService';

interface SocialProps {
  t: any;
}

interface Post {
  id: string;
  user_id: string;
  caption: string;
  image_url?: string;
  type: 'thought' | 'achievement' | 'routine' | 'reflection';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: {
    display_name: string;
    username: string;
    avatar_url: string;
    level: number;
    role?: string;
  };
  is_liked?: boolean;
}

interface Pulse {
  id: string;
  user_id: string;
  image_url: string;
  content: string | null;
  created_at: string;
  user?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const Social: React.FC<SocialProps> = ({ t }) => {
  const { userData, refreshUserData, checkLimit, incrementUsage } = useUser();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'profile'>('feed');
  const [trendingTags, setTrendingTags] = useState<string[]>(['#ZenithIA', '#FocoTotal', '#Mindset', '#Biohacking', '#Disciplina']);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPulseModalOpen, setIsPulseModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<Post['type']>('thought');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulses, setPulses] = useState<any[]>([]);
  const [selectedPulse, setSelectedPulse] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { addXP } = useGamification();

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchPulses();
    
    // Click outside search to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPulses = async () => {
    try {
      // Pulses expire after 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('pulses')
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url
          )
        `)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPulses(data || []);
    } catch (error) {
      console.error('Error fetching pulses:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchPosts = async () => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url,
            level
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Check if current user liked these posts
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userData.id);

      const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);

      const formattedPosts = (postsData || []).map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id)
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url, level')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!userData?.id || (!newPostContent.trim() && !newPostImage)) return;
    
    const limitCheck = await checkLimit('posts');
    if (!limitCheck.allowed) {
      setError(limitCheck.message || 'Limite de posts diários atingido. Faça upgrade para continuar.');
      return;
    }

    setIsPublishing(true);

    try {
      let imageUrl = null;

      if (newPostImage) {
        // Ensure bucket exists
        await ensureBucketExists('post-images');

        const fileExt = newPostImage.name.split('.').pop();
        const fileName = `${userData.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, newPostImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('posts').insert([{
        user_id: userData.id,
        caption: newPostContent,
        image_url: imageUrl,
        type: newPostType,
        likes_count: 0,
        comments_count: 0
      }]);

      if (error) throw error;

      await incrementUsage('posts');
      await addXP(25); // Reward for posting
      setIsCreateModalOpen(false);
      setNewPostContent('');
      setNewPostImage(null);
      setImagePreview(null);
      setError(null);
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreatePulse = async () => {
    if (!userData?.id || !newPostImage) return;
    
    const limitCheck = await checkLimit('posts');
    if (!limitCheck.allowed) {
      setError(limitCheck.message || 'Limite de posts diários atingido. Faça upgrade para continuar.');
      return;
    }

    setIsPublishing(true);
    try {
      // Ensure bucket exists
      await ensureBucketExists('post-images');

      const fileExt = newPostImage.name.split('.').pop();
      const fileName = `${userData.id}/pulses/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, newPostImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('pulses')
        .insert([
          {
            user_id: userData.id,
            image_url: publicUrl,
            content: newPostContent,
          }
        ]);

      if (error) throw error;

      await incrementUsage('posts');
      setNewPostContent('');
      setNewPostImage(null);
      setImagePreview(null);
      setIsPulseModalOpen(false);
      setError(null);
      fetchPulses();
      addXP(30);
    } catch (error: any) {
      console.error('Error creating pulse:', error);
      setError(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!userData?.id) return;
    
    if (!isLiked) {
      const limitCheck = await checkLimit('actions');
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Limite de interações diárias atingido. Faça upgrade para continuar.');
        return;
      }
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userData.id);
        
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userData.id }]);
        
        await supabase.rpc('increment_likes', { post_id: postId });
        await incrementUsage('actions');
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 } 
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderFeed = () => (
    <div className="space-y-4 pb-24">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-zenith-scarlet animate-spin" />
          <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.social.syncing || 'Sincronizando'} {t.social.feed}...</p>
        </div>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={() => handleLike(post.id, !!post.is_liked)}
            onViewProfile={() => {
              setSelectedUserId(post.user_id);
              setActiveTab('profile');
            }}
            onViewComments={() => setSelectedPost(post)}
          />
        ))
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zenith-surface-1 flex items-center justify-center mx-auto border border-zenith-border-secondary">
            <Zap className="w-8 h-8 text-zenith-text-tertiary" />
          </div>
          <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.social.noPosts || 'Nenhum sinal no'} {t.social.feed}</p>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <Profile 
      t={t} 
      targetUserId={selectedUserId || userData?.id} 
    />
  );

  const renderDiscover = () => (
    <div className="space-y-8 pb-24">
      {/* Trending Tags */}
      <div className="flex flex-wrap gap-3 px-2">
        {trendingTags.map((tag) => (
          <button 
            key={tag}
            className="px-6 py-3 bg-zenith-surface-1 border border-zenith-border-primary rounded-full text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary hover:text-zenith-scarlet hover:border-zenith-scarlet/50 transition-all shadow-inner"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Suggested Users */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zenith-text-tertiary px-2">Mentes em Ascensão</h3>
        <div className="grid grid-cols-1 gap-4">
          {searchResults.length > 0 ? searchResults.map((user) => (
            <div key={user.id} className="glass-card p-6 flex items-center justify-between border-zenith-border-primary bg-zenith-surface-1/50 rounded-[2.5rem]">
              <div className="flex items-center space-x-4">
                <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-12 h-12 rounded-full border border-zenith-border-secondary" />
                <div>
                  <p className="text-sm font-bold text-zenith-text-primary">@{user.username}</p>
                  <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest">Nível {user.level}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserId(user.id);
                  setActiveTab('profile');
                }}
                className="px-6 py-3 bg-zenith-scarlet text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-zenith-scarlet/20"
              >
                Ver Perfil
              </button>
            </div>
          )) : (
            <div className="text-center py-10 opacity-30">
              <p className="text-[10px] font-bold uppercase tracking-widest">Pesquise para descobrir novas mentes</p>
            </div>
          )}
        </div>
      </div>

      {/* Popular Posts Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zenith-text-tertiary px-2">Explorar Nexus</h3>
        <div className="grid grid-cols-2 gap-4">
          {posts.filter(p => p.image_url).slice(0, 6).map((post) => (
            <motion.div 
              key={post.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPost(post)}
              className="aspect-square rounded-[2rem] overflow-hidden border border-zenith-border-secondary relative group cursor-pointer"
            >
              <img src={post.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-zenith-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="flex items-center space-x-2 text-white">
                  <Heart size={12} fill="currentColor" />
                  <span className="text-[10px] font-bold">{post.likes_count}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zenith-black text-zenith-text-primary font-sans selection:bg-zenith-scarlet/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zenith-nav backdrop-blur-2xl border-b border-zenith-border-secondary px-4 h-16 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center space-x-3">
          {selectedUserId && activeTab === 'profile' ? (
            <button 
              onClick={() => {
                setSelectedUserId(null);
                setActiveTab('feed');
              }}
              className="p-2 bg-zenith-surface-1 hover:bg-zenith-surface-2 rounded-xl transition-all active:scale-90"
            >
              <ArrowLeft size={18} className="text-zenith-text-primary" />
            </button>
          ) : (
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-black tracking-tighter uppercase italic text-zenith-scarlet leading-none">{t.social.title}</h1>
              <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-zenith-text-tertiary mt-0.5">Neural Network</span>
            </div>
          )}
        </div>

        {/* Search Bar - Fixed Width */}
        <div className="flex-1 max-w-[180px] sm:max-w-xs mx-4 relative" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zenith-text-tertiary group-focus-within:text-zenith-scarlet transition-colors" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zenith-surface-1 border border-zenith-border-secondary rounded-xl py-2 pl-9 pr-3 text-[11px] focus:outline-none focus:border-zenith-scarlet/30 focus:bg-zenith-surface-2 transition-all placeholder:text-zenith-text-tertiary font-medium text-zenith-text-primary"
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isSearching && searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setActiveTab('profile');
                      setIsSearching(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 flex items-center space-x-3 hover:bg-zenith-surface-2 transition-colors border-b border-zenith-border-secondary last:border-0"
                  >
                    <img 
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                      className="w-8 h-8 rounded-full object-cover border border-zenith-border-primary"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-zenith-text-primary">{user.display_name}</p>
                      <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => {
            setSelectedUserId(null);
            setActiveTab('profile');
          }}
          className={`relative p-2 rounded-xl transition-all duration-300 ${activeTab === 'profile' && !selectedUserId ? 'bg-zenith-scarlet text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'bg-zenith-surface-1 text-zenith-text-tertiary hover:bg-zenith-surface-2 hover:text-zenith-text-primary'}`}
        >
          <User size={18} />
        </button>
      </header>

      {/* Pulse Section (Stories) */}
      {activeTab === 'feed' && (
        <div className="bg-zenith-black border-b border-zenith-border-secondary py-6 overflow-x-auto scrollbar-hide">
          <div className="flex px-4 space-x-6">
            {/* Create Pulse Button */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPulseModalOpen(true)}
                className="w-16 h-16 rounded-[2rem] p-0.5 bg-gradient-to-tr from-zenith-scarlet to-zenith-crimson relative group"
              >
                <div className="w-full h-full rounded-[1.9rem] bg-zenith-black flex items-center justify-center border-2 border-zenith-black overflow-hidden relative">
                  <img src={userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.username}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus size={20} className="text-white" />
                  </div>
                </div>
              </motion.button>
              <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-[0.2em]">{t.common.you || 'Você'}</span>
            </div>
            
            {/* Real Pulse Items */}
            {pulses.map((pulse) => (
              <motion.button 
                key={pulse.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPulse(pulse)}
                className="flex flex-col items-center space-y-2 flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-[2rem] p-0.5 bg-zenith-surface-2 ring-2 ring-zenith-scarlet/40 ring-offset-2 ring-offset-zenith-black">
                  <div className="w-full h-full rounded-[1.9rem] bg-zenith-black flex items-center justify-center border-2 border-zenith-black overflow-hidden">
                    <img src={pulse.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pulse.user.username}`} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[8px] font-bold text-zenith-text-secondary uppercase tracking-[0.2em] truncate max-w-[64px]">
                  {pulse.user.display_name.split(' ')[0]}
                </span>
              </motion.button>
            ))}

            {pulses.length === 0 && [1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0 opacity-20">
                <div className="w-16 h-16 rounded-[2rem] p-0.5 bg-zenith-surface-1">
                  <div className="w-full h-full rounded-[1.9rem] bg-zenith-black flex items-center justify-center border-2 border-zenith-black overflow-hidden">
                    <div className="w-full h-full bg-zenith-surface-1" />
                  </div>
                </div>
                <div className="w-8 h-1.5 bg-zenith-surface-1 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fluxo Tab */}
      {(activeTab === 'feed' || activeTab === 'discover') && (
        <div className="flex border-b border-zenith-border-secondary bg-zenith-black/40 backdrop-blur-md sticky top-16 z-40">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-4 text-[9px] font-bold uppercase tracking-[0.4em] text-center transition-all relative ${activeTab === 'feed' ? 'text-zenith-text-primary' : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
          >
            Fluxo
            {activeTab === 'feed' && <motion.div layoutId="social-tab-indicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zenith-scarlet" />}
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-4 text-[9px] font-bold uppercase tracking-[0.4em] text-center transition-all relative ${activeTab === 'discover' ? 'text-zenith-text-primary' : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
          >
            Descobrir
            {activeTab === 'discover' && <motion.div layoutId="social-tab-indicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zenith-scarlet" />}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto flex flex-col gap-4 p-4">
        {activeTab === 'feed' ? renderFeed() : activeTab === 'discover' ? renderDiscover() : renderProfile()}
      </main>


      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && userData && (
          <PostDetailModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
            userData={userData}
          />
        )}
      </AnimatePresence>

      {/* FAB with Options */}
      {(activeTab === 'feed' || activeTab === 'profile') && (
        <div className="fixed bottom-44 right-6 flex flex-col items-end space-y-4 z-50">
          <AnimatePresence>
            {isFabOpen && (
              <>
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsPulseModalOpen(true);
                    setIsFabOpen(false);
                  }}
                  className="flex items-center space-x-3 bg-zenith-surface-1 border border-zenith-border-primary px-4 py-3 rounded-2xl shadow-2xl group"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-text-secondary group-hover:text-zenith-text-primary transition-colors">{t.social.story}</span>
                  <div className="w-10 h-10 bg-zenith-crimson rounded-xl flex items-center justify-center">
                    <Camera size={18} className="text-white" />
                  </div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsFabOpen(false);
                  }}
                  className="flex items-center space-x-3 bg-zenith-surface-1 border border-zenith-border-primary px-4 py-3 rounded-2xl shadow-2xl group"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-text-secondary group-hover:text-zenith-text-primary transition-colors">{t.social.post}</span>
                  <div className="w-10 h-10 bg-zenith-scarlet rounded-xl flex items-center justify-center">
                    <ImageIcon size={18} className="text-white" />
                  </div>
                </motion.button>
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1, rotate: isFabOpen ? 45 : 5 }}
            whileTap={{ scale: 0.9, rotate: isFabOpen ? 45 : -5 }}
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 flex items-center justify-center transition-all duration-300 relative z-10 group ${isFabOpen ? 'bg-zenith-surface-2 border border-zenith-border-primary' : 'bg-gradient-to-br from-zenith-scarlet via-zenith-crimson to-zenith-neon-red shadow-[0_0_30px_rgba(255,0,0,0.4)]'}`}
            style={{ 
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
            }}
          >
            <Plus size={28} className={`text-white transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
            
            {/* Inner Glow */}
            {!isFabOpen && (
              <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none" style={{ clipPath: 'inherit' }} />
            )}
            
            {/* Animated Ring */}
            {!isFabOpen && (
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-2 border-zenith-scarlet/20 -z-10 blur-sm"
                style={{ clipPath: 'inherit' }}
              />
            )}
          </motion.button>
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zenith-surface-1 border border-zenith-border-secondary rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-zenith-border-secondary flex items-center justify-between">
                <h2 className="text-base font-display font-bold uppercase tracking-tight text-zenith-text-primary">{t.social.post}</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-zenith-surface-2 rounded-full transition-colors">
                  <X size={18} className="text-zenith-text-tertiary" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
                {/* Post Type Selector */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(['thought', 'achievement', 'routine', 'reflection'] as Post['type'][]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewPostType(type)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                        newPostType === type 
                          ? 'bg-zenith-scarlet border-zenith-scarlet text-white shadow-lg shadow-zenith-scarlet/20' 
                          : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:bg-zenith-surface-2'
                      }`}
                    >
                      {type === 'thought' ? 'Pensamento' : type === 'achievement' ? 'Conquista' : type === 'routine' ? 'Rotina' : 'Reflexão'}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] uppercase tracking-widest font-bold flex flex-col space-y-2">
                      <span>{error}</span>
                      {error.includes('post-images') && (
                        <button 
                          onClick={() => {
                            const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);`;
                            navigator.clipboard.writeText(sql);
                            alert('SQL copiado! Cole no SQL Editor do seu Supabase e execute.');
                          }}
                          className="bg-red-500/20 px-2 py-1 rounded text-[8px] self-start hover:bg-red-500/30 transition-all"
                        >
                          Copiar SQL para criar pastas
                        </button>
                      )}
                    </div>
                  )}
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="O que está em sua mente?"
                    className="w-full bg-transparent text-base text-zenith-text-primary placeholder:text-zenith-text-tertiary focus:outline-none min-h-[100px] resize-none"
                  />

                  {imagePreview && (
                    <div className="relative rounded-2xl overflow-hidden border border-zenith-border-secondary aspect-[4/5]">
                      <img src={imagePreview} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setNewPostImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-zenith-black/60 backdrop-blur-md rounded-full text-zenith-text-primary hover:bg-zenith-black/80 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-zenith-border-secondary">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-zenith-surface-1 rounded-xl border border-zenith-border-primary cursor-pointer hover:bg-zenith-surface-2 transition-all">
                    <ImageIcon size={16} className="text-zenith-scarlet" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-text-secondary">Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>

                  <button
                    onClick={handleCreatePost}
                    disabled={isPublishing || (!newPostContent.trim() && !newPostImage)}
                    className="px-6 py-3 bg-zenith-text-primary text-zenith-black rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] flex items-center space-x-2 disabled:opacity-50 hover:opacity-90 transition-all"
                  >
                    {isPublishing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pulse Detail Modal (Viewer) */}
      <AnimatePresence>
        {selectedPulse && (
          <PulseViewer 
            pulse={selectedPulse} 
            onClose={() => setSelectedPulse(null)} 
          />
        )}
      </AnimatePresence>

      {/* Create Pulse Modal */}
      <AnimatePresence>
        {isPulseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPulseModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zenith-surface-1 border border-zenith-border-secondary rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-display font-bold text-zenith-text-primary uppercase italic tracking-tight">Novo <span className="text-zenith-scarlet">Pulse</span></h3>
                    <p className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em]">Momento Efêmero</p>
                  </div>
                  <button onClick={() => setIsPulseModalOpen(false)} className="w-12 h-12 rounded-2xl bg-zenith-surface-2 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary transition-all border border-zenith-border-secondary shadow-inner">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] uppercase tracking-widest font-bold flex flex-col space-y-3">
                      <span>{error}</span>
                      {error.includes('post-images') && (
                        <button 
                          onClick={() => {
                            const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);`;
                            navigator.clipboard.writeText(sql);
                            alert('SQL copiado! Cole no SQL Editor do seu Supabase e execute.');
                          }}
                          className="bg-red-500/20 px-3 py-2 rounded-xl text-[8px] self-start hover:bg-red-500/30 transition-all"
                        >
                          Copiar SQL para criar pastas
                        </button>
                      )}
                    </div>
                  )}

                  <div 
                    onClick={() => !imagePreview && document.getElementById('pulse-image')?.click()}
                    className="aspect-[9/16] w-full bg-zenith-surface-2 rounded-[2.5rem] border-2 border-dashed border-zenith-border-primary flex flex-col items-center justify-center cursor-pointer hover:border-zenith-scarlet/50 transition-all overflow-hidden group relative shadow-inner"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-zenith-black/20 group-hover:bg-zenith-black/40 transition-all" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewPostImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-4 right-4 p-3 bg-zenith-black/60 backdrop-blur-md rounded-full text-zenith-text-primary hover:bg-zenith-black/80 transition-all shadow-lg"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-zenith-scarlet/10 flex items-center justify-center border border-zenith-scarlet/20 shadow-inner">
                          <Camera size={36} className="text-zenith-scarlet" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-tertiary">{t.social.captureMoment}</p>
                      </div>
                    )}
                    <input id="pulse-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>

                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={t.social.pulsePlaceholder}
                    className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl p-5 text-sm text-zenith-text-primary placeholder:text-zenith-text-tertiary/40 focus:outline-none focus:border-zenith-scarlet/30 transition-all resize-none shadow-inner"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCreatePulse}
                  disabled={isPublishing || !newPostImage}
                  className="w-full py-6 bg-zenith-text-primary text-zenith-black rounded-[2rem] text-[11px] font-bold uppercase tracking-[0.4em] flex items-center justify-center space-x-3 disabled:opacity-50 hover:opacity-90 transition-all shadow-2xl shadow-zenith-text-primary/10"
                >
                  {isPublishing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>{t.social.activatePulse}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PulseViewer: React.FC<{ pulse: Pulse; onClose: () => void }> = ({ pulse, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onClose();
          return 100;
        }
        return prev + 0.5; // Slower progress for better viewing
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zenith-black">
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="relative w-full h-full max-w-lg overflow-hidden sm:rounded-[3rem] sm:h-[90vh] sm:border sm:border-zenith-border-secondary"
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-6 z-30 flex space-x-1.5">
          <div className="h-1 flex-1 bg-zenith-text-primary/10 rounded-full overflow-hidden backdrop-blur-md">
            <motion.div 
              className="h-full bg-zenith-text-primary shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-10 left-0 right-0 px-6 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-zenith-scarlet to-zenith-crimson shadow-lg">
              <img 
                src={pulse.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pulse.user?.username}`} 
                className="w-full h-full rounded-full object-cover border-2 border-zenith-black"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-zenith-text-primary uppercase tracking-widest drop-shadow-md">{pulse.user?.display_name}</p>
              <p className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] drop-shadow-md">Protocolo Ativo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zenith-black/40 backdrop-blur-xl rounded-full text-zenith-text-secondary hover:text-zenith-text-primary transition-all border border-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="w-full h-full relative">
          <img 
            src={pulse.image_url} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zenith-black via-transparent to-zenith-black/60" />
          
          {pulse.content && (
            <div className="absolute bottom-20 left-0 right-0 px-10 text-center">
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-display italic text-zenith-text-primary leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              >
                {pulse.content}
              </motion.p>
            </div>
          )}
        </div>

        {/* Zenith Branding Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 opacity-40">
          <p className="text-[8px] font-bold uppercase tracking-[0.8em] text-zenith-text-tertiary">ZENITH PULSE SYSTEM</p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-zenith-text-tertiary to-transparent" />
        </div>
      </motion.div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post; onLike: () => void; onViewProfile: () => void; onViewComments: () => void }> = ({ post, onLike, onViewProfile, onViewComments }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTap = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        onLike();
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 1000);
    }
    lastTap.current = now;
  };

  const toggleLike = () => {
    onLike();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zenith-surface-1/40 backdrop-blur-md border border-zenith-border-secondary rounded-[2.5rem] overflow-hidden mb-6 group/card shadow-lg hover:shadow-2xl transition-all duration-500"
    >
      {/* Post Header */}
      <div className="p-5 flex items-center justify-between">
        <button onClick={onViewProfile} className="flex items-center space-x-4 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-zenith-scarlet to-orange-500 shadow-lg group-hover:scale-105 transition-transform">
              <img 
                src={post.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`} 
                className="w-full h-full rounded-full object-cover border-2 border-zenith-black"
                referrerPolicy="no-referrer"
              />
            </div>
            {post.user.role === 'admin' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zenith-scarlet rounded-full border-2 border-zenith-black flex items-center justify-center">
                <ShieldCheck size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <p className="text-sm font-bold text-zenith-text-primary group-hover:text-zenith-scarlet transition-colors tracking-tight">
                {post.user.display_name}
              </p>
              {post.user.role === 'admin' && (
                <span className="text-[7px] bg-zenith-scarlet/20 text-zenith-scarlet px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Staff</span>
              )}
            </div>
            <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">@{post.user.username}</p>
          </div>
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary hover:bg-zenith-surface-2 rounded-full transition-all">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Content */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        {post.image_url ? (
          <div className="aspect-[4/5] bg-zenith-black overflow-hidden relative group-hover/card:scale-[1.02] transition-transform duration-700">
            <img src={post.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zenith-black/40" />
            
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 2, opacity: 0, rotate: 20 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                  <Heart size={100} fill="#FF0000" className="text-zenith-scarlet drop-shadow-[0_0_30px_rgba(255,0,0,0.5)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-12 bg-gradient-to-br from-zenith-surface-2/30 to-transparent min-h-[250px] flex items-center justify-center text-center relative overflow-hidden group-hover/card:bg-zenith-surface-2/50 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border border-zenith-text-primary rounded-full" />
              <div className="absolute bottom-10 right-10 w-32 h-32 border border-zenith-scarlet rounded-full" />
            </div>
            <p className="text-2xl font-display italic text-zenith-text-secondary leading-relaxed relative z-10 tracking-tight drop-shadow-sm">
              "{post.caption}"
            </p>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button 
              onClick={toggleLike}
              className={`flex items-center space-x-2.5 transition-all active:scale-90 ${isLiked ? 'text-zenith-scarlet' : 'text-zenith-text-tertiary hover:text-zenith-text-primary'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={2} className={isLiked ? 'animate-bounce' : ''} />
              <span className="text-sm font-bold tracking-tight">{likesCount}</span>
            </button>
            <button 
              onClick={onViewComments}
              className="flex items-center space-x-2.5 text-zenith-text-tertiary hover:text-zenith-text-primary transition-all active:scale-90"
            >
              <MessageSquare size={24} strokeWidth={2} />
              <span className="text-sm font-bold tracking-tight">{post.comments_count}</span>
            </button>
            <button className="text-zenith-text-tertiary hover:text-zenith-text-primary transition-all active:scale-90">
              <Share2 size={24} strokeWidth={2} />
            </button>
          </div>
          <button className="text-zenith-text-tertiary hover:text-zenith-text-primary transition-all active:scale-90">
            <Bookmark size={24} strokeWidth={2} />
          </button>
        </div>

        {post.image_url && post.caption && (
          <div className="space-y-2">
            <p className="text-sm text-zenith-text-secondary leading-relaxed">
              <span className="font-bold mr-2 text-zenith-text-primary">@{post.user.username}</span>
              {post.caption}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-zenith-border-secondary/30">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zenith-scarlet animate-pulse" />
            <span className="px-2 py-0.5 bg-zenith-surface-2/50 border border-zenith-border-secondary rounded-full text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-[0.2em]">
              {post.type === 'thought' ? 'Pensamento' : post.type === 'achievement' ? 'Conquista' : post.type === 'routine' ? 'Rotina' : 'Reflexão'}
            </span>
          </div>
          <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-[0.2em]">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const PostDetailModal: React.FC<{ post: any; onClose: () => void; userData: any }> = ({ post, onClose, userData }) => {
  const { checkLimit, incrementUsage } = useUser();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userData?.id) return;

    const limitCheck = await checkLimit('actions');
    if (!limitCheck.allowed) {
      alert(limitCheck.message || 'Limite de interações diárias atingido. Faça upgrade para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: post.id,
          user_id: userData.id,
          content: newComment
        }])
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      
      await incrementUsage('actions');
      setComments([...comments, data]);
      setNewComment('');
      
      // Update comment count on post
      await supabase.rpc('increment_comments', { post_id: post.id });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zenith-black/95 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-zenith-surface-1 border border-zenith-border-secondary rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Post Media */}
        <div className="md:w-3/5 bg-zenith-black flex items-center justify-center border-r border-zenith-border-secondary overflow-hidden">
          {post.image_url ? (
            <img src={post.image_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-12 text-center">
              <p className="text-xl font-display italic text-zenith-text-primary leading-relaxed">"{post.caption}"</p>
            </div>
          )}
        </div>

        {/* Post Info & Comments */}
        <div className="md:w-2/5 flex flex-col bg-zenith-surface-1 overflow-hidden">
          <div className="p-6 border-b border-zenith-border-secondary flex items-center justify-between bg-zenith-surface-2/30">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-zenith-scarlet to-orange-500 shadow-lg">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-full h-full rounded-full border-2 border-zenith-black object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-bold text-zenith-text-primary block leading-none">{post.user?.display_name || 'User'}</span>
                <span className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest font-bold">@{post.user?.username}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-zenith-surface-2 rounded-full transition-colors border border-white/5">
              <X size={18} className="text-zenith-text-tertiary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {post.image_url && post.caption && (
              <div className="flex space-x-4">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-9 h-9 rounded-full flex-shrink-0 border border-white/10"
                />
                <div className="space-y-1">
                  <p className="text-[12px] text-zenith-text-secondary leading-relaxed">
                    <span className="font-bold text-zenith-text-primary mr-2">@{post.user?.username}</span>
                    {post.caption}
                  </p>
                  <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 size={24} className="text-zenith-scarlet animate-spin" />
                  <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">Sincronizando Neural Network...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={comment.id} 
                    className="flex space-x-4"
                  >
                    <img 
                      src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`} 
                      className="w-9 h-9 rounded-full flex-shrink-0 border border-white/10"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="bg-zenith-surface-2/50 p-3 rounded-2xl rounded-tl-none border border-white/5">
                        <p className="text-[12px] text-zenith-text-secondary leading-relaxed">
                          <span className="font-bold text-zenith-text-primary mr-2">@{comment.user?.username}</span>
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em] ml-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4 opacity-30">
                  <MessageSquare size={32} className="mx-auto text-zenith-text-tertiary" />
                  <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.4em] font-bold">Sem reflexões ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-6 border-t border-zenith-border-secondary bg-zenith-black/40 backdrop-blur-xl">
            <div className="relative group">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar reflexão..."
                className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-5 pr-14 text-[12px] focus:outline-none focus:border-zenith-scarlet/50 focus:bg-zenith-surface-2 transition-all shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-zenith-scarlet text-white rounded-xl disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zenith-scarlet/20"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

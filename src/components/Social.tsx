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
  content: string;
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

interface Story {
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

export const Nexus: React.FC<SocialProps> = ({ t }) => {
  const { userData, refreshUserData, checkLimit, incrementUsage } = useUser();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'profile'>('feed');
  const [trendingTags, setTrendingTags] = useState<string[]>(['#ZenitElite', '#ProtocoloSicrano', '#NeuralMind', '#Performance']);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNexusModalOpen, setIsNexusModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newNexusText, setNewNexusText] = useState('');
  const [newPostType, setNewPostType] = useState<Post['type']>('thought');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyItems, setStoryItems] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { addXP } = useGamification();

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    
    // Click outside search to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStories = async () => {
    try {
      // Stories expire after 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:profiles (
            display_name,
            username,
            avatar_url
          )
        `)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStoryItems(data || []);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      if (error.message === 'Failed to fetch') {
        setError('Erro de conexão ao carregar stories.');
      }
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
          user:profiles (
            display_name,
            username,
            avatar_url,
            level
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Check if current user liked these posts
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userData.id);

      if (likesError) throw likesError;

      const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);

      const formattedPosts = (postsData || []).map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id)
      }));

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error.message === 'Failed to fetch') {
        setError('Erro de conexão ao carregar o feed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
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
        content: newPostContent,
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

  const handleCreateNexus = async () => {
    if (!userData?.id || !newPostImage) return;
    
    const limitCheck = await checkLimit('stories');
    if (!limitCheck.allowed) {
      setError(limitCheck.message || 'Limite de stories diários atingido. Faça upgrade para continuar.');
      return;
    }

    setIsPublishing(true);
    try {
      // Ensure bucket exists
      await ensureBucketExists('post-images');

      const fileExt = newPostImage.name.split('.').pop();
      const fileName = `${userData.id}/nexus/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, newPostImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('stories')
        .insert([
          {
            user_id: userData.id,
            image_url: publicUrl,
            content: newNexusText,
          }
        ]);

      if (error) throw error;

      await incrementUsage('stories');
      setNewNexusText('');
      setNewPostImage(null);
      setImagePreview(null);
      setIsNexusModalOpen(false);
      setError(null);
      fetchStories();
      addXP(30);
    } catch (error: any) {
      console.error('Error creating story:', error);
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
          <Loader2 className="w-8 h-8 text-zenit-accent animate-spin" />
          <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-bold">{t.social.syncing || 'Sincronizando'} {t.social.feed}...</p>
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
          <div className="w-16 h-16 rounded-full bg-zenit-surface-1 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-zenit-text-tertiary" />
          </div>
          <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-bold">{t.social.noPosts || 'Nenhum sinal no'} {t.social.feed}</p>
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
    <div className="space-y-12 pb-32">
      {/* Neural Signal Anchors (Tags) */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-zenit-text-tertiary italic">Signal Anchors</h3>
        </div>
        <div className="flex flex-wrap gap-4 px-2">
          {trendingTags.map((tag) => (
            <button 
              key={tag}
              className="px-8 py-4 bg-zenit-glass border border-zenit-glass-border rounded-[2rem] text-[9px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary hover:text-zenit-text-primary hover:bg-zenit-surface-1 hover:border-zenit-accent/20 transition-all shadow-xl italic"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Rising Protocol Agents (Users) */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-zenit-text-tertiary italic">Rising Protocol Agents</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {searchResults.length > 0 ? searchResults.map((user) => (
            <div key={user.id} className="p-8 flex items-center justify-between bg-zenit-glass border border-zenit-glass-border rounded-[3rem] shadow-2xl group transition-all hover:bg-zenit-surface-1">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary p-0.5 overflow-hidden">
                  <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover transition-all duration-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-zenit-text-primary italic tracking-tighter uppercase leading-none">@{user.username}</p>
                  <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em] italic leading-none">Protocol Strength: {user.level * 120}pt</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserId(user.id);
                  setActiveTab('profile');
                }}
                className="w-12 h-12 flex items-center justify-center bg-zenit-text-primary text-zenit-black rounded-full hover:bg-zenit-accent hover:text-white transition-all active:scale-90"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )) : (
            <div className="text-center py-20 bg-zenit-glass border border-dashed border-zenit-glass-border rounded-[3rem]">
              <p className="text-[8px] font-black uppercase tracking-[0.6em] text-zenit-text-tertiary italic">Intercepte novas conexões neurais através do sinal de busca</p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Stream Archive (Popular Posts) */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-zenit-text-tertiary italic">Visual Stream Archive</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {posts.filter(p => p.image_url).slice(0, 4).map((post) => (
            <motion.div 
              key={post.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedPost(post)}
              className="aspect-[4/5] rounded-[3rem] overflow-hidden border border-zenit-glass-border relative group cursor-pointer shadow-2xl"
            >
              <img src={post.image_url} className="w-full h-full object-cover transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <div className="flex items-center space-x-3 text-white">
                  <Heart size={16} fill="currentColor" />
                  <span className="text-xs font-mono font-black italic tracking-tighter">{post.likes_count.toString().padStart(2, '0')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zenit-black text-zenit-text-primary font-sans selection:bg-zenit-accent/30 relative overflow-hidden">
      {/* Living Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-zenit-accent/5 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-zenit-accent/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-zenit-nav backdrop-blur-3xl px-8 h-24 flex items-center justify-between border-b border-zenit-border-primary">
        <div className="flex items-center space-x-6">
          {selectedUserId && activeTab === 'profile' ? (
            <button 
              onClick={() => {
                setSelectedUserId(null);
                setActiveTab('feed');
              }}
              className="w-12 h-12 flex items-center justify-center bg-zenit-glass hover:bg-zenit-surface-2 rounded-full transition-all active:scale-90 border border-zenit-glass-border shadow-2xl"
            >
              <ArrowLeft size={20} className="text-zenit-text-primary" />
            </button>
          ) : (
            <div className="flex flex-col">
              <h1 className="text-2xl font-display font-black tracking-tighter text-zenit-text-primary italic leading-none uppercase">
                NEXUS
              </h1>
              <div className="flex items-center space-x-3 mt-2 opacity-30">
                <div className="w-1 h-1 rounded-full bg-zenit-accent animate-ping" />
                <span className="text-[7.5px] font-black uppercase tracking-[0.5em] text-zenit-text-primary">Neural Net v5.1</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar - Fixed Width */}
        <div className="flex-1 max-w-[200px] sm:max-w-md mx-6 relative" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zenit-text-tertiary group-focus-within:text-zenit-accent transition-all" />
            <input 
              type="text"
              placeholder="Explorar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zenit-glass border border-zenit-glass-border rounded-[2rem] py-3.5 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-zenit-accent/20 focus:bg-zenit-surface-2 transition-all placeholder:text-zenit-text-tertiary/40 text-zenit-text-primary shadow-2xl"
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isSearching && searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-zenit-surface-1 rounded-3xl overflow-hidden z-50 border border-zenit-border-primary shadow-2xl p-2"
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
                    className="w-full p-3 flex items-center space-x-3 hover:bg-zenit-surface-2 rounded-2xl transition-colors"
                  >
                    <img 
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                      className="w-9 h-9 rounded-full object-cover border border-zenit-border-primary"
                    />
                    <div className="text-left">
                      <p className="text-xs font-black text-white">@{user.username}</p>
                      <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-widest opacity-40">Nível {user.level}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="w-10 h-10 flex items-center justify-center bg-zenit-surface-2 hover:bg-zenit-surface-3 rounded-full text-zenit-text-primary transition-all relative border border-zenit-border-primary shadow-sm"
          >
            <Plus size={20} strokeWidth={2.5} className={`transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
            
            {/* FAB Dropdown Menu */}
            <AnimatePresence>
              {isFabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-44 bg-zenit-surface-1/95 backdrop-blur-2xl border border-zenit-border-primary rounded-[2rem] shadow-2xl overflow-hidden p-2 z-[60]"
                >
                  <button
                    onClick={() => {
                      setIsNexusModalOpen(true);
                      setIsFabOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-zenit-surface-2 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zenit-crimson flex items-center justify-center">
                      <Camera size={14} className="text-white" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zenit-text-tertiary group-hover:text-zenit-text-primary">Nexus</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsFabOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-zenit-surface-2 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zenit-accent flex items-center justify-center">
                      <ImageIcon size={14} className="text-white" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zenit-text-tertiary group-hover:text-zenit-text-primary">Post</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Nexus Section (Stories) - Minimalist & Futuristic */}
      {activeTab === 'feed' && (
        <div className="bg-zenit-surface-1 py-8 border-b border-zenit-border-secondary relative z-10 overflow-hidden">
          {/* Futuristic Grid Line */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-zenit-accent/20 to-transparent" />
          
          <div className="flex px-6 space-x-6 items-center overflow-x-auto scrollbar-hide">
            {/* Create Nexus - Discrete Action */}
            <div className="flex flex-col items-center space-y-3 flex-shrink-0">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNexusModalOpen(true)}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-zenit-surface-2 border border-zenit-border-primary hover:border-zenit-accent/40 transition-colors group shadow-sm"
              >
                <Plus size={24} className="text-zenit-text-tertiary group-hover:text-zenit-accent transition-colors" />
              </motion.button>
              <span className="text-[7.5px] font-black text-zenit-text-tertiary uppercase tracking-[0.4em] italic">Capturar</span>
            </div>
            
            {/* Nexus Stream Items */}
            {storyItems.map((item) => (
              <motion.button 
                key={item.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStory(item)}
                className="flex flex-col items-center space-y-3 flex-shrink-0 group"
              >
                <div className="relative p-0.5 rounded-full ring-2 ring-zenit-accent/20 group-hover:ring-zenit-accent transition-all duration-500">
                  <div className="w-[60px] h-[60px] rounded-full overflow-hidden bg-zenit-black p-0.5">
                    <img 
                      src={item.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username}`} 
                      className="w-full h-full rounded-full object-cover transition-all duration-700" 
                    />
                  </div>
                </div>
                <span className="text-[8px] font-black text-zenit-text-tertiary uppercase tracking-[0.2em] italic truncate max-w-[64px]">
                  {item.user?.display_name.split(' ')[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Fluxo Tab */}
      {(activeTab === 'feed' || activeTab === 'discover') && (
        <div className="flex justify-center p-4">
          <div className="flex bg-zenit-surface-2 border border-zenit-border-primary rounded-full p-1 shadow-inner">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic transition-all relative ${activeTab === 'feed' ? 'bg-zenit-text-primary text-zenit-black shadow-xl' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
            >
              Fluxo
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={`px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic transition-all relative ${activeTab === 'discover' ? 'bg-zenit-text-primary text-zenit-black shadow-xl' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
            >
              Descobrir
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 pb-44 space-y-12">
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
              className="relative w-full max-w-sm bg-zenit-surface-1 rounded-[2.5rem] overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <h2 className="text-base font-display font-bold uppercase tracking-tight text-zenit-text-primary">{t.social.post}</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-zenit-surface-2 rounded-full transition-colors">
                  <X size={18} className="text-zenit-text-tertiary" />
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
                          ? 'bg-zenit-accent text-white' 
                          : 'bg-zenit-surface-1 text-zenit-text-tertiary hover:bg-zenit-surface-2'
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
                    </div>
                  )}

                  {imagePreview && (
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                      <img src={imagePreview} className="w-full h-full object-cover" />
                      
                      {/* Text Overlay Preview for Post */}
                      {newPostContent && (
                        <div className="absolute inset-0 flex items-center justify-center px-10 text-center pointer-events-none">
                          <p className="text-2xl font-display italic text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                            {newPostContent}
                          </p>
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          setNewPostImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-zenit-black/60 backdrop-blur-md rounded-full text-zenit-text-primary hover:bg-zenit-black/80 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zenit-text-tertiary ml-2">Texto na Imagem</label>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Escreva algo para aparecer na imagem..."
                      className="w-full bg-zenit-surface-2 rounded-2xl p-5 text-sm text-zenit-text-primary placeholder:text-zenit-text-tertiary/40 focus:outline-none focus:border-zenit-accent/30 transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-zenit-surface-1 rounded-xl cursor-pointer hover:bg-zenit-surface-2 transition-all">
                    <ImageIcon size={16} className="text-zenit-accent" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zenit-text-secondary">Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>

                  <button
                    onClick={handleCreatePost}
                    disabled={isPublishing || (!newPostContent.trim() && !newPostImage)}
                    className="px-6 py-3 bg-zenit-text-primary text-zenit-black rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] flex items-center space-x-2 disabled:opacity-50 hover:opacity-90 transition-all"
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

      {/* Story Detail Modal (Viewer) */}
      <AnimatePresence>
        {selectedStory && (
          <StoryViewer 
            story={selectedStory} 
            onClose={() => setSelectedStory(null)} 
          />
        )}
      </AnimatePresence>

      {/* Nexus Creation Modal (The Capture) */}
      <AnimatePresence>
        {isNexusModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNexusModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm bg-zenit-surface-1 border border-zenit-border-primary rounded-[4rem] overflow-hidden flex flex-col p-2 shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-display font-black text-zenit-text-primary uppercase italic tracking-tighter leading-none">NEXUS CAPTURE</h3>
                    <div className="flex items-center space-x-2">
                       <div className="w-1 h-1 rounded-full bg-zenit-accent animate-pulse" />
                       <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em]">Neural Stream v5.0</p>
                    </div>
                  </div>
                  <button onClick={() => setIsNexusModalOpen(false)} className="w-12 h-12 rounded-full bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-primary shadow-sm">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] uppercase tracking-widest font-black text-center">
                      {error}
                    </div>
                  )}

                  <div 
                    onClick={() => !imagePreview && document.getElementById('nexus-image')?.click()}
                    className="aspect-[3/4] w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-zenit-surface-3 transition-all overflow-hidden group relative shadow-inner"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40" />
                        
                        {newNexusText && (
                          <div className="absolute inset-0 flex items-center justify-center px-10 text-center pointer-events-none">
                            <p className="text-3xl font-display font-black italic text-white drop-shadow-2xl uppercase tracking-tighter">
                              {newNexusText}
                            </p>
                          </div>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewPostImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-6 right-6 p-3 bg-black/80 rounded-full text-white shadow-2xl"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center space-y-4 group-hover:scale-110 transition-transform duration-500">
                        <div className="w-20 h-20 rounded-[2rem] bg-zenit-surface-3 flex items-center justify-center border border-zenit-border-primary group-hover:bg-zenit-text-primary group-hover:text-zenit-black transition-all shadow-md">
                          <Camera size={32} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zenit-text-tertiary group-hover:text-zenit-text-primary">Abrir Sinal Visual</p>
                      </div>
                    )}
                    <input id="nexus-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-zenit-text-tertiary ml-2 italic">Mensagem Neural</label>
                    <input
                      value={newNexusText}
                      onChange={(e) => setNewNexusText(e.target.value)}
                      placeholder="ESCREVA SEU PROTOCOLO..."
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl p-5 text-xs font-black text-zenit-text-primary italic placeholder:text-zenit-text-tertiary/10 focus:outline-none focus:border-zenit-accent/30 transition-all uppercase tracking-widest shadow-inner"
                      maxLength={60}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateNexus}
                  disabled={isPublishing || !newPostImage}
                  className="w-full py-6 bg-zenit-text-primary text-zenit-black rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center space-x-3 disabled:opacity-20 hover:brightness-90 transition-all italic shadow-2xl"
                >
                  {isPublishing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Transmitir Nexus</span>
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

const StoryViewer: React.FC<{ story: any; onClose: () => void }> = ({ story, onClose }) => {
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black">
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="relative w-full h-full max-w-sm overflow-hidden sm:rounded-[4rem] sm:h-[85vh] border border-zenit-border-primary bg-zenit-surface-1 shadow-2xl"
      >
        {/* Cinematic Scanline Overlay */}
        <div className="absolute inset-x-0 top-0 h-1 z-30 bg-zenit-accent/20 blur-sm animate-scanline" />

        {/* Neural Sync Progress */}
        <div className="absolute top-0 left-0 right-0 p-8 z-30 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[7.5px] font-black text-zenit-text-tertiary uppercase tracking-[0.5em] italic">Neural Sync In-Progress...</span>
            <span className="text-[7.5px] font-mono text-zenit-text-tertiary">{Math.floor(progress)}%</span>
          </div>
          <div className="h-[2px] w-full bg-zenit-surface-2 rounded-full overflow-hidden backdrop-blur-md">
            <motion.div 
              className="h-full bg-zenit-accent shadow-[0_0_15px_var(--accent-glow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Neural Context Header */}
        <div className="absolute top-16 left-0 right-0 px-8 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="w-12 h-12 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary p-0.5 backdrop-blur-xl shadow-lg">
              <img 
                src={story.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user?.username}`} 
                className="w-full h-full rounded-[14px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left space-y-1">
              <p className="text-xs font-black text-zenit-text-primary uppercase tracking-[0.2em] italic leading-none">{story.user?.display_name}</p>
              <div className="flex items-center space-x-2">
                 <div className="w-1 h-1 rounded-full bg-zenit-accent animate-pulse" />
                 <p className="text-[7.5px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em] italic">Transmissão Ativa</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-zenit-surface-2 border border-zenit-border-primary backdrop-blur-xl rounded-full text-zenit-text-tertiary hover:text-zenit-text-primary transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Visual Stream Area */}
        <div className="w-full h-full relative">
          <img 
            src={story.image_url} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Digital Distortion Overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {story.content && (
            <div className="absolute inset-x-0 bottom-32 flex items-center justify-center px-12 text-center">
              <motion.p 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-display font-black italic text-white uppercase leading-none tracking-tighter drop-shadow-2xl"
              >
                {story.content}
              </motion.p>
            </div>
          )}
        </div>

        {/* Technical Footer Metadata */}
        <div className="absolute bottom-12 inset-x-0 px-8 flex items-center justify-between opacity-30 z-30">
          <div className="flex flex-col space-y-1">
            <span className="text-[7px] font-black text-white uppercase tracking-[0.5em]">Bit-Stream Alpha v5.1</span>
            <span className="text-[6px] font-mono text-white/50">HASH_{story.id.slice(0, 12).toUpperCase()}</span>
          </div>
          <div className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center">
             <Zap size={12} className="text-white" />
          </div>
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
      className="bg-zenit-glass border border-zenit-glass-border rounded-[3rem] overflow-hidden mb-12 group/card transition-all duration-700 relative shadow-2xl"
    >
      {/* Subtle Neural Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
      </div>

      {/* Header - Technical Context */}
      <div className="p-8 flex items-center justify-between relative z-10 border-b border-zenit-glass-border">
        <button onClick={onViewProfile} className="flex items-center space-x-6 group">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary group-hover:border-zenit-accent/40 transition-all duration-500 overflow-hidden flex items-center justify-center">
              <img 
                src={post.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`} 
                className="w-full h-full object-cover transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            {post.user.role === 'admin' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-zenit-accent flex items-center justify-center rounded-lg border border-zenit-black shadow-lg">
                <ShieldCheck size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="text-left space-y-1">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zenit-text-primary italic leading-none">
              {post.user.display_name}
            </h4>
            <div className="flex items-center space-x-3">
              <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.4em] italic leading-none">@{post.user.username}</p>
              <div className="w-1 h-3 bg-zenit-border-primary rounded-full" />
              <p className="text-[8px] text-zenit-accent font-black uppercase tracking-[0.2em] italic leading-none">LVL {post.user.level}</p>
            </div>
          </div>
        </button>
        <div className="flex items-center space-x-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 group/status animate-pulse">
             <div className="w-full h-full rounded-full bg-emerald-500 scale-50" />
           </div>
           <span className="text-[7.5px] font-black text-zenit-text-tertiary uppercase tracking-[0.4em] italic">Transmissão Ativa</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        {post.image_url ? (
          <div className="aspect-[4/5] bg-zenit-black relative transition-all duration-700 overflow-hidden">
            <img src={post.image_url} className="w-full h-full object-cover group-hover/card:scale-105 transition-all duration-[2s]" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            
            {/* Minimal Typography Overlay */}
            {post.content && (
              <div className="absolute inset-x-0 bottom-0 p-12 text-center pointer-events-none">
                <p className="text-2xl sm:text-3xl font-display font-black italic text-white leading-tight tracking-tighter uppercase drop-shadow-2xl">
                  {post.content}
                </p>
              </div>
            )}

            <AnimatePresence>
              {showHeartAnim && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                  <div className="w-24 h-24 rounded-full bg-zenit-accent flex items-center justify-center border border-white/20 shadow-2xl shadow-zenit-accent/40">
                    <Heart size={48} fill="#FFF" className="text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-20 bg-zenit-glass min-h-[400px] flex items-center justify-center text-center relative overflow-hidden group-hover/card:bg-zenit-surface-2 transition-all duration-700">
            <div className="absolute inset-0 bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03]" />
            <p className="text-3xl sm:text-4xl font-display font-black italic text-zenit-text-primary leading-tight relative z-10 tracking-tighter uppercase max-w-sm drop-shadow-2xl">
              {post.content}
            </p>
          </div>
        )}
      </div>

      {/* Action Suite - Control Panel Style */}
      <div className="p-10 bg-zenit-glass relative z-10 border-t border-zenit-glass-border">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-12">
            <button 
              onClick={toggleLike}
              className={`flex items-center space-x-3 transition-all active:scale-75 ${isLiked ? 'text-zenit-accent' : 'text-zenit-text-tertiary hover:text-zenit-text-primary'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} className={isLiked ? 'shadow-xl' : ''} />
              <span className="text-sm font-mono font-black italic tracking-tighter">{likesCount.toString().padStart(3, '0')}</span>
            </button>
            <button 
              onClick={onViewComments}
              className="flex items-center space-x-3 text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-75"
            >
              <MessageSquare size={24} strokeWidth={2.5} />
              <span className="text-sm font-mono font-black italic tracking-tighter">{post.comments_count.toString().padStart(3, '0')}</span>
            </button>
            <button className="text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-75">
              <Share2 size={24} strokeWidth={2.5} />
            </button>
          </div>
          <button className="text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-75">
            <Bookmark size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Technical Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-zenit-glass-border">
          <div className="flex items-center space-x-4">
             <div className="px-5 py-1.5 bg-zenit-surface-2 rounded-full border border-zenit-border-primary">
               <span className="text-[7.5px] font-black text-zenit-text-tertiary uppercase tracking-[0.4em] italic">
                 CATEGORIA: {post.type === 'thought' ? 'PENSAMENTO' : post.type === 'achievement' ? 'CONQUISTA' : post.type === 'routine' ? 'ROTINA' : 'REFLEXÃO'}
               </span>
             </div>
             <div className="w-1 h-3 bg-zenit-border-primary rounded-full" />
             <span className="text-[7.5px] font-black text-zenit-text-tertiary uppercase tracking-[0.4em] italic opacity-40">
                SINAL VERIFICADO
             </span>
          </div>
          <span className="text-[8px] font-mono font-black text-zenit-text-tertiary uppercase tracking-widest italic opacity-40">
            ID_{post.id.slice(0, 8).toUpperCase()} // {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR }).toUpperCase()}
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
          user:profiles (
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
          user:profiles (
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
        className="absolute inset-0 bg-zenit-black/95 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-zenit-surface-1 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Post Media */}
        <div className="md:w-3/5 bg-zenit-black flex items-center justify-center overflow-hidden">
          {post.image_url ? (
            <img src={post.image_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-12 text-center">
              <p className="text-xl font-display italic text-zenit-text-primary leading-relaxed">"{post.content}"</p>
            </div>
          )}
        </div>

        {/* Post Info & Comments */}
        <div className="md:w-2/5 flex flex-col bg-zenit-surface-1 overflow-hidden">
          <div className="p-6 flex items-center justify-between bg-zenit-surface-2/30">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-zenit-accent to-orange-500">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-full h-full rounded-full border-2 border-zenit-black object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-bold text-zenit-text-primary block leading-none">{post.user?.display_name || 'User'}</span>
                <span className="text-[9px] text-zenit-text-tertiary uppercase tracking-widest font-bold">@{post.user?.username}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-zenit-surface-2 rounded-full transition-colors">
              <X size={18} className="text-zenit-text-tertiary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {post.image_url && post.content && (
              <div className="flex space-x-4">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
                <div className="space-y-1">
                  <p className="text-[12px] text-zenit-text-secondary leading-relaxed">
                    <span className="font-bold text-zenit-text-primary mr-2">@{post.user?.username}</span>
                    {post.content}
                  </p>
                  <p className="text-[8px] text-zenit-text-tertiary uppercase font-bold tracking-[0.2em]">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 size={24} className="text-zenit-accent animate-spin" />
                  <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">Sincronizando Neural Network...</p>
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
                      className="w-9 h-9 rounded-full flex-shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="bg-zenit-surface-2/50 p-3 rounded-2xl rounded-tl-none">
                        <p className="text-[12px] text-zenit-text-secondary leading-relaxed">
                          <span className="font-bold text-zenit-text-primary mr-2">@{comment.user?.username}</span>
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-[8px] text-zenit-text-tertiary uppercase font-bold tracking-[0.2em] ml-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4 opacity-30">
                  <MessageSquare size={32} className="mx-auto text-zenit-text-tertiary" />
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold">Sem reflexões ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-6 bg-zenit-black/40 backdrop-blur-xl">
            <div className="relative group">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar reflexão..."
                className="w-full bg-zenit-surface-1 rounded-2xl py-4 pl-5 pr-14 text-[12px] focus:outline-none focus:border-zenit-accent/50 focus:bg-zenit-surface-2 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-zenit-accent text-white rounded-xl disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-zenit-accent/20"
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

/*
  ===============================================================
  SUPABASE STORAGE SETUP GUIDE
  ===============================================================
  Para que o upload de fotos e pulses funcione, você PRECISA:
  
  1. Ir para o seu Dashboard Supabase (https://app.supabase.com)
  2. Navegar para a seção 'Storage'
  3. Criar dois novos buckets (pastas):
     - 'avatars'
     - 'post-images'
  4. IMPORTANTE: Defina ambos como 'Public' (Público)
  
  Ou execute o SQL abaixo no seu SQL Editor para tentar criar automaticamente:
  
  INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
  INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
  ===============================================================
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  language TEXT DEFAULT 'pt-BR',
  subscription_tier TEXT DEFAULT 'free',
  energy_level INTEGER DEFAULT 100,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  identity TEXT,
  life_score INTEGER DEFAULT 0,
  mascote_state TEXT DEFAULT 'happy',
  is_private BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  ai_messages_count INTEGER DEFAULT 0,
  last_message_date TIMESTAMPTZ,
  ai_generations_count INTEGER DEFAULT 0,
  last_generation_date TIMESTAMPTZ,
  actions_count INTEGER DEFAULT 0,
  last_action_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT,
  image_url TEXT,
  type TEXT DEFAULT 'thought',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Post Likes Policies
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Post Comments Policies
CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Followers Table
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on followers
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Followers Policies
CREATE POLICY "Followers are viewable by everyone" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  target_value INTEGER DEFAULT 1,
  current_value INTEGER DEFAULT 0,
  unit TEXT,
  streak INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  last_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on habits
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Routines Table
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  notified BOOLEAN DEFAULT FALSE,
  category TEXT,
  icon TEXT,
  period TEXT,
  alarm_sound TEXT,
  days TEXT[],
  last_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on routines
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Routines Policies
CREATE POLICY "Users can view their own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Journal Entries Policies
CREATE POLICY "Users can view their own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Finances Table
CREATE TABLE IF NOT EXISTS finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on finances
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Finances Policies
CREATE POLICY "Users can view their own finances" ON finances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own finances" ON finances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own finances" ON finances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own finances" ON finances FOR DELETE USING (auth.uid() = user_id);

-- Finance Budgets Table
CREATE TABLE IF NOT EXISTS finance_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on finance_budgets
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;

-- Finance Budgets Policies
CREATE POLICY "Users can view their own budgets" ON finance_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON finance_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON finance_budgets FOR UPDATE USING (auth.uid() = user_id);

-- Finance Goals Table
CREATE TABLE IF NOT EXISTS finance_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target DECIMAL(12,2) NOT NULL,
  current DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on finance_goals
ALTER TABLE finance_goals ENABLE ROW LEVEL SECURITY;

-- Finance Goals Policies
CREATE POLICY "Users can view their own goals" ON finance_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON finance_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON finance_goals FOR UPDATE USING (auth.uid() = user_id);

-- Game Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on game_scores
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Game Scores Policies
CREATE POLICY "Game scores are viewable by everyone" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Users can save their own scores" ON game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration TEXT,
  difficulty TEXT,
  video_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 50,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Exercises Policies
CREATE POLICY "Exercises are viewable by everyone" ON exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage exercises" ON exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Exercise History Table
CREATE TABLE IF NOT EXISTS exercise_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exercise_history
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;

-- Exercise History Policies
CREATE POLICY "Users can view their own exercise history" ON exercise_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can record exercise completion" ON exercise_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pulses (Stories) Table
CREATE TABLE IF NOT EXISTS pulses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on pulses
ALTER TABLE pulses ENABLE ROW LEVEL SECURITY;

-- Pulses Policies
CREATE POLICY "Pulses are viewable by everyone" ON pulses FOR SELECT USING (true);
CREATE POLICY "Users can create their own pulses" ON pulses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pulses" ON pulses FOR DELETE USING (auth.uid() = user_id);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Storage Setup (Run these in SQL Editor)
-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Storage Policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Storage Policies for post-images
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

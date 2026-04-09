-- ZENITH IA SUPABASE SCHEMA

-- 1. USERS (PROFILES)
-- The 'users' table extends the auth.users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    photo_url TEXT,
    bio TEXT,
    language TEXT DEFAULT 'pt-BR',
    subscription_tier TEXT DEFAULT 'basic',
    is_admin BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ROUTINES
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    time TEXT NOT NULL, -- HH:mm
    duration TEXT,
    category TEXT DEFAULT 'focus',
    icon TEXT,
    period TEXT DEFAULT 'morning',
    priority TEXT DEFAULT 'medium',
    frequency TEXT DEFAULT 'daily',
    energy_level_expected INTEGER DEFAULT 50,
    xp_reward INTEGER DEFAULT 50,
    alarm_sound TEXT,
    days TEXT[], -- ['mon', 'tue', ...]
    completed BOOLEAN DEFAULT false,
    notified BOOLEAN DEFAULT false,
    last_completed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    streak INTEGER DEFAULT 0,
    completed_today BOOLEAN DEFAULT false,
    last_completed TIMESTAMP WITH TIME ZONE,
    frequency TEXT DEFAULT 'daily',
    target INTEGER DEFAULT 1,
    current_progress INTEGER DEFAULT 0,
    target_value INTEGER DEFAULT 1,
    target_unit TEXT,
    completion_history TEXT[], -- Array of ISO dates
    reminder_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS (One-off tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. FINANCES
CREATE TABLE IF NOT EXISTS public.finances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    category TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FINANCE BUDGETS
CREATE TABLE IF NOT EXISTS public.finance_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    limit_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FINANCE GOALS
CREATE TABLE IF NOT EXISTS public.finance_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. POSTS (NEXUS)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. POST LIKES
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- 10. STORIES
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    ai_feedback TEXT,
    mood TEXT,
    type TEXT DEFAULT 'manual', -- 'manual' or 'neural'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. GAME SCORES (MENTAL GYM)
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    game_id TEXT NOT NULL, -- 'tetris', 'memory', 'focus', 'logic'
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. DECISIONS (AXIS)
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. EXERCISE HISTORY (AXIS BODY STATS)
CREATE TABLE IF NOT EXISTS public.exercise_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT,
    duration INTEGER,
    calories_burned INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. FOLLOWERS
CREATE TABLE IF NOT EXISTS public.followers (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view any profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Apply similar policies to other tables (User-owned data)
-- Example for routines:
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own routines" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routines" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routines" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routines" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- (Repeat for all other user-owned tables: habits, tasks, finances, budgets, goals, journal, scores, decisions, exercises, notifications)

-- SOCIAL TABLES RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- FUNCTIONS & TRIGGERS
-- Function to increment likes
CREATE OR REPLACE FUNCTION public.increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION public.decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comments
CREATE OR REPLACE FUNCTION public.increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, username, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

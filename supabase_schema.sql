-- Zenith Life OS - Supabase Schema
-- Run this in your Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    language TEXT DEFAULT 'pt-BR',
    subscription_tier TEXT DEFAULT 'free',
    energy_level INTEGER DEFAULT 100,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    ai_messages_count INTEGER DEFAULT 0,
    last_message_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    completed_today BOOLEAN DEFAULT false,
    last_completed TIMESTAMP WITH TIME ZONE,
    frequency TEXT DEFAULT 'daily',
    target INTEGER DEFAULT 1,
    current_progress INTEGER DEFAULT 0,
    completion_history TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    time TEXT NOT NULL,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    notified BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'focus',
    icon TEXT DEFAULT 'Zap',
    period TEXT DEFAULT 'morning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'strength',
    duration TEXT,
    difficulty TEXT DEFAULT 'beginner',
    is_premium BOOLEAN DEFAULT false,
    video_url TEXT,
    xp_reward INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Users Policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow public insert for new users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Habits Policies
CREATE POLICY "Users can manage their own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can manage their own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Routines Policies
CREATE POLICY "Users can manage their own routines" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

-- Exercises Policies (Public read, Admin write)
CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage exercises" ON public.exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

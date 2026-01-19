-- Supabase SQL Schema for Trader App
-- Run this in your Supabase SQL Editor

-- 1. Create user_access table for email whitelist
CREATE TABLE IF NOT EXISTS public.user_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS for user_access
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Policies for user_access
CREATE POLICY "Users can check own access" ON public.user_access
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "Service role can manage access" ON public.user_access
    FOR ALL USING (auth.role() = 'service_role');


-- 2. Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY, -- Format: YYYYMMDD
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    capital DECIMAL(15, 2),
    status TEXT,
    profit DECIMAL(15, 2),
    brokerage DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS for journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Policies for journal_entries
CREATE POLICY "Users can manage own entries" ON public.journal_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. Weekly Journal Notes Table
CREATE TABLE IF NOT EXISTS public.weekly_journal_notes (
    id TEXT PRIMARY KEY, -- Format: YYYYMMDD (Monday of the week)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_key TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_key)
);

-- Enable RLS for weekly_journal_notes
ALTER TABLE public.weekly_journal_notes ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_journal_notes
CREATE POLICY "Users can manage own weekly notes" ON public.weekly_journal_notes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Sample Whitelist Entry (Optional)
-- INSERT INTO public.user_access (email) VALUES ('your-email@example.com');
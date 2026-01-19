-- Supabase SQL Schema for Trader App
-- Run this in your Supabase SQL Editor

-- Create user_access table for email whitelist
CREATE TABLE IF NOT EXISTS user_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to check their own access
CREATE POLICY "Users can check own access" ON user_access
  FOR SELECT USING (auth.email() = email);

-- Policy: Allow service role to manage all records (for admin)
CREATE POLICY "Service role can manage access" ON user_access
  FOR ALL USING (auth.role() = 'service_role');

-- Insert sample whitelist entries (replace with your actual emails)
-- INSERT INTO user_access (email) VALUES ('your-email@example.com');

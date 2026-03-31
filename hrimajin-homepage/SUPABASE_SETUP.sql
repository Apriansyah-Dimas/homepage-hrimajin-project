-- Run this SQL in Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Allow all authenticated users to read users
CREATE POLICY "Allow authenticated users to read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert, update, delete users
CREATE POLICY "Allow admins to manage users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- 4. Create trigger to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

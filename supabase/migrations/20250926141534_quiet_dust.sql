/*
  # Create attendance_users table

  1. New Tables
    - `attendance_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `name` (text)
      - `role` (text)
      - `is_active` (boolean, default true)
      - `permissions` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on `attendance_users` table
    - Add policies for authenticated users to manage attendance users
*/

CREATE TABLE IF NOT EXISTS attendance_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'attendant',
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;

-- Allow public access for authentication
CREATE POLICY "Enable read access for all users"
  ON attendance_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON attendance_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON attendance_users
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_users_username ON attendance_users(username);
CREATE INDEX IF NOT EXISTS idx_attendance_users_role ON attendance_users(role);
CREATE INDEX IF NOT EXISTS idx_attendance_users_active ON attendance_users(is_active);

-- Add constraint for role validation
ALTER TABLE attendance_users ADD CONSTRAINT attendance_users_role_check 
  CHECK (role IN ('admin', 'manager', 'attendant', 'cashier'));
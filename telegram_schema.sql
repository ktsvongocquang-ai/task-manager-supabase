-- Add telegram_chat_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255);

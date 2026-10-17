-- ============================================================================
-- AAJORI CUISINE - HYPERLOCAL FOOD-COMMERCE PLATFORM
-- Migration 003: Firebase Cloud Messaging (FCM) & Device Push Tokens
-- ============================================================================

-- 1. Create table for storing registered push devices (FCM Tokens & W3C Push Subscriptions)
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'CUSTOMER',
  token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(50) DEFAULT 'WEB',
  endpoint TEXT,
  auth_key TEXT,
  p256dh_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create table for persistent notification history
CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_role VARCHAR(50) DEFAULT 'ALL',
  event VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  channels TEXT[] DEFAULT ARRAY['PUSH', 'IN_APP'],
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for rapid lookups during high-concurrency order bursts
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_role ON user_device_tokens (user_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON platform_notifications (recipient_user_id, recipient_role, is_read, created_at DESC);

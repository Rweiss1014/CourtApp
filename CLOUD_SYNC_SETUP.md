# Cloud Sync Setup Guide

This guide explains how to set up cloud sync for Her Law Family Court Organizer using Supabase.

## Important Note

**Cloud sync is completely optional.** The app works perfectly without it using local storage only. Cloud sync is only needed if users want to:
- Access their data from multiple devices
- Automatic cloud backup
- Sync data across different browsers

## Security

All data is **end-to-end encrypted** before upload. The cloud server never sees your unencrypted data. We use:
- AES-GCM 256-bit encryption
- PBKDF2 key derivation (100,000 iterations)
- User ID-based encryption keys

## Setup Instructions

### Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### Step 2: Create a New Project

1. Click "New Project"
2. Choose an organization (or create one)
3. Fill in project details:
   - **Name**: herlaw-sync (or any name you prefer)
   - **Database Password**: Choose a strong password (save it somewhere safe)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for most uses
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 3: Create Database Table

1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Create user_data table for encrypted sync
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
```

4. Click "Run" or press Cmd/Ctrl + Enter
5. You should see "Success. No rows returned"

### Step 4: Get API Keys

1. In your Supabase project, click "Project Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. You'll see two important values:
   - **Project URL** - Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key - Copy this (long string starting with `eyJ...`)

### Step 5: Configure Environment Variables

#### For Local Development:

1. In your project folder, create a file named `.env` (if it doesn't exist)
2. Add these lines:

```bash
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace `your-project-url-here` with your Project URL
4. Replace `your-anon-key-here` with your anon public key
5. Save the file

#### For Netlify Deployment:

1. Go to your Netlify dashboard
2. Select your site (CourtApp)
3. Go to "Site configuration" → "Environment variables"
4. Click "Add a variable" and add:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Project URL
   - Click "Create variable"
5. Click "Add a variable" again and add:
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your anon public key
   - Click "Create variable"
6. Deploy your site (Netlify will auto-deploy on next git push)

### Step 6: Test Cloud Sync

1. Build and run your app locally OR wait for Netlify to deploy
2. Go to Settings in the app
3. You should now see a "Cloud Sync" section
4. Click "Sign In / Create Account"
5. Create an account with email and password
6. Click "Sync Now" to upload your data
7. Data should sync successfully!

### Step 7: Test Multi-Device Sync

1. Open the app on a different device or browser
2. Sign in with the same email and password
3. Click "Sync Now"
4. Your data should download and appear!

## Troubleshooting

### "Cloud sync not configured" error
- Make sure environment variables are set correctly
- Restart your dev server after adding env variables
- For Netlify, redeploy after adding variables

### "Failed to sign up" error
- Check Supabase email settings: Project Settings → Auth → Email Auth
- Make sure "Enable email signup" is turned ON
- Check email confirmations are disabled for testing (or set up email provider)

### "Failed to sync to cloud" error
- Check browser console for detailed error
- Verify SQL table was created correctly
- Check Row Level Security policies are in place
- Make sure user is signed in

### Can't see data on other device
- Make sure you're signed in with the same email
- Click "Sync Now" to download latest data
- Check that sync completed successfully (no errors)

## Disabling Cloud Sync

If you don't want cloud sync:
1. Simply don't add the Supabase environment variables
2. The "Cloud Sync" section won't appear in Settings
3. App works perfectly with local storage only

## Privacy & Security

- **End-to-end encrypted**: Data encrypted before leaving your device
- **Row-level security**: Users can only access their own data
- **No data mining**: Supabase can't read your encrypted data
- **GDPR compliant**: Users can delete all their data anytime
- **Open source**: Supabase is open source, can be self-hosted

## Costs

Supabase Free Tier includes:
- 500MB database storage
- 50,000 monthly active users
- 2GB bandwidth
- Unlimited API requests

This is more than enough for personal use or small deployments. Paid plans start at $25/month if you need more.

## Support

For issues with:
- **Her Law app**: Open an issue on GitHub
- **Supabase**: Check [Supabase docs](https://supabase.com/docs) or their Discord

## Next Steps

Want to add more features?
- Auto-sync on record creation
- Conflict resolution for simultaneous edits
- Offline queue for syncing when back online
- Shared family accounts
- Export sync history

These can be added later based on user feedback!

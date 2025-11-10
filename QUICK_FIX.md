# ✅ ERROR FIXES - Quick Start Guide

## 🔴 Main Problem
Your Supabase database schema cache is out of sync. The `require_media` column exists but isn't recognized.

## 🎯 Solution (3 Simple Steps)

### Step 1: Run the SQL Fix
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste **ALL contents** from `fix-schema-cache.sql`
5. Click **RUN** or press `Ctrl+Enter`
6. Wait for "Success" message

### Step 2: Restart Supabase (IMPORTANT!)
Choose ONE method:

**Method A - Restart Project (Recommended)**
1. Go to Project Settings → General
2. Click "Pause project" → Wait 10 sec → Click "Resume project"

**Method B - Wait**
- Just wait 60 seconds for cache to auto-refresh

### Step 3: Clear App Cache
```bash
# Stop your dev server (Ctrl+C)
# Then run:
npx expo start --clear
```

## 🧪 Test It
1. Open your app
2. Go to Huiswerk (Assignments)
3. Try adding a new assignment
4. ✅ Should work now!

## 🔍 Still Having Issues?

### Error persists?
- Make sure you restarted Supabase (Step 2)
- Check you're using the correct Supabase project
- Verify your `.env` has the right `EXPO_PUBLIC_SUPABASE_URL`

### Different error appears?
- Check the metro console for the full error message
- Look for which component is mentioned in the error stack

### Text node error?
This is usually a side effect of the main error and should disappear after the fix.
If it persists, check the React error stack in your console to see which component.

---

## 📋 What Was Fixed

The SQL script:
- ✅ Ensures `require_media` column exists
- ✅ Ensures `submissions` column exists  
- ✅ Sets proper defaults (FALSE for require_media, [] for JSONB fields)
- ✅ Updates any NULL values to defaults
- ✅ Forces schema cache reload
- ✅ Verifies all columns are correct

## 💡 Why This Happened

Supabase caches your database schema for performance. When you add/modify columns, sometimes the cache doesn't update immediately. The SQL script forces a cache refresh.

---

**Need more details?** See `FIXING_ERRORS.md` for advanced troubleshooting.

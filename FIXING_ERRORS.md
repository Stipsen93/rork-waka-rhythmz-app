# Fixing Assignments Errors

## Errors
1. ❌ "Unexpected text node: . A text node cannot be a child of a <View>"
2. ❌ "Error adding assignment: Could not find the 'require_media' column of 'assignments' in the schema cache"
3. ❌ "Could not find the 'require_media' column of 'assignments' in the schema cache"

## Solutions

### Fix 1: Database Schema Cache Issue (Main Issue)

The `require_media` column exists in your database but Supabase's schema cache hasn't been refreshed.

**Steps to fix:**

1. **Go to your Supabase SQL Editor** and run the `fix-schema-cache.sql` file

2. **If the error persists after running the SQL**, do ONE of these:
   - **Option A (Recommended)**: Restart your Supabase project:
     - Go to Project Settings → General
     - Click "Pause project"
     - Wait 10 seconds
     - Click "Resume project"
   
   - **Option B**: Wait 30-60 seconds for the cache to automatically refresh
   
   - **Option C**: In the SQL Editor, run:
     ```sql
     SELECT pg_notify('pgrst', 'reload schema');
     ```

3. **Clear your app's cache:**
   - If using Expo Go: Close and restart the app
   - If using a dev build: Stop the metro bundler and restart with `npx expo start --clear`

### Fix 2: Text Node Error

The "Unexpected text node" error is harder to track down without seeing it happen. It usually occurs when:

1. A conditional returns a string/period directly inside a View without wrapping it in Text
2. An error object is being rendered directly
3. A template literal evaluates to just "."

**Common causes:**
```tsx
// ❌ BAD - will cause error
<View>
  {something && "."}
</View>

// ❌ BAD - error object rendered
<View>
  {error}
</View>

// ✅ GOOD - wrapped in Text
<View>
  {something && <Text>.</Text>}
</View>

// ✅ GOOD - error converted to string
<View>
  <Text>{error?.message || 'Unknown error'}</Text>
</View>
```

**To find it:**
1. Look at the React error stack trace in your console
2. It will show which component is rendering the problematic text
3. Search that component for any direct text rendering in Views

### Fix 3: Verify Types Match Database

Your TypeScript types should now match. Verify by checking:

1. `lib/database.types.ts` - lines 91, 104 show `require_media` is defined
2. `providers/AppState.tsx` - line 61 shows Assignment interface has `requireMedia`
3. The mapping happens correctly on lines 1275, 1299 of AppState.tsx

## Testing After Fixes

1. Restart Supabase project (see Fix 1)
2. Clear app cache and restart
3. Try adding a new assignment
4. Check browser/metro console for any errors

## If Still Not Working

If after all these steps you still get the schema cache error:

1. Check if there are multiple Supabase projects and you're connected to the wrong one
2. Verify your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in your `.env` or environment variables
3. Try creating a completely new assignment row manually in Supabase to see if the column is truly there
4. Check the Supabase project logs for any migration errors

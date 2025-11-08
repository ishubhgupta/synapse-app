# 🚀 Quick Start Guide

Get Synapse running in 10 minutes!

## What You'll Need

- A computer with Node.js installed
- A free Supabase account
- Chrome browser
- 10 minutes of your time

## Step 1: Get the Code (1 minute)

You already have the code in `synapse-app` folder!

```bash
cd synapse-app
```

## Step 2: Install Dependencies (2 minutes)

```bash
npm install
```

Wait for installation to complete. Grab a coffee! ☕

## Step 3: Set Up Supabase (3 minutes)

### Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email

### Create Project
1. Click "New Project"
2. Name it "synapse"
3. Create a strong database password (save it!)
4. Choose a region near you
5. Click "Create new project"
6. Wait ~2 minutes for setup

### Get Your Credentials
Once ready:
1. Click the "Settings" icon (⚙️) in sidebar
2. Go to "API"
3. Copy these three things:
   - Project URL (starts with `https://`)
   - `anon` public key (long string starting with `eyJ`)
   - `service_role` key (another long string)

4. Go to "Database" in settings
5. Copy "Connection string" (URI tab)
6. Replace `[YOUR-PASSWORD]` with your actual password

### Enable Email Auth
1. Go to Authentication > Providers
2. Make sure "Email" is enabled (toggle should be green)

## Step 4: Configure Environment (1 minute)

1. In the `synapse-app` folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your editor

3. Paste your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   DATABASE_URL=postgresql://postgres:yourpassword@db.xxx.supabase.co:5432/postgres
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Save the file

## Step 5: Set Up Database (1 minute)

Run these two commands:

```bash
npx prisma generate
npx prisma db push
```

You should see "Your database is now in sync with your schema."

## Step 6: Start the App (1 minute)

```bash
npm run dev
```

You should see:
```
✓ Ready in 2s
○ Local:        http://localhost:3000
```

## Step 7: Use Synapse! (1 minute)

1. Open http://localhost:3000 in your browser
2. Click "Get Started"
3. Create an account with your email
4. You're in! Click "+ Add Bookmark"
5. Try adding a YouTube video URL

Example URL to test:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

Watch the magic! 🎩✨

## Step 8: Install Chrome Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" ON (top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. Done! You'll see the Synapse icon

### Use the Extension
1. Click the extension icon
2. Click "Open Synapse"
3. Log in (same account you just created)
4. Go back to extension, click "I'm already logged in"
5. Now click "Save Current Page" to save any webpage!

## 🎉 You're Done!

You now have:
- ✅ A running Synapse web app
- ✅ Your own account
- ✅ The Chrome extension installed
- ✅ The ability to save bookmarks from anywhere!

## Common Issues

### "Failed to fetch bookmarks"
- Check if you're logged in
- Verify .env.local has correct credentials
- Make sure `npm run dev` is running

### "Database connection failed"
- Check your DATABASE_URL in .env.local
- Make sure you replaced [YOUR-PASSWORD] with actual password
- Try copying the connection string again from Supabase

### "Authentication Required" in extension
- Log in to http://localhost:3000 first
- Then click extension icon
- Click "I'm already logged in"

### Port 3000 already in use
```bash
# Kill the process using port 3000
npx kill-port 3000
# Then run again
npm run dev
```

### Prisma errors
```bash
# Delete and regenerate
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push
```

## What to Try Next

### Test Different Content Types

**YouTube Video:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Amazon Product:**
```
https://www.amazon.com/dp/B08N5WRWNW
```

**Any Article:**
```
https://www.nytimes.com/
```

**Just Notes:**
Leave URL blank, just add a title!

### Use the Extension

1. Open any webpage
2. Right-click > "Save to Synapse"
3. Or press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
4. Check your dashboard - it's there!

### Customize

Want to change colors? Edit `src/app/page.tsx`
Want different content types? Edit `src/lib/contentDetector.ts`

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [SETUP.md](./SETUP.md) for detailed setup
- See [DEPLOYMENT.md](./DEPLOYMENT.md) to go live
- Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture

## Need Help?

1. **Browser Console**: Press F12, check for errors
2. **Terminal**: Look at `npm run dev` output
3. **Supabase**: Check if project is active
4. **Environment**: Verify all values in .env.local

## Congratulations! 🎊

You've successfully set up a production-ready bookmark manager with:
- Modern tech stack (Next.js, React, TypeScript)
- Secure authentication (Supabase)
- Smart metadata extraction
- Chrome extension
- Beautiful UI

Now go save some bookmarks! 🔖

## Share Your Success

Built something cool with Synapse? Share it!
- Star the project on GitHub
- Tweet about it
- Show it to friends
- Deploy to production (see DEPLOYMENT.md)

Happy bookmarking! 🚀

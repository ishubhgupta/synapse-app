# 🚀 Neon Database Setup Guide

## Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click "Sign up" (you can use GitHub, Google, or email)
3. Complete registration

## Step 2: Create a New Project

1. After login, click **"Create a project"** or **"New Project"**
2. Configure your project:
   - **Project name**: `synapse-bookmarks` (or your choice)
   - **Region**: Choose closest to you (e.g., US East, EU Central, Asia Pacific)
   - **PostgreSQL version**: 16 (recommended) or 15
3. Click **"Create Project"**

## Step 3: Get Your Connection String

After creating the project, you'll see your connection details:

1. On the project dashboard, find the **"Connection Details"** section
2. Make sure **"Pooled connection"** is selected (this is important!)
3. Copy the connection string - it looks like:
   ```
   postgres://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 4: Update .env.local

1. Open `synapse-app/.env.local`
2. Replace `YOUR_NEON_DATABASE_URL_HERE` with your copied connection string:
   ```bash
   DATABASE_URL="postgres://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

3. Generate a secure JWT secret:
   - Go to: https://generate-secret.vercel.app/32
   - Or run in terminal: `openssl rand -base64 32`
   - Replace the JWT_SECRET value

## Step 5: Push Database Schema

Run these commands in your terminal:

```bash
cd synapse-app

# Generate Prisma client
npx prisma generate

# Push schema to Neon database
npx prisma db push

# Verify it worked
npx prisma studio
```

## Step 6: Test the Application

```bash
# Start development server
npm run dev
```

Visit http://localhost:3000 and:
1. Go to `/signup`
2. Create an account with email/password
3. You should be redirected to `/dashboard`

## ✅ Your Setup is Complete!

### What You Have Now:

- ✅ Neon PostgreSQL database (unlimited connections via pooling)
- ✅ Simple email/password authentication
- ✅ JWT-based sessions with HTTP-only cookies
- ✅ Secure password hashing with bcrypt
- ✅ User and Bookmark tables created
- ✅ Production-ready authentication system

### Next Steps:

1. Test bookmark creation on the dashboard
2. Install Chrome extension
3. Deploy to Vercel when ready

## 🔒 Security Notes:

- **Never commit `.env.local`** to Git (it's already in `.gitignore`)
- Change `JWT_SECRET` for production
- Use environment variables in Vercel for deployment
- Passwords are automatically hashed with bcrypt (salt rounds: 10)

## 📊 Neon Dashboard Features:

- **SQL Editor**: Run queries directly
- **Metrics**: Monitor database performance
- **Branching**: Create database branches for development
- **Backups**: Automatic daily backups (on paid plans)
- **Connection pooling**: Built-in, no configuration needed

## 🆘 Troubleshooting:

**Issue**: "Can't reach database server"
- **Solution**: Check connection string is correct, verify Neon project is active

**Issue**: "Prisma schema validation error"
- **Solution**: Run `npx prisma generate` then `npx prisma db push` again

**Issue**: "JWT_SECRET not found"
- **Solution**: Make sure `.env.local` has `JWT_SECRET` defined

**Issue**: Authentication not working
- **Solution**: Clear browser cookies, restart dev server

## 💡 Neon Free Tier Limits:

- ✅ **500 MB storage** - Plenty for thousands of bookmarks
- ✅ **Unlimited connections** - Via built-in pooling
- ✅ **3 GB data transfer/month** - More than enough for development
- ✅ **Always-on compute** - 100 hours/month (auto-scales to zero when idle)

Perfect for development and small production apps! 🎉

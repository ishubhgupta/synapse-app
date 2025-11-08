# Synapse - AI-Powered Smart Bookmark Manager

A production-ready intelligent bookmark management system with AI-powered content analysis, automatic tagging, and seamless Chrome extension integration.

## 🚀 Features



- 🧠 **AI-Powered Analysis**: Automatic content summarization and smart tag generation using Claude AI
- 🔐 **Secure Authentication**: JWT-based authentication with HTTP-only cookies and bcrypt password hashing
- 🎯 **Smart Content Detection**: Automatically detects content types (video, article, product, tweet, note, image)
- 📊 **Rich Metadata Extraction**: Automatically extracts titles, thumbnails, descriptions, and metadata
- 🌐 **Chrome Extension**: One-click bookmark saving from any webpage with keyboard shortcuts
- 🎨 **Beautiful Dashboard**: Responsive, modern UI for managing all your bookmarks
- ⚡ **Production Ready**: Built with TypeScript, error handling, validation, and security best practices

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- Anthropic API key for AI features (get one at [console.anthropic.com](https://console.anthropic.com))

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/synapse-app.git
cd synapse-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (Neon PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Authentication
JWT_SECRET="your-64-byte-hex-secret-here"

# AI (Anthropic Claude)
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate JWT Secret:**
```bash
openssl rand -hex 64
```

### 4. Set Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 6. Install Chrome Extension (Optional)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. The Synapse extension icon should appear in your toolbar

See `chrome-extension/README.md` for detailed extension setup.

## 🏗️ Project Structure

```
synapse-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Authentication endpoints (signup, login, logout, me)
│   │   │   └── bookmarks/     # Bookmark CRUD operations
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Registration page
│   │   └── layout.tsx         # Root layout
│   ├── lib/
│   │   ├── auth.ts            # JWT authentication utilities
│   │   ├── ai.ts              # Claude AI integration
│   │   ├── contentDetector.ts # Content type detection
│   │   ├── prisma.ts          # Database client
│   │   └── scraper/           # Metadata extraction
│   └── middleware.ts          # Route protection
├── chrome-extension/          # Chrome extension files
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── popup/                 # Extension popup UI
├── prisma/
│   └── schema.prisma          # Database schema
└── .env.local                 # Environment variables (create this)
```

## 📝 API Documentation

### Authentication

**GET `/api/auth/me`**
- Get current authenticated user
- Returns: `{ id, email }`

### Bookmarks

**GET `/api/bookmarks`**
- List user's bookmarks (paginated)
- Query params: `page`, `limit`, `contentType`
- Returns: `{ bookmarks[], pagination }`

**POST `/api/bookmarks`**
- Create new bookmark
- Body: `{ title, url?, rawContent?, tags? }`
- Returns: Created bookmark with extracted metadata

**GET `/api/bookmarks/:id`**
- Get single bookmark
- Returns: Bookmark object

**PATCH `/api/bookmarks/:id`**
- Update bookmark
- Body: `{ title?, url?, rawContent?, tags? }`
- Returns: Updated bookmark

**DELETE `/api/bookmarks/:id`**
- Delete bookmark
- Returns: Success message

## 🔒 Security Features

- ✅ JWT-based authentication with HTTP-only cookies
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Input validation with Zod schemas
- ✅ Protected API routes with middleware
- ✅ CSRF protection with SameSite cookies
- ✅ Secure session management (7-day expiration)
- ✅ Environment variables for sensitive data

## 🎨 Content Types

The system automatically detects and handles:

- **Videos**: YouTube, Vimeo, Dailymotion
- **Products**: Amazon, eBay, Etsy, Walmart
- **Tweets**: Twitter/X posts
- **Articles**: Any webpage with metadata
- **Notes**: Text-only bookmarks
- **Images**: Direct image links

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure project

3. **Add Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=postgresql://...neon.tech/dbname
   JWT_SECRET=your-64-byte-hex-secret
   ANTHROPIC_API_KEY=sk-ant-api03-...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Vercel will automatically build and deploy
   - Database migrations run automatically via Prisma

### Update Chrome Extension for Production

After deploying, update the extension to use your production URL:

1. Edit `chrome-extension/popup/login.js`
2. Edit `chrome-extension/popup/popup.js`  
3. Edit `chrome-extension/background.js`
4. Change `API_BASE_URL` to your Vercel URL
5. Update `manifest.json` host_permissions

See full deployment guide in `TESTING-DEPLOYMENT.md`

## 💻 Usage

### Web Dashboard

1. **Sign Up**: Create an account at `/signup`
2. **Log In**: Access your dashboard at `/login`
3. **Add Bookmarks**: Click "Add Bookmark" and enter URL or text
4. **Manage**: View, edit, and delete bookmarks from the dashboard

### Chrome Extension

1. **Save Current Page**: Press `Ctrl+Shift+S` or click extension icon
2. **Save Selection**: Highlight text and press `Ctrl+Shift+X`
3. **Context Menu**: Right-click on pages, links, or images to save
4. **Quick Actions**: Click extension icon for recent bookmarks

### AI Features

- **Smart Tags**: Automatically generated based on content
- **Summaries**: AI-powered content summaries
- **Key Points**: Extracted main points from articles
- **Content Analysis**: Intelligent categorization

## 🛠️ Development Commands

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm start                 # Start production server

# Database
npx prisma studio         # Open database GUI
npx prisma generate       # Regenerate Prisma client
npx prisma migrate dev    # Create and apply migration
npx prisma db push        # Push schema changes (dev only)

# Code Quality
npm run lint              # Run ESLint
npx tsc --noEmit         # Type checking
```

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon recommended)
- **ORM**: Prisma 6.19.0
- **Authentication**: JWT with jose library
- **Password Hashing**: bcryptjs
- **AI**: Anthropic Claude (claude-3-haiku-20240307)
- **Validation**: Zod
- **Scraping**: Cheerio
- **Extension**: Chrome Manifest V3

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Use pooler connection string for Neon (ends with `-pooler`)
- Check if database tables exist: `npx prisma studio`

### Authentication Not Working
- Verify `JWT_SECRET` is set and consistent
- Clear browser cookies and try again
- Check browser console for errors

### AI Features Not Working
- Verify `ANTHROPIC_API_KEY` is correct
- Check API quota/limits in Anthropic dashboard
- Review server logs for API errors

### Extension Not Connecting
- Ensure web app is running on correct URL
- Update `API_BASE_URL` in extension files
- Check extension has correct permissions

## 📖 Documentation

- `README.md` - This file (quick start guide)
- `PROJECT-SUMMARY.md` - Complete technical documentation
- `TESTING-DEPLOYMENT.md` - Comprehensive testing and deployment guide
- `chrome-extension/README.md` - Chrome extension documentation

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Support

For issues and questions:
- Check the documentation files listed above
- Review browser console for errors
- Verify all environment variables are set correctly

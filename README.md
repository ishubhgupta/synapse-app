# Synapse - AI-Powered Smart Bookmark Manager

A production-ready intelligent bookmark management system with AI-powered content analysis, automatic tagging, and seamless Chrome extension integration.

## ⚡ Quick Start

**Save Bookmarks (Chrome Extension):**
- `Ctrl+Shift+S` - Save current page (any content type)
- `Ctrl+Shift+X` - Save selected text as note
- Right-click image → "Save image to Synapse"

**What Gets Saved:**
- 📺 Videos, 🛍️ Products, 🐦 Tweets, 📄 Articles, 📝 Notes, 📸 Images
- ✅ Automatic AI tagging
- ✅ OCR text extraction (images)
- ✅ Semantic search with Google Gemini (FREE)
- ✅ Cloud storage (AWS S3 for images)

**Search:**
- Semantic search: Finds similar concepts (e.g., "python" finds "Django guide")
- Keyword expansion: "study" finds "learn", "education", "tutorial"
- OCR search: Search text inside images

---

## 🚀 Features

### Core Features
- 🧠 **AI-Powered Analysis**: Automatic content summarization and smart tag generation using Claude AI
- 🔍 **Semantic Search**: Google Gemini embeddings (768D) for intelligent search - **FREE tier (1,500/day)**
- � **Image Bookmarks**: Save images with OCR text extraction, AI descriptions, and object detection
- �🔐 **Secure Authentication**: JWT-based authentication with HTTP-only cookies and bcrypt password hashing
- 🎯 **Smart Content Detection**: Automatically detects content types (video, article, product, tweet, note, image)
- 📊 **Rich Metadata Extraction**: Automatically extracts titles, thumbnails, descriptions, and metadata
- 🌐 **Chrome Extension**: One-click bookmark saving from any webpage with keyboard shortcuts
- 🎨 **Beautiful Dashboard**: Responsive, modern UI for managing all your bookmarks
- ⚡ **Production Ready**: Built with TypeScript, error handling, validation, and security best practices

### AI & Search Features
- 🔮 **Gemini Embeddings**: Free semantic search with Google's latest embedding model
- 🤖 **Claude Vision**: OCR and image analysis for visual content
- 🏷️ **Auto-Tagging**: AI-generated tags based on content analysis
- 📝 **Keyword Expansion**: Intelligent search with educational term mappings

### Storage & Processing
- ☁️ **AWS S3 Integration**: Scalable image storage with automatic optimization
- 🖼️ **Image Processing**: Automatic resize (max 2000px), WebP conversion, quality optimization
- 🗄️ **PostgreSQL + pgvector**: Vector database for semantic search
- 📦 **Neon Database**: Serverless PostgreSQL with automatic scaling

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database with pgvector extension (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- **Google API key** for embeddings - **FREE** (get one at [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey))
- Anthropic API key for AI features (get one at [console.anthropic.com](https://console.anthropic.com))
- AWS S3 bucket for image storage (optional, required for image bookmarks)

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
# Database (Neon PostgreSQL with pgvector extension)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Authentication
JWT_SECRET="your-64-byte-hex-secret-here"

# AI - Google Gemini (FREE - for semantic search embeddings)
GOOGLE_API_KEY="AIzaSy..."  # Get from https://makersuite.google.com/app/apikey

# AI - Anthropic Claude (for content analysis and tagging)
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# OpenAI (optional fallback for embeddings if Gemini fails)
OPENAI_API_KEY="sk-proj-..."  # Optional

# AWS S3 (for image storage - required for image bookmarks)
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="your-secret-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate JWT Secret:**
```bash
openssl rand -hex 64
```

**Get Free Google API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into `.env.local`

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

## 🎨 Content Types & Save Flow

The system automatically detects and handles 6 content types with complete AI processing:

### 1. 📺 Videos (YouTube, Vimeo, Dailymotion)
**Save Flow:**
```
User saves video URL
  - Chrome Extension: Ctrl+Shift+S (save current page)
  - Web UI: Click "Add Bookmark" button
  - Extension Popup: Click "Save" button
  ↓
Extract metadata (title, thumbnail, duration)
  ↓
Generate AI tags (Claude Haiku)
  ↓
Create 768D embedding (Google Gemini)
  ↓
Save to database with vector
  ↓
✅ Searchable via keywords + semantic search
```

### 2. 🛍️ Products (Amazon, eBay, Etsy, Walmart)
**Save Flow:**
```
User saves product URL
  - Chrome Extension: Ctrl+Shift+S (save current page)
  - Web UI: Paste product URL
  - Context Menu: Right-click page → "Save to Synapse"
  ↓
Scrape product details (title, price, image, description)
  ↓
Auto-categorize as "shopping"
  ↓
Generate AI tags (Claude Haiku)
  ↓
Create 768D embedding (Google Gemini)
  ↓
Save to database with vector
  ↓
✅ Searchable by product name, category, features
```

### 3. 🐦 Tweets (Twitter/X posts)
**Save Flow:**
```
User saves tweet URL
  - Chrome Extension: Ctrl+Shift+S (save current page)
  - Web UI: Paste tweet URL
  - Context Menu: Right-click on tweet → "Save to Synapse"
  ↓
Extract tweet content, author, timestamp
  ↓
Generate AI tags (Claude Haiku)
  ↓
Create 768D embedding (Google Gemini)
  ↓
Save to database with vector
  ↓
✅ Searchable by tweet content + semantic meaning
```

### 4. 📄 Articles (Any webpage)
**Save Flow:**
```
User saves article URL
  - Chrome Extension: Ctrl+Shift+S (save current page)
  - Web UI: Paste article URL
  - Context Menu: Right-click page → "Save to Synapse"
  ↓
Scrape full article content (Cheerio)
  ↓
Extract metadata (title, description, author, publish date)
  ↓
Generate AI tags based on content (Claude Haiku)
  ↓
Create 768D embedding from title + content (Google Gemini)
  ↓
Save to database with vector
  ↓
✅ Searchable via keywords + semantic similarity
```

### 5. 📝 Notes (Text-only bookmarks)
**Save Flow:**
```
User creates text note
  - Chrome Extension: Ctrl+Shift+X (save selected text)
  - Web UI: Click "Add Bookmark" → Enter text only (no URL)
  - Extension Popup: Type or paste text in note field
  ↓
Generate AI tags from text (Claude Haiku)
  ↓
Create 768D embedding (Google Gemini)
  ↓
Save to database with vector
  ↓
✅ Full-text + semantic search enabled
```

### 6. 📸 Images (Photos, Screenshots, Graphics)
**Save Flow (Complete Pipeline):**
```
User saves image
  - Context Menu: Right-click image → "Save image to Synapse"
  - Extension: Works on any image on any webpage
  - Direct URL: Paste image URL in web UI
  ↓
Chrome extension captures:
  - Image URL
  - Page context (title, URL)
  - Alt text
  - Surrounding text (500 chars)
  ↓
POST to /api/bookmarks/image
  ↓
Download image from URL
  ↓
Process image (Sharp):
  - Resize to max 2000px
  - Convert to WebP format
  - Compress to 85% quality
  - Validate max 5MB
  ↓
Upload to AWS S3
  - Generate unique key
  - Store with public-read ACL
  - Return CDN URL
  ↓
Analyze with Claude Vision:
  - Extract OCR text (readable text in image)
  - Generate description (2-3 sentences)
  - Detect objects/concepts
  - Identify tags (5-10 relevant)
  - Calculate confidence score
  ↓
Generate AI tags from OCR + description (Claude Haiku)
  ↓
Combine tags:
  - User tags (from extension)
  - AI analysis tags (from Vision)
  - Generated tags (from Haiku)
  - Max 10 total
  ↓
Auto-detect category:
  - code/programming → "work"
  - learn/study → "learning"
  - design/art → "inspiration"
  ↓
Create 768D embedding from:
  - Image description
  - OCR text
  - Tags
  - Context (Google Gemini)
  ↓
Save to database:
  - Image URL (S3 CDN)
  - Storage key (for deletion)
  - OCR text (searchable)
  - Description
  - Objects array
  - Metadata (width, height, size, format)
  - Vector embedding
  ↓
Async: Generate and save embedding
  ↓
✅ Image fully searchable by:
   - Visual content (via description)
   - Text in image (via OCR)
   - Context (via surrounding text)
   - Semantic similarity (via embedding)
```

**Image Features:**
- ✅ OCR text extraction (searchable)
- ✅ AI-generated descriptions
- ✅ Object/concept detection
- ✅ Automatic categorization
- ✅ Context-aware saving (captures page info)
- ✅ S3 storage with CDN
- ✅ Automatic image optimization
- ✅ Semantic search enabled



## 💻 Usage

### Web Dashboard

1. **Sign Up**: Create an account at `/signup`
2. **Log In**: Access your dashboard at `/login`
3. **Add Bookmarks**: Click "Add Bookmark" and enter URL or text
4. **Manage**: View, edit, and delete bookmarks from the dashboard

### Chrome Extension - Save Methods

#### Keyboard Shortcuts (Fastest)
- **`Ctrl+Shift+S`** - Save current page (any content type)
  - Works on: Videos, Products, Articles, Tweets
  - Automatically detects content type
  - Extracts all metadata
  
- **`Ctrl+Shift+X`** - Save selected text as note
  - Highlight any text on any page
  - Press shortcut to save as bookmark
  - Perfect for quotes, snippets, ideas

#### Context Menu (Right-Click)
1. **Save Page**: Right-click anywhere → "Save to Synapse"
2. **Save Link**: Right-click any link → "Save link to Synapse"
3. **Save Image**: Right-click any image → "Save image to Synapse"
   - Captures image + page context
   - OCR extraction
   - AI analysis

#### Extension Popup
- Click extension icon in toolbar
- View recent bookmarks
- Quick save with manual input
- See save status

#### All Methods Support:
✅ All 6 content types (videos, products, tweets, articles, notes, images)
✅ Automatic content detection
✅ AI-powered tagging
✅ Semantic search embedding
✅ Offline queue (saves when back online)

### AI Features

- **Smart Tags**: Automatically generated based on content
- **Summaries**: AI-powered content summaries
- **Key Points**: Extracted main points from articles
- **Content Analysis**: Intelligent categorization
- **OCR**: Extract text from images
- **Semantic Search**: Find bookmarks by meaning, not just keywords

### Search System

**How Semantic Search Works:**

```
User enters search query (e.g., "python tutorial")
  ↓
Generate search query embedding (Google Gemini 768D)
  ↓
Keyword expansion:
  - "python" → ["python", "programming", "coding", "development"]
  - "tutorial" → ["tutorial", "guide", "lesson", "course", "learn"]
  ↓
Database query with 2 strategies:
  
  1. Vector Similarity (Semantic):
     - Calculate cosine similarity between query embedding and all bookmark embeddings
     - Find bookmarks with similarity > 0.7
     - Example: Finds "Django guide" even if "python" not mentioned
  
  2. Keyword Matching (Fallback):
     - Search in title, content, tags, URL
     - Use expanded keywords
     - Case-insensitive, partial match
  ↓
Combine and rank results
  ↓
Return bookmarks sorted by relevance
```

**Keyword Expansion Examples:**
- `study` → learn, education, book, textbook, tutorial, course
- `math` → mathematics, algebra, calculus, geometry, arithmetic
- `code` → programming, coding, development, software
- `buy` → purchase, shopping, store, product

**Search Features:**
- ✅ Semantic search (finds similar concepts)
- ✅ Keyword expansion (finds related terms)
- ✅ OCR text search (searches text in images)
- ✅ Tag-based filtering
- ✅ Content type filtering

## 🛠️ Development Commands

```bash
# Development
npm run dev                      # Start dev server (Turbopack)
npm run build                    # Build for production
npm start                        # Start production server

# Database
npx prisma studio                # Open database GUI
npx prisma generate              # Regenerate Prisma client
npx prisma migrate dev           # Create and apply migration
npx prisma db push               # Push schema changes (dev only)

# Utilities
npm run regenerate-embeddings    # Regenerate all embeddings (Gemini)
npm run regenerate-tags          # Regenerate AI tags for all bookmarks

# Code Quality
npm run lint                     # Run ESLint
npm run lint:fix                 # Auto-fix linting issues
npm run format                   # Format code with Prettier
npx tsc --noEmit                 # Type checking
```

## 💰 Cost Estimation

### Free Tier Usage (Recommended Setup)

**Google Gemini (Embeddings):**
- **Free Tier**: 1,500 requests/day
- **Paid**: $0.0001 per 1,000 characters (if over free tier)
- **Your Cost**: $0.00/month (stay within free tier)
- **Usage**: ~1 embedding per bookmark save + 1 per search

**Neon Database (Serverless PostgreSQL):**
- **Free Tier**: 0.5 GB storage, 3 GB transfer
- **Paid**: $20/month for 10 GB storage
- **Your Cost**: $0.00/month (free tier sufficient for 10K+ bookmarks)

**AWS S3 (Image Storage):**
- **Storage**: $0.023/GB/month
- **Requests**: $0.0004 per 1,000 GET requests
- **Your Cost**: ~$0.01-0.10/month (for 100-1,000 images)

**Anthropic Claude (Content Analysis):**
- **Claude Haiku**: $0.25/million input tokens, $1.25/million output
- **Claude Sonnet**: $3/million input tokens, $15/million output
- **Your Cost**: ~$0.01-0.05/month (for 100 bookmarks with AI analysis)

### Total Estimated Monthly Cost
- **Light Use** (100 bookmarks/month): **$0.01-0.10**
- **Heavy Use** (1,000 bookmarks/month): **$0.50-2.00**
- **Enterprise** (10,000 bookmarks/month): **$5-20**

**Cost Optimization:**
- ✅ Gemini free tier (vs OpenAI $0.02/1M tokens)
- ✅ Image optimization (WebP, compression)
- ✅ Claude Haiku for tagging (10x cheaper than GPT-4)
- ✅ Neon free tier for small teams

## 📚 Tech Stack

### Frontend & Framework
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons

### Backend & Database
- **Database**: PostgreSQL with pgvector extension (Neon serverless recommended)
- **ORM**: Prisma 6.19.0
- **Vector Database**: pgvector (768-dimensional embeddings)

### AI & Machine Learning
- **Embeddings**: Google Gemini `text-embedding-004` (768D, FREE 1,500/day)
- **Content Analysis**: Anthropic Claude 3.5 Sonnet (vision model)
- **Tagging**: Claude 3 Haiku (fast, cheap)
- **OCR**: Claude Vision API
- **Fallback**: OpenAI text-embedding-3-small (1536D)

### Storage & Processing
- **Image Storage**: AWS S3
- **Image Processing**: Sharp (resize, WebP conversion, compression)
- **SDK**: @aws-sdk/client-s3, @aws-sdk/lib-storage

### Security & Auth
- **Authentication**: JWT with jose library
- **Password Hashing**: bcryptjs (10 rounds)
- **Validation**: Zod schemas
- **Cookies**: HTTP-only, SameSite, Secure

### Utilities
- **Scraping**: Cheerio
- **Extension**: Chrome Manifest V3
- **Environment**: dotenv (for scripts)

## � Image Bookmark Feature (Detailed)

### Why Save Images as Bookmarks?

- 📊 **Infographics**: Save data visualizations with searchable text
- 📝 **Screenshots**: Code snippets, error messages, documentation
- 🎨 **Design Inspiration**: UI designs, color palettes, mockups
- 📚 **Study Material**: Diagrams, charts, educational graphics
- 🛍️ **Product Images**: Save items you want to buy later

### What Gets Extracted from Images?

1. **OCR Text**: All readable text in the image (searchable!)
2. **AI Description**: 2-3 sentence summary of what's in the image
3. **Objects**: Detected items (e.g., "laptop", "code", "diagram")
4. **Tags**: 5-10 relevant tags automatically generated
5. **Context**: Page title, URL, surrounding text from webpage
6. **Metadata**: Image dimensions, size, format

### Example: Saving a Code Screenshot

**What You Save:**
- Screenshot of Python code from Stack Overflow

**What Synapse Extracts:**
```json
{
  "ocrText": "def hello_world():\n    print('Hello, World!')\n    return True",
  "imageDescription": "A Python code snippet showing a simple function definition with a print statement",
  "objects": ["code", "python", "function", "programming"],
  "tags": ["python", "programming", "code-snippet", "function", "tutorial"],
  "context": {
    "pageTitle": "How to write a Python function - Stack Overflow",
    "pageUrl": "https://stackoverflow.com/...",
    "surroundingText": "The simplest way to create a function in Python is..."
  }
}
```

**How You Can Find It Later:**
- Search "python function" → Finds it semantically
- Search "hello world" → Finds OCR text match
- Search "code snippet" → Finds via tags
- Browse by "work" category → Auto-categorized

### Image Processing Pipeline

```
Original Image (any format, any size)
  ↓
Download & Validate (max 5MB)
  ↓
Resize (max 2000px width/height)
  ↓
Convert to WebP format (smaller file size)
  ↓
Compress to 85% quality (balance quality/size)
  ↓
Upload to S3 (CDN-enabled, public read)
  ↓
✅ Result: Optimized image, ~70% smaller than original
```

## �🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Use pooler connection string for Neon (ends with `-pooler`)
- Check if database tables exist: `npx prisma studio`
- Ensure pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`

### Authentication Not Working
- Verify `JWT_SECRET` is set and consistent
- Clear browser cookies and try again
- Check browser console for errors
- Ensure cookies are HTTP-only and SameSite

### AI Features Not Working
- **Claude API**: Verify `ANTHROPIC_API_KEY` is correct and not truncated
- **Gemini API**: Verify `GOOGLE_API_KEY` is set
- Check API quota/limits in respective dashboards
- Review server logs for API errors
- Test with: `npm run regenerate-embeddings`

### Embedding Issues
- **"Expected 1536 dimensions, not 768"**: Database not migrated, run SQL:
  ```sql
  ALTER TABLE "Bookmark" DROP COLUMN embedding;
  ALTER TABLE "Bookmark" ADD COLUMN embedding vector(768);
  ```
- **"No embedding provider"**: Check `.env.local` has `GOOGLE_API_KEY`
- **Search not working**: Run `npm run regenerate-embeddings`

### Image Upload Issues
- **"Image too large"**: Max 5MB supported
- **"S3 upload failed"**: Verify AWS credentials in `.env.local`
- **"Claude Vision error"**: Check Anthropic API key and quota
- **OCR not working**: Ensure using Claude Sonnet (vision model)

### Extension Not Connecting
- Ensure web app is running on correct URL
- Update `API_BASE_URL` in extension files
- Check extension has correct permissions in manifest.json
- Reload extension after making changes
- Check browser console for CORS errors

## 📖 Documentation

- `README.md` - This file (quick start guide)
- `PROJECT-SUMMARY.md` - Complete technical documentation
- `TESTING-DEPLOYMENT.md` - Comprehensive testing and deployment guide
- `chrome-extension/README.md` - Chrome extension documentation

## ⌨️ Keyboard Shortcuts & Save Methods Reference

### Chrome Extension Shortcuts

| Shortcut | Action | Content Types |
|----------|--------|---------------|
| `Ctrl+Shift+S` | Save current page | All (videos, products, tweets, articles) |
| `Ctrl+Shift+X` | Save selected text | Notes only |
| Right-click → Menu | Context menu save | Pages, links, images |

### Save Methods by Content Type

| Content Type | Best Method | What Gets Captured |
|--------------|-------------|-------------------|
| 📺 **Video** | `Ctrl+Shift+S` on video page | Title, thumbnail, duration, metadata |
| 🛍️ **Product** | `Ctrl+Shift+S` on product page | Title, price, image, description |
| 🐦 **Tweet** | `Ctrl+Shift+S` on tweet | Content, author, timestamp |
| 📄 **Article** | `Ctrl+Shift+S` on article page | Full text, metadata, author |
| 📝 **Note** | `Ctrl+Shift+X` on selected text | Highlighted text only |
| 📸 **Image** | Right-click image → Save | Image + OCR + AI analysis |

### What Happens After Save (All Content Types)

```
User Action (Ctrl+Shift+S or Right-click)
  ↓
Content Extraction (title, metadata, text)
  ↓
AI Tag Generation (Claude Haiku)
  ↓
768D Embedding (Google Gemini - FREE)
  ↓
Database Save (PostgreSQL + pgvector)
  ↓
✅ Instantly Searchable!
   - Keyword search
   - Semantic search
   - Tag filtering
   - Full-text search
```

### Special Features by Content Type

**Videos:**
- ✅ Auto-detect platform (YouTube, Vimeo, etc.)
- ✅ Extract video ID
- ✅ Fetch thumbnail automatically

**Products:**
- ✅ Auto-categorize as "shopping"
- ✅ Extract price (if available)
- ✅ Capture product image

**Images:**
- ✅ OCR text extraction (searchable)
- ✅ Claude Vision AI description
- ✅ Object/concept detection
- ✅ S3 cloud storage with CDN
- ✅ Automatic optimization (WebP, compression)
- ✅ Context capture (page title, URL, surrounding text)

---

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Support

For issues and questions:
- Check the documentation files listed above
- Review browser console for errors
- Verify all environment variables are set correctly

## 🎯 Pro Tips

1. **Use keyboard shortcuts** for fastest saving
2. **Save images with context** by right-clicking (better than just saving image URL)
3. **Selected text saves** preserve exact quotes with `Ctrl+Shift+X`
4. **Semantic search** understands concepts, not just keywords
5. **OCR search** finds text inside images - save screenshots of code, diagrams, etc.
6. **Free Gemini tier** gives you 1,500 embeddings/day - enough for heavy usage!

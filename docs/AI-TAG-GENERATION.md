# AI-Powered Tag Generation

## Overview

Synapse now uses **AI-powered dynamic tag generation** for all bookmarks. Tags are no longer hardcoded - they are generated intelligently by Claude AI based on the bookmark's title, content, and URL.

## How It Works

### 1. **Automatic Tag Generation**
When you save a bookmark (via extension or web app), the system automatically:
- Analyzes the title, content, and URL
- Uses Claude AI to extract 3-5 relevant keywords
- Generates tags like: `javascript`, `tutorial`, `react`, `web-development`
- Stores them with the bookmark

### 2. **Smart Tag Rules**
The AI follows these rules:
- ✅ Concise (1-2 words max)
- ✅ Specific to the content (not generic)
- ✅ Lowercase for consistency
- ✅ Technology names, topics, categories, or key concepts
- ✅ Limited to 5 tags per bookmark

### 3. **Tag Merging**
If you provide your own tags, the system will:
- Generate AI tags from the content
- Merge them with your provided tags
- Keep the most relevant 8 tags total
- **AI tags take priority** (appear first)

## Examples

### Example 1: Tech Article
**Input:**
- Title: "Building a REST API with Node.js and Express"
- Content: "Learn how to create a robust REST API using Node.js..."

**Generated Tags:**
```
nodejs, express, rest-api, backend, tutorial
```

### Example 2: Shopping
**Input:**
- Title: "iPhone 15 Pro - Best Price"
- Content: "Get the latest iPhone 15 Pro with amazing deals..."

**Generated Tags:**
```
shopping, iphone, electronics, deals, apple
```

### Example 3: Research Paper
**Input:**
- Title: "Machine Learning Applications in Healthcare"
- Content: "This paper explores various ML techniques..."

**Generated Tags:**
```
machine-learning, healthcare, ai, research, paper
```

## Usage

### For New Bookmarks
No action needed! Tags are generated automatically when you save any bookmark.

### For Existing Bookmarks
To regenerate tags for all your existing bookmarks:

```bash
# Navigate to synapse-app directory
cd synapse-app

# Run the regeneration script
npm run regenerate-tags
```

This will:
1. Fetch all your bookmarks
2. Analyze each one with AI
3. Generate new tags based on content
4. Merge with existing tags
5. Update the database

**Note:** This may take a few minutes if you have many bookmarks (1 second per bookmark to avoid API rate limits).

## API Configuration

Make sure you have Claude AI configured in your `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Without this key, the system will skip AI tag generation and use empty tags or user-provided tags only.

## Benefits

### 🎯 Better Organization
- Tags are contextually relevant
- Easier to find bookmarks later
- Automatic categorization

### 🔍 Improved Search
- Tags enhance semantic search
- Better keyword matching
- More accurate results

### ⚡ Zero Effort
- No need to think of tags manually
- Consistent tagging across all bookmarks
- Works with any content type

### 🧠 Smart & Adaptive
- Learns from content patterns
- Understands context and meaning
- Generates domain-specific tags

## Technical Details

### File Structure
```
src/lib/ai.ts              # AI tag generation logic
src/app/api/bookmarks/     # API route with tag generation
scripts/regenerate-tags.ts # Script to update existing bookmarks
```

### Tag Generation Flow
```
Bookmark Saved
    ↓
Extract title + content + URL
    ↓
Send to Claude AI (generateSmartTags)
    ↓
AI analyzes and returns tags
    ↓
Clean & validate tags
    ↓
Merge with user tags (if any)
    ↓
Save to database
```

### Error Handling
- If AI fails, uses user-provided tags (if any)
- If no AI and no user tags, saves with empty array
- Graceful degradation - never blocks bookmark saving

## Monitoring

Check the server logs to see tag generation in action:

```
🤖 Generating AI-powered tags...
🏷️ Generated tags: javascript, tutorial, react, web-dev, coding
✨ Generated 5 AI tags
✓ Generated 1536-dimensional embedding
✅ Bookmark created successfully!
```

## Cost

Using Claude Haiku for tag generation:
- **Cost:** ~$0.00025 per bookmark (very cheap!)
- **Speed:** ~500ms per generation
- **Model:** claude-3-haiku-20240307

## Customization

Want to change tag generation behavior? Edit `src/lib/ai.ts`:

```typescript
// Change number of tags
const cleanedTags = tags.slice(0, 5); // Change 5 to your preferred number

// Change tag length limits
.filter((tag: string) => tag.length >= 2 && tag.length <= 30)

// Modify AI prompt
const prompt = `Your custom instructions...`;
```

## FAQ

**Q: Can I turn off AI tag generation?**  
A: Remove or comment out `ANTHROPIC_API_KEY` from `.env`. The system will skip AI generation.

**Q: How accurate are the AI tags?**  
A: Very accurate! Claude AI is excellent at understanding content and extracting key concepts.

**Q: Can I manually edit tags?**  
A: Yes! Tags can be edited in the web UI. AI tags are just intelligent defaults.

**Q: What if I want more/fewer tags?**  
A: Edit the `slice(0, 5)` in `src/lib/ai.ts` to your preferred number.

**Q: Does this work offline?**  
A: No, AI tag generation requires internet and Claude API access.

---

Built with ❤️ using Claude AI

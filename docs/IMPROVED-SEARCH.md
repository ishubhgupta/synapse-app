# Improved Search with Keyword Expansion

## What's New?

The search functionality has been significantly improved with **intelligent keyword expansion**. When you search, the system now automatically expands your query to include synonyms, related terms, and contextual words.

## How It Works

### Example 1: Searching "study"

**Before:**
- Only searched for exact word "study"
- Missed books with words like "learning", "tutorial", "education"

**Now:**
- Searches for: `study`, `learn`, `learning`, `education`, `book`, `textbook`, `tutorial`, `course`, `lesson`, `guide`, `academic`
- **Result:** Finds your maths book, study guides, educational videos, and more!

### Example 2: Searching "maths"

**Expanded to:**
- `maths`, `math`, `mathematics`, `algebra`, `calculus`, `geometry`, `arithmetic`, `numerical`

**Result:** Catches both "Math Book" and "Mathematics Tutorial"

### Example 3: Searching "phone"

**Expanded to:**
- `phone`, `smartphone`, `mobile`, `iphone`, `android`, `cellular`, `device`

**Result:** Finds all phone-related bookmarks regardless of exact wording

## Full Expansion Dictionary

### 📚 Educational Terms
- **study** → study, learn, learning, education, book, textbook, tutorial, course, lesson, guide, academic
- **learn** → learn, learning, study, education, tutorial, course, lesson, training
- **education** → education, educational, learning, study, academic, school, course, training

### 🔢 Academic Subjects
- **math/maths** → math, maths, mathematics, algebra, calculus, geometry, arithmetic, numerical
- **science** → science, scientific, physics, chemistry, biology, research, experiment
- **physics** → physics, physical, science, mechanics, quantum, thermodynamics

### 💻 Technology
- **code** → code, coding, programming, development, software, script
- **programming** → programming, coding, code, development, software, dev
- **tech** → tech, technology, technical, computing, digital, software, hardware

### 📱 Devices
- **phone** → phone, smartphone, mobile, iphone, android, cellular, device
- **laptop** → laptop, computer, notebook, pc, macbook, device
- **computer** → computer, pc, laptop, desktop, machine, device

### 🛒 Shopping
- **buy** → buy, purchase, shopping, shop, order, product, deal
- **shop** → shop, shopping, buy, purchase, store, product, deal
- **product** → product, item, goods, merchandise, shopping

### 📺 Content Types
- **video** → video, watch, youtube, tutorial, film, movie, clip
- **article** → article, post, blog, read, story, news, writing
- **book** → book, ebook, textbook, reading, literature, publication

## How to Use

Just search naturally! The system will:

1. **Extract keywords** from your query
2. **Expand them** with related terms
3. **Search across** title, content, tags, and URL
4. **Return all matches** that contain any of the expanded keywords

### Search Examples

```
Search: "study"
Finds: Math Book, Learning Python Tutorial, Study Guide PDF, Educational Videos

Search: "math homework"
Finds: Mathematics Textbook, Algebra Help, Geometry Tutorial, Homework Solutions

Search: "phone shopping"
Finds: iPhone 15 Deal, Best Smartphones 2024, Mobile Phone Comparison, Android Reviews

Search: "coding tutorial"
Finds: Python Programming Guide, JavaScript Course, Software Development Tutorial
```

## Technical Details

### Where Expansion Happens

1. **Smart Search** (`src/lib/smartSearch.ts`)
   - Claude AI provides aggressive keyword expansion
   - Contextual understanding of query intent

2. **Regular Search** (`src/app/api/bookmarks/search/route.ts`)
   - Fallback expansion using predefined dictionary
   - Works even without AI

3. **Both Routes** use keyword expansion
   - Smart search: AI-powered + dictionary
   - Regular search: Dictionary-based

### Performance Impact

- ✅ **Minimal** - Expansion happens in-memory
- ✅ **Fast** - No additional database queries
- ✅ **Scalable** - Works with large bookmark collections

### Database Queries

The expanded keywords are combined with OR logic:

```sql
WHERE (
  title ILIKE '%study%' OR
  title ILIKE '%learn%' OR
  title ILIKE '%education%' OR
  title ILIKE '%book%' OR
  -- ... all expanded keywords
  content ILIKE '%study%' OR
  -- ... and so on
)
```

## Customization

Want to add your own keyword expansions? Edit the `keywordExpansions` object:

**In `src/lib/smartSearch.ts` (line ~220):**
```typescript
const keywordExpansions: Record<string, string[]> = {
  'yourword': ['yourword', 'synonym1', 'synonym2', 'related1'],
  // Add more...
};
```

**In `src/app/api/bookmarks/search/route.ts` (line ~40):**
```typescript
const keywordExpansions: Record<string, string[]> = {
  'yourword': ['yourword', 'synonym1', 'synonym2', 'related1'],
  // Add more...
};
```

## Benefits

### 🎯 Better Recall
- Finds relevant bookmarks even with different wording
- No need to remember exact titles or tags

### 🧠 Smarter Matching
- Understands context and intent
- Semantic relationships between terms

### ⚡ Zero Effort
- No configuration needed
- Works automatically on all searches

### 📈 More Results
- Broader search coverage
- Less "no results" scenarios

## Tips for Best Results

1. **Use key concepts** - Search "study math" instead of "I need to study mathematics"
2. **Single words work great** - "study", "phone", "code" are all expanded
3. **Combine terms** - "math tutorial" gets both expansions
4. **Check AI tags** - New bookmarks have auto-generated tags that work with expansion

## Future Improvements

- [ ] User-customizable expansion dictionary
- [ ] Learning from search history
- [ ] Domain-specific expansions (medical, legal, etc.)
- [ ] Multi-language support
- [ ] Fuzzy matching for typos

---

🔍 Search smarter, not harder!

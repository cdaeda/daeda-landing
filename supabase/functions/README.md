# Supabase Edge Functions

This directory contains Supabase Edge Functions that power the AI chat capabilities.

## Functions

### 1. `knowledge-search` ⭐ RECOMMENDED
Smart search that checks local knowledgebase first, then Brave API if needed. Results are cached and summarized for AI consumption.

**Purpose:**
- Search local knowledgebase first (caching layer)
- Only call Brave API when fresh research is needed
- Summarize and cache results for future use
- Provide AI-optimized compact summaries

**How it works:**
1. Hashes the query and checks `ai_knowledgebase` table
2. Returns cached results if found (instant response)
3. Calls Brave API only if no cache hit
4. Summarizes results into AI-optimized format
5. Caches the summary for future queries

**Environment Variables Required:**
- `BRAVE_API_KEY` - Stored in Supabase secrets (key: `BSAdGKT2xhOUAWSuXqbUPs8glqsULrU`)

### 2. `brave-search` (Legacy)
Direct Brave API search without caching. Use `knowledge-search` instead.

**Purpose:**
- Research industry-specific AI applications
- Find relevant case studies and examples

### 3. `mcp-context`
Model Context Protocol (MCP) function that provides intelligent context management for the AI chat.

**Purpose:**
- Extract business insights from conversation
- Maintain conversation context across messages
- Suggest relevant AI use cases based on industry/pain points
- Track conversation stage (discovery → exploration → solutioning → closing)
- Generate contextual probing questions

**Features:**
- Industry-specific AI use case database
- Pain point → AI solution mapping
- Conversation stage tracking
- Knowledge gap identification

## Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Link your Supabase project
```bash
supabase login
supabase link --project-ref your-project-ref
```

### 3. Set up environment variables
```bash
# Add your Brave API key to Supabase secrets
supabase secrets set BRAVE_API_KEY=BSAdGKT2xhOUAWSuXqbUPs8glqsULrU
```

### 4. Deploy the functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy knowledge-search
supabase functions deploy mcp-context
```

### 5. Enable CORS (if needed)
The functions are configured to allow CORS from any origin. In production, you may want to restrict this to your domain.

## Local Development

To test functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve
```

The functions will be available at:
- `http://localhost:54321/functions/v1/knowledge-search`
- `http://localhost:54321/functions/v1/mcp-context`

## Database Schema

### `ai_knowledgebase` ⭐ NEW
Smart caching layer for AI research:
- `query` - Original search query
- `query_hash` - Hashed query for fast lookups
- `source_type` - 'brave_search' or 'docs'
- `content` - Full raw content
- `summary` - Human-readable summary
- `ai_optimized_content` - Condensed, AI-friendly format
- `use_count` - How many times this was retrieved
- `created_at` / `updated_at` / `last_accessed_at` - Timestamps

### `chat_context`
Stores conversation context for intelligent responses:
- `session_id` - Links to chat session
- `context` - JSONB containing industry, pain points, goals, tools, etc.
- `created_at` / `updated_at` - Timestamps

### `chat_sessions`
Tracks active chat sessions with status (active/submitted/closed).

### `chat_messages`
Stores individual messages with role (user/model).

## How It Works

1. **User sends a message** → Frontend calls `mcp-context` to get smart context
2. **MCP analyzes** the message for:
   - Industry mentions
   - Pain points
   - Company size
   - Goals
   - Current tools
3. **MCP returns** enhanced context including:
   - Relevant AI use cases for their industry
   - Matched pain point solutions
   - Suggested follow-up questions
   - Conversation stage
4. **Smart Search** (only in exploration stage):
   - Calls `knowledge-search` which checks cache first
   - If cache miss, calls Brave API and caches results
   - Returns AI-optimized summary
5. **Frontend calls Gemini** with enhanced system prompt + research
6. **AI responds** with personalized, research-backed suggestions

## Cost Considerations

- **Brave Search API**: Free tier includes 2,000 queries/month
  - With smart caching, most queries will hit cache after initial research
  - Estimated 80%+ cache hit rate after first week
- **Supabase Edge Functions**: Included in free tier (500K invocations/month)
- **Supabase Database**: Knowledgebase storage is minimal (text summaries only)
- **Gemini API**: Separate from these functions

## Security

- API keys are stored as Supabase secrets (encrypted)
- Functions use CORS headers for cross-origin protection
- Anonymous users can access functions (no auth required)
- Input validation is performed on all requests

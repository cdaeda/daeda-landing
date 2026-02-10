# Supabase Edge Functions

This directory contains Supabase Edge Functions that power the AI chat capabilities.

## Functions

### 1. `brave-search`
Performs real-time web searches using the Brave Search API to gather relevant industry information and AI use cases.

**Purpose:**
- Research industry-specific AI applications
- Find relevant case studies and examples
- Stay current on AI trends for the user's business domain

**Environment Variables Required:**
- `BRAVE_API_KEY` - Get from https://brave.com/search/api/

### 2. `mcp-context`
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
supabase secrets set BRAVE_API_KEY=your_api_key_here
```

### 4. Deploy the functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy brave-search
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
- `http://localhost:54321/functions/v1/brave-search`
- `http://localhost:54321/functions/v1/mcp-context`

## Database Schema

The MCP system uses the following tables:

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
4. **Frontend calls Gemini** with the enhanced system prompt
5. **Optional:** If in exploration stage, calls `brave-search` for real-time research
6. **AI responds** with personalized, context-aware suggestions

## Cost Considerations

- **Brave Search API**: Free tier includes 2,000 queries/month
- **Supabase Edge Functions**: Included in free tier (500K invocations/month)
- **Gemini API**: Separate from these functions

## Security

- API keys are stored as Supabase secrets (encrypted)
- Functions use CORS headers for cross-origin protection
- Anonymous users can access functions (no auth required)
- Input validation is performed on all requests

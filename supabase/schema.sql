-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anonymous users
CREATE POLICY "Allow anonymous insert" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Create policy to allow select only for authenticated users (admin)
CREATE POLICY "Allow authenticated select" ON contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create index for status filtering
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- =====================================================
-- AI Chat Tables for "Let's Ideate!" feature
-- =====================================================

-- Create chat_sessions table to track AI chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_messages table to store conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_context table for MCP (Model Context Protocol)
CREATE TABLE IF NOT EXISTS chat_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id)
);

-- Create ideation_submissions table for AI chat leads
CREATE TABLE IF NOT EXISTS ideation_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  chat_summary TEXT,
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'proposal_sent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on new tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideation_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for chat_context
CREATE POLICY "Allow anonymous insert on chat_context" ON chat_context
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select on chat_context" ON chat_context
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update on chat_context" ON chat_context
  FOR UPDATE USING (true);

-- Policies for chat_sessions
CREATE POLICY "Allow anonymous insert on chat_sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select own session" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update own session" ON chat_sessions
  FOR UPDATE USING (true);

-- Policies for chat_messages
CREATE POLICY "Allow anonymous insert on chat_messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select session messages" ON chat_messages
  FOR SELECT USING (true);

-- Policies for ideation_submissions
CREATE POLICY "Allow anonymous insert on ideation_submissions" ON ideation_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated select on ideation_submissions" ON ideation_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_context_session_id ON chat_context(session_id);
CREATE INDEX idx_ideation_submissions_status ON ideation_submissions(status);
CREATE INDEX idx_ideation_submissions_created_at ON ideation_submissions(created_at DESC);
CREATE INDEX idx_ideation_submissions_session_id ON ideation_submissions(session_id);

-- AI Knowledgebase table for caching research and insights
CREATE TABLE IF NOT EXISTS ai_knowledgebase (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  query_hash TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('brave_search', 'docs', 'summarized')),
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  ai_optimized_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE ai_knowledgebase ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads and inserts
CREATE POLICY "Allow anonymous select on knowledgebase" ON ai_knowledgebase
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on knowledgebase" ON ai_knowledgebase
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on knowledgebase" ON ai_knowledgebase
  FOR UPDATE USING (true);

-- Indexes for knowledgebase
CREATE INDEX idx_knowledgebase_query_hash ON ai_knowledgebase(query_hash);
CREATE INDEX idx_knowledgebase_source ON ai_knowledgebase(source_type);
CREATE INDEX idx_knowledgebase_created_at ON ai_knowledgebase(created_at DESC);

-- Trigger to update ai_knowledgebase timestamps
CREATE OR REPLACE FUNCTION update_knowledgebase_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  NEW.last_accessed_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_knowledgebase_timestamps ON ai_knowledgebase;
CREATE TRIGGER update_knowledgebase_timestamps
  BEFORE UPDATE ON ai_knowledgebase
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledgebase_timestamps();

-- Trigger to update chat_context.updated_at
CREATE OR REPLACE FUNCTION update_chat_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_context_updated_at ON chat_context;
CREATE TRIGGER update_chat_context_updated_at
  BEFORE UPDATE ON chat_context
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_context_updated_at();

-- Trigger to update chat_sessions.updated_at
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

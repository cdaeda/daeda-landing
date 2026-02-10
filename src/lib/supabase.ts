import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Contact form submissions will not work.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Types for the contact_submissions table
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  created_at?: string;
  status?: 'new' | 'contacted' | 'archived';
}

// Types for AI chat sessions
export interface ChatSession {
  id?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'submitted' | 'closed';
}

// Types for chat messages
export interface ChatMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

// Types for ideation submissions
export interface IdeationSubmission {
  id?: string;
  session_id?: string;
  name: string;
  email: string;
  phone?: string;
  chat_summary?: string;
  created_at?: string;
  status?: 'new' | 'reviewed' | 'contacted' | 'proposal_sent';
}

// Database schema type definition
export type Database = {
  public: {
    Tables: {
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Omit<ContactSubmission, 'id' | 'created_at'>;
        Update: Partial<Omit<ContactSubmission, 'id' | 'created_at'>>;
      };
      chat_sessions: {
        Row: ChatSession;
        Insert: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChatSession, 'id' | 'created_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
      ideation_submissions: {
        Row: IdeationSubmission;
        Insert: Omit<IdeationSubmission, 'id' | 'created_at'>;
        Update: Partial<Omit<IdeationSubmission, 'id' | 'created_at'>>;
      };
    };
  };
};

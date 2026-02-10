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

// Database schema type definition
export type Database = {
  public: {
    Tables: {
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Omit<ContactSubmission, 'id' | 'created_at'>;
        Update: Partial<Omit<ContactSubmission, 'id' | 'created_at'>>;
      };
    };
  };
};

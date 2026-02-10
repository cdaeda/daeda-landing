# Supabase Setup

## Database Schema

To set up the contact form backend, you need to create the `contact_submissions` table in your Supabase project.

### Option 1: Using the SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/ktxxvpnufdaquebeqtvc
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/schema.sql`
5. Click "Run"

### Option 2: Using the Table Editor

1. Go to your Supabase Dashboard
2. Navigate to "Table Editor" in the left sidebar
3. Click "Create a new table"
4. Set the table name to `contact_submissions`
5. Enable "Enable Row Level Security (RLS)"
6. Add the following columns:
   - `id` - uuid (primary key, default: gen_random_uuid())
   - `name` - text (not null)
   - `email` - text (not null)
   - `company` - text (nullable)
   - `message` - text (not null)
   - `status` - text (default: 'new')
   - `created_at` - timestamptz (default: now(), not null)
7. Create the following policies:
   - INSERT: Allow anonymous inserts
   - SELECT: Allow authenticated users only

## Environment Variables

The following environment variables are already configured in `.env`:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe for client-side)

**Important**: Never commit the `.env` file with real credentials to version control. The `.env.example` file is provided as a template.

## Viewing Submissions

To view contact form submissions:

1. Go to your Supabase Dashboard
2. Navigate to "Table Editor"
3. Select the `contact_submissions` table
4. You'll see all submissions with their status and timestamp

## API Reference

The contact form uses the following Supabase client methods:

```typescript
// Insert a new submission
const { data, error } = await supabase
  .from('contact_submissions')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Inc',
    message: 'Hello, I am interested in your services.'
  });

// Query submissions (requires authentication)
const { data, error } = await supabase
  .from('contact_submissions')
  .select('*')
  .order('created_at', { ascending: false });
```

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vlpxhglwybbbgqysxryg.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscHhoZ2x3eWJiYmdxeXN4cnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjcyMjMsImV4cCI6MjEwNzU0MzIyM30.-eXVCixYo74QTEhSDvVPsR4zcxAvuaesEKA1uLTFZww';

  return createBrowserClient(supabaseUrl, supabaseKey);
}

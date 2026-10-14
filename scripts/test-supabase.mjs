import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vlpxhglwybbbgqysxryg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscHhoZ2x3eWJiYmdxeXN4cnlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk2NzIyMywiZXhwIjoyMTA3NTQzMjIzfQ.AN4UNuxQ5QBvdOJW8HiTHbPzjUfgwhDAbytQtOLRbMc';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscHhoZ2x3eWJiYmdxeXN4cnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjcyMjMsImV4cCI6MjEwNzU0MzIyM30.-eXVCixYo74QTEhSDvVPsR4zcxAvuaesEKA1uLTFZww';

async function testConnection() {
  console.log('Testing Supabase connection...');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('Query result (expected if tables not yet created):', error.message, error.code);
    } else {
      console.log('Connected successfully, count:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();

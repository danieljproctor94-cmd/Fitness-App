
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase.from('invalid_table_check').select('*').limit(1)
  
  // If we get a 404/400 (table not found) that means we CONNECTED but table doesn't exist.
  // If we get 401/403 (unauthorized/invalid API key) that means connection failed.
  if (error) {
    console.log('Error:', error.message)
    console.log('Error details:', error)
  } else {
    console.log('Connection successful (or at least no error on select)')
  }

  // Also try auth check
  const { block } = await supabase.auth.getSession()
  console.log('Auth check done')
}

testConnection()

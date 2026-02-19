import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async () => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // 1. Fetch all users with sync enabled
  const { data: syncs } = await supabase.from('google_sync_tokens').select('*')

  let totalImported = 0;

  for (const sync of syncs || []) {
    try {
      // 2. Refresh Access Token
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: sync.refresh_token,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
        }),
      })
      const { access_token } = await tokenResp.json()

      if (!access_token) continue;

      // 3. Fetch Events
      const calendarResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString(), {
        headers: { Authorization: "Bearer " + access_token }
      })
      const { items } = await calendarResp.json()

      // 4. Map to Todos Table
      for (const event of items || []) {
        const { error } = await supabase.from('todos').upsert({
          user_id: sync.user_id,
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          due_date: event.start.dateTime?.split('T')[0] || event.start.date,
          due_time: event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : null,
          last_synced_at: new Date().toISOString()
        }, { onConflict: 'google_event_id' })
        
        if (!error) totalImported++;
      }
    } catch (e) {
      console.error('Sync failed for user', sync.user_id, e)
    }
  }

  return new Response(JSON.stringify({ success: true, imported: totalImported }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

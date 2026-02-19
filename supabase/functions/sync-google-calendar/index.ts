import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  const authHeader = req.headers.get('Authorization')
  let targetUserId = null;
  
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (user) targetUserId = user.id;
  }

  let query = supabase.from('google_sync_tokens').select('*')
  if (targetUserId) {
    query = query.eq('user_id', targetUserId)
  }
  
  const { data: syncs } = await query

  let totalImported = 0;

  for (const sync of syncs || []) {
    try {
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
      const tokenData = await tokenResp.json()
      const access_token = tokenData.access_token

      if (!access_token) continue;

      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      const calendarResp = await fetch(url, {
        headers: { Authorization: "Bearer " + access_token }
      })
      const { items } = await calendarResp.json()

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
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})

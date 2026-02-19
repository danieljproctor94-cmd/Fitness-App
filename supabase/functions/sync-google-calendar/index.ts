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

  try {
    const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const authHeader = req.headers.get('Authorization')
    let targetUserId = null;
    
    if (authHeader) {
      const { data: { user } } = await adminClient.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
        return new Response(JSON.stringify({ error: "Unauthorized", details: "No user found in token" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: syncs } = await adminClient.from('google_sync_tokens').select('*').eq('user_id', targetUserId)

    if (!syncs || syncs.length === 0) {
        return new Response(JSON.stringify({ error: "Not Linked", details: "Google account not linked" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const sync = syncs[0]
    let importedCount = 0;
    let totalFound = 0;

    // Refresh Token
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

    if (!access_token) {
        return new Response(JSON.stringify({ error: "Refresh Failed", details: tokenData.error_description || tokenData.error }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch Events (Start from 2 days ago to be safe)
    const timeMin = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    const calendarResp = await fetch(url, {
        headers: { Authorization: "Bearer " + access_token }
    })
    const calendarData = await calendarResp.json()
    const items = calendarData.items || []
    totalFound = items.length

    for (const event of items) {
        // Upsert logic
        const { error } = await adminClient.from('todos').upsert({
          user_id: sync.user_id,
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          due_date: event.start?.dateTime?.split('T')[0] || event.start?.date,
          due_time: event.start?.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : null,
          last_synced_at: new Date().toISOString()
        }, { onConflict: 'google_event_id' })
        
        if (!error) importedCount++;
    }

    return new Response(JSON.stringify({ 
        success: true, 
        imported: importedCount, 
        found: totalFound,
        debug_range: { from: timeMin, to: timeMax }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Sync Crash", details: err.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

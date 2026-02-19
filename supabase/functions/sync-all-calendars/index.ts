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

    // 1. Fetch all sync tokens
    const { data: syncs, error: syncError } = await adminClient
        .from('google_sync_tokens')
        .select('*')

    if (syncError) throw syncError
    if (!syncs || syncs.length === 0) {
        return new Response(JSON.stringify({ message: "No calendars to sync" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const results = []

    for (const sync of syncs) {
        try {
            console.log(`Syncing calendar for user: ${sync.user_id}`)
            
            // 2. Refresh Token
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
                console.error(`Failed to refresh token for user ${sync.user_id}:`, tokenData)
                results.push({ user_id: sync.user_id, status: 'auth_fail' })
                continue
            }

            // 3. Fetch Events
            const timeMin = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Look back 1 day
            const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Look ahead 30 days
            
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
            const calendarResp = await fetch(url, { headers: { Authorization: "Bearer " + access_token } })
            const calendarData = await calendarResp.json()
            const items = calendarData.items || []

            let importedCount = 0
            for (const event of items) {
                const { error: syncErr } = await adminClient.from('todos').upsert({
                    user_id: sync.user_id,
                    google_event_id: event.id,
                    title: event.summary || 'Untitled Event',
                    description: event.description || '',
                    due_date: event.start.dateTime?.split('T')[0] || event.start.date,
                    due_time: event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : null,
                    last_synced_at: new Date().toISOString(),
                    notify: true,
                    notify_before: '10_min' // Default to 10 minutes before as per user request
                }, { onConflict: 'google_event_id' })
                
                if (!syncErr) importedCount++
            }

            results.push({ user_id: sync.user_id, status: 'success', imported: importedCount })
            
        } catch (userErr) {
            console.error(`Error syncing user ${sync.user_id}:`, userErr)
            results.push({ user_id: sync.user_id, status: 'error', details: userErr.message })
        }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        processed: syncs.length,
        results: results
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Global Sync Crash", details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
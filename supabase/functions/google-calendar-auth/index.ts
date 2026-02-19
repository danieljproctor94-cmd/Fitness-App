import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "No Login Found" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Session Expired" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const gid = Deno.env.get('GOOGLE_CLIENT_ID')
    const gsec = Deno.env.get('GOOGLE_CLIENT_SECRET')

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: gid!,
        client_secret: gsec!,
        grant_type: 'authorization_code',
        redirect_uri: 'postmessage', 
      }),
    })

    const googleData = await tokenResponse.json()

    if (googleData.error) {
       return new Response(JSON.stringify({ error: "Google Exchange Error", details: googleData.error_description || googleData.error }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { error: dbError } = await adminClient
      .from('google_sync_tokens')
      .upsert({
        user_id: user.id,
        refresh_token: googleData.refresh_token,
        access_token: googleData.access_token,
        expires_at: new Date(Date.now() + (googleData.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      return new Response(JSON.stringify({ error: "Storage Error", details: dbError.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log("Starting Initial Sync for user:", user.id)
    const calendarResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString(), {
      headers: { Authorization: "Bearer " + googleData.access_token }
    })
    const { items } = await calendarResp.json()

    let importedCount = 0
    if (items && Array.isArray(items)) {
        for (const event of items) {
          const { error: syncErr } = await adminClient.from('todos').upsert({
            user_id: user.id,
            google_event_id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description || '',
            due_date: event.start.dateTime?.split('T')[0] || event.start.date,
            due_time: event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : null,
            last_synced_at: new Date().toISOString(),
            notify: true,
            notify_before: '10_min'
          }, { onConflict: 'google_event_id' })
          
          if (!syncErr) importedCount++
        }
    }

    return new Response(JSON.stringify({ success: true, imported: importedCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "System Error", details: err.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
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
    const { code } = await req.json()
    
    if (!code) {
        return new Response(JSON.stringify({ error: "No code provided" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Server missing Google secrets" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Exchange Code for Tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: 'postmessage', 
      }),
    })

    const googleData = await tokenResponse.json()

    if (googleData.error) {
       console.error("Google Auth Error:", googleData)
       return new Response(JSON.stringify({ error: googleData.error_description || googleData.error }), { 
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       })
    }

    // 2. Auth Check
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user session" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Save to Database
    const { error: dbError } = await supabase
      .from('google_sync_tokens')
      .upsert({
        user_id: user.id,
        refresh_token: googleData.refresh_token,
        access_token: googleData.access_token,
        expires_at: new Date(Date.now() + (googleData.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      return new Response(JSON.stringify({ error: "Database error: " + dbError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

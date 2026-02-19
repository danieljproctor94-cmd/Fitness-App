import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    
    // Use built-in env vars
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error("Auth Error:", authError)
      return new Response(JSON.stringify({ error: "Invalid user session: " + (authError?.message || "User not found") }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

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

    // 2. Save to Database using Service Role (Admin)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      console.error("DB Error:", dbError)
      return new Response(JSON.stringify({ error: "Database error: " + dbError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error("Function exception:", err)
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

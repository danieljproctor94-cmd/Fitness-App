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
    console.log("Auth Function Started")

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "No Authorization header provided" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log("Token received, length:", token.length)

    // Use Service Role to verify the token - this is the most robust method
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error("Verification Error:", authError)
      return new Response(JSON.stringify({ 
          error: "Invalid user token", 
          details: authError?.message,
          code: authError?.status 
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log("User verified:", user.id)

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
       return new Response(JSON.stringify({ error: googleData.error_description || googleData.error }), { 
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       })
    }

    // 2. Save Refresh Token
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

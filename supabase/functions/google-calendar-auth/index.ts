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
    
    // VERIFY SECRETS
    const SURL = Deno.env.get('SUPABASE_URL')
    const SKEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const GID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GSEC = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!SURL || !SKEY || !GID || !GSEC) {
       return new Response(JSON.stringify({ 
         error: "Missing Env Vars", 
         debug: { url: !!SURL, key: !!SKEY, gid: !!GID, gsec: !!GSEC } 
       }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "No Auth Header" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const adminClient = createClient(SURL, SKEY)

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
          error: "Supabase Auth Failed", 
          details: authError?.message || "User Null",
          token_len: token.length
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Exchange Code for Tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GID,
        client_secret: GSEC,
        grant_type: 'authorization_code',
        redirect_uri: 'postmessage', 
      }),
    })

    const googleData = await tokenResponse.json()

    if (googleData.error) {
       return new Response(JSON.stringify({ 
         error: "Google Auth Failed", 
         details: googleData.error_description || googleData.error 
       }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
      return new Response(JSON.stringify({ error: "Database Error", details: dbError.message }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal Crash", details: err.message }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

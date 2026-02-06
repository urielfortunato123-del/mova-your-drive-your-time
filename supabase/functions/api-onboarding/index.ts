import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const { role, full_name, phone } = body;

    // Validate role
    if (!role || !['passenger', 'driver'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be "passenger" or "driver"' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!full_name || full_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'full_name is required (min 2 chars)' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users_profile')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile already exists', profile: existingProfile }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create users_profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        id: userId,
        role,
        full_name: full_name.trim(),
        phone: phone || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If driver, also create driver_profiles_v2
    if (role === 'driver') {
      const { error: driverError } = await supabase
        .from('driver_profiles_v2')
        .insert({
          user_id: userId,
          is_online: false,
        });

      if (driverError) {
        console.error('Driver profile insert error:', driverError);
        // Don't fail the request, profile was created
      }
    }

    return new Response(
      JSON.stringify({ success: true, profile }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Onboarding error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

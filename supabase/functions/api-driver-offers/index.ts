import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
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

    // Verify user is a driver
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'driver') {
      return new Response(
        JSON.stringify({ error: 'Only drivers can view offers' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active offers (SENT and not expired)
    const now = new Date().toISOString();
    
    const { data: offers, error: offersError } = await supabase
      .from('ride_offers')
      .select(`
        id,
        ride_id,
        status,
        expires_at,
        created_at,
        rides_v2 (
          id,
          origin_lat,
          origin_lng,
          origin_address,
          dest_lat,
          dest_lng,
          dest_address,
          price_cents,
          status
        )
      `)
      .eq('driver_id', userId)
      .eq('status', 'SENT')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (offersError) {
      console.error('Offers fetch error:', offersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch offers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out offers where ride is no longer MATCHING
    const activeOffers = offers?.filter(offer => 
      offer.rides_v2?.status === 'MATCHING'
    ) || [];

    return new Response(
      JSON.stringify({ offers: activeOffers }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Driver offers error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

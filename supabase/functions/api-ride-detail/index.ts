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

    // Get ride_id from query params
    const url = new URL(req.url);
    const rideId = url.searchParams.get('ride_id');

    if (!rideId) {
      return new Response(
        JSON.stringify({ error: 'ride_id query param is required' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ride with RLS (only accessible if user is passenger or driver)
    const { data: ride, error: rideError } = await supabase
      .from('rides_v2')
      .select(`
        *,
        passenger:users_profile!rides_v2_passenger_id_fkey (
          id,
          full_name,
          phone
        ),
        driver:users_profile!rides_v2_driver_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq('id', rideId)
      .maybeSingle();

    if (rideError) {
      console.error('Ride fetch error:', rideError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch ride' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ride) {
      return new Response(
        JSON.stringify({ error: 'Ride not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get driver vehicle info if driver is assigned
    let driverVehicle = null;
    if (ride.driver_id) {
      const { data: driverProfile } = await supabase
        .from('driver_profiles_v2')
        .select('vehicle_plate, vehicle_model, vehicle_year, last_lat, last_lng')
        .eq('user_id', ride.driver_id)
        .maybeSingle();
      
      driverVehicle = driverProfile;
    }

    return new Response(
      JSON.stringify({ 
        ride: {
          ...ride,
          driver_vehicle: driverVehicle
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ride detail error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

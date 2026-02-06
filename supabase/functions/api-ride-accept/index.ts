import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

    // Get ride_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const rideId = pathParts[pathParts.length - 2]; // /api-ride-accept/{ride_id}/accept or just the ID

    // Also accept ride_id from body
    let finalRideId = rideId;
    try {
      const body = await req.json();
      if (body.ride_id) {
        finalRideId = body.ride_id;
      }
    } catch {
      // No body, use URL param
    }

    if (!finalRideId || finalRideId === 'api-ride-accept') {
      return new Response(
        JSON.stringify({ error: 'ride_id is required' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is a driver
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'driver') {
      return new Response(
        JSON.stringify({ error: 'Only drivers can accept rides' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // Check if offer exists and is valid
    const { data: offer, error: offerError } = await supabase
      .from('ride_offers')
      .select('id, ride_id, status, expires_at')
      .eq('ride_id', finalRideId)
      .eq('driver_id', userId)
      .eq('status', 'SENT')
      .gt('expires_at', now)
      .maybeSingle();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: 'No valid offer found for this ride' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check ride is still in MATCHING status (using admin to bypass RLS)
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides_v2')
      .select('id, status, passenger_id')
      .eq('id', finalRideId)
      .single();

    if (rideError || !ride) {
      return new Response(
        JSON.stringify({ error: 'Ride not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ride.status !== 'MATCHING') {
      return new Response(
        JSON.stringify({ error: 'Ride is no longer available', current_status: ride.status }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transaction-like operations (using admin client)
    // 1. Update offer to ACCEPTED
    const { error: acceptOfferError } = await supabaseAdmin
      .from('ride_offers')
      .update({ status: 'ACCEPTED' })
      .eq('id', offer.id);

    if (acceptOfferError) {
      console.error('Accept offer error:', acceptOfferError);
      return new Response(
        JSON.stringify({ error: 'Failed to accept offer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update ride with driver and status ACCEPTED
    const { data: updatedRide, error: updateRideError } = await supabaseAdmin
      .from('rides_v2')
      .update({ 
        driver_id: userId, 
        status: 'ACCEPTED' 
      })
      .eq('id', finalRideId)
      .eq('status', 'MATCHING') // Double-check status to prevent race conditions
      .select()
      .maybeSingle();

    if (updateRideError || !updatedRide) {
      // Rollback offer status
      await supabaseAdmin
        .from('ride_offers')
        .update({ status: 'SENT' })
        .eq('id', offer.id);

      return new Response(
        JSON.stringify({ error: 'Ride was already accepted by another driver' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Expire all other offers for this ride
    await supabaseAdmin
      .from('ride_offers')
      .update({ status: 'EXPIRED' })
      .eq('ride_id', finalRideId)
      .neq('id', offer.id);

    // 4. Create ride event
    await supabaseAdmin
      .from('ride_events')
      .insert({
        ride_id: finalRideId,
        event_type: 'RIDE_ACCEPTED',
        payload: { driver_id: userId },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ride: updatedRide 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ride accept error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

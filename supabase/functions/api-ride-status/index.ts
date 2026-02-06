import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  'MATCHING': ['CANCELLED'],
  'ACCEPTED': ['ARRIVING', 'CANCELLED'],
  'ARRIVING': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const body = await req.json();
    const { ride_id, status: newStatus } = body;

    if (!ride_id) {
      return new Response(
        JSON.stringify({ error: 'ride_id is required' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newStatus) {
      return new Response(
        JSON.stringify({ error: 'status is required' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current ride
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides_v2')
      .select('*')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      return new Response(
        JSON.stringify({ error: 'Ride not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    const isPassenger = ride.passenger_id === userId;
    const isDriver = ride.driver_id === userId;

    if (!isPassenger && !isDriver) {
      return new Response(
        JSON.stringify({ error: 'You are not part of this ride' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Passenger can only cancel before ACCEPTED
    if (isPassenger && !isDriver) {
      if (newStatus !== 'CANCELLED') {
        return new Response(
          JSON.stringify({ error: 'Passengers can only cancel rides' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!['REQUESTED', 'MATCHING'].includes(ride.status)) {
        return new Response(
          JSON.stringify({ error: 'Cannot cancel ride after driver accepted' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Driver can update to ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED
    if (isDriver) {
      const allowedTransitions = VALID_TRANSITIONS[ride.status] || [];
      if (!allowedTransitions.includes(newStatus)) {
        return new Response(
          JSON.stringify({ 
            error: `Cannot transition from ${ride.status} to ${newStatus}`,
            allowed: allowedTransitions 
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update ride status
    const { data: updatedRide, error: updateError } = await supabaseAdmin
      .from('rides_v2')
      .update({ status: newStatus })
      .eq('id', ride_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update ride status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create ride event
    await supabaseAdmin
      .from('ride_events')
      .insert({
        ride_id,
        event_type: `STATUS_${newStatus}`,
        payload: { 
          previous_status: ride.status,
          updated_by: userId,
          user_role: profile.role 
        },
      });

    // If cancelled during MATCHING, expire all offers
    if (newStatus === 'CANCELLED' && ride.status === 'MATCHING') {
      await supabaseAdmin
        .from('ride_offers')
        .update({ status: 'EXPIRED' })
        .eq('ride_id', ride_id);
    }

    return new Response(
      JSON.stringify({ success: true, ride: updatedRide }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ride status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

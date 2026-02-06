import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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

    // Service role client for creating ride_events and ride_offers
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

    // GET - List user's rides
    if (req.method === 'GET') {
      const { data: rides, error } = await supabase
        .from('rides_v2')
        .select('*')
        .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch rides' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ rides }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new ride
    if (req.method === 'POST') {
      // Verify user is a passenger
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile || profile.role !== 'passenger') {
        return new Response(
          JSON.stringify({ error: 'Only passengers can create rides' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { origin, destination, scheduled_for, payment_method, payment_status } = body;

      // Validate input
      if (!origin?.lat || !origin?.lng || !origin?.address) {
        return new Response(
          JSON.stringify({ error: 'origin with lat, lng, address is required' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!destination?.lat || !destination?.lng || !destination?.address) {
        return new Response(
          JSON.stringify({ error: 'destination with lat, lng, address is required' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate payment method
      const validPaymentMethods = ['credit_card', 'debit_card', 'cash', 'pix'];
      const selectedPayment = payment_method || 'cash';
      if (!validPaymentMethods.includes(selectedPayment)) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment method' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // PIX requires payment before requesting
      const paymentIsPaid = selectedPayment === 'pix' || (selectedPayment === 'credit_card' && payment_status === 'paid');
      const finalPaymentStatus = paymentIsPaid ? 'paid' : 'pending';

      // Create ride with MATCHING status
      const { data: ride, error: rideError } = await supabase
        .from('rides_v2')
        .insert({
          passenger_id: userId,
          status: 'MATCHING',
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          origin_address: origin.address,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          dest_address: destination.address,
          scheduled_for: scheduled_for || null,
          payment_method: selectedPayment,
          payment_status: finalPaymentStatus,
          paid_at: paymentIsPaid ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (rideError) {
        console.error('Ride creation error:', rideError);
        return new Response(
          JSON.stringify({ error: 'Failed to create ride' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create ride_event for creation (using admin client)
      await supabaseAdmin
        .from('ride_events')
        .insert({
          ride_id: ride.id,
          event_type: 'RIDE_CREATED',
          payload: { status: 'MATCHING' },
        });

      // MATCHING: Find online drivers within last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { data: onlineDrivers } = await supabaseAdmin
        .from('driver_profiles_v2')
        .select('user_id, last_lat, last_lng')
        .eq('is_online', true)
        .gte('last_seen', twoMinutesAgo)
        .not('last_lat', 'is', null)
        .not('last_lng', 'is', null);

      if (onlineDrivers && onlineDrivers.length > 0) {
        // Calculate distance and sort
        const driversWithDistance = onlineDrivers.map(driver => ({
          ...driver,
          distance: haversineDistance(
            origin.lat, origin.lng,
            driver.last_lat!, driver.last_lng!
          ),
        }));

        driversWithDistance.sort((a, b) => a.distance - b.distance);
        const topDrivers = driversWithDistance.slice(0, 5);

        // Create ride_offers with 90 second expiry
        const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();
        
        const offers = topDrivers.map(driver => ({
          ride_id: ride.id,
          driver_id: driver.user_id,
          status: 'SENT',
          expires_at: expiresAt,
        }));

        await supabaseAdmin.from('ride_offers').insert(offers);

        // Log matching event
        await supabaseAdmin
          .from('ride_events')
          .insert({
            ride_id: ride.id,
            event_type: 'MATCHING_STARTED',
            payload: { drivers_notified: topDrivers.length },
          });
      }

      return new Response(
        JSON.stringify({ success: true, ride_id: ride.id, status: ride.status }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rides error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

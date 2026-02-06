import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
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
    // Validar API Key
    let apiKey = req.headers.get('X-API-KEY');
    if (!apiKey) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('ApiKey ')) {
        apiKey = authHeader.replace('ApiKey ', '');
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validar key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, scope, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API Key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar last_used_at
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    // Buscar métricas
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total de usuários
    const { count: totalPassengers } = await supabaseAdmin
      .from('users_profile')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'passenger');

    const { count: totalDrivers } = await supabaseAdmin
      .from('users_profile')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver');

    // Motoristas online agora
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { count: driversOnline } = await supabaseAdmin
      .from('driver_profiles_v2')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true)
      .gte('last_seen', twoMinutesAgo);

    // Corridas hoje
    const { count: ridesToday } = await supabaseAdmin
      .from('rides_v2')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay);

    // Corridas completadas hoje
    const { count: ridesCompletedToday } = await supabaseAdmin
      .from('rides_v2')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')
      .gte('created_at', startOfDay);

    // Corridas no mês
    const { count: ridesThisMonth } = await supabaseAdmin
      .from('rides_v2')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // Faturamento do mês (em centavos)
    const { data: revenueData } = await supabaseAdmin
      .from('rides_v2')
      .select('price_cents')
      .eq('status', 'COMPLETED')
      .gte('created_at', startOfMonth);

    const monthlyRevenue = revenueData?.reduce((sum, r) => sum + (r.price_cents || 0), 0) || 0;

    // Corridas por status
    const { data: statusBreakdown } = await supabaseAdmin
      .from('rides_v2')
      .select('status')
      .gte('created_at', startOfMonth);

    const statusCounts: Record<string, number> = {};
    statusBreakdown?.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        generated_at: now.toISOString(),
        users: {
          total_passengers: totalPassengers || 0,
          total_drivers: totalDrivers || 0,
          drivers_online_now: driversOnline || 0,
        },
        rides: {
          today: {
            total: ridesToday || 0,
            completed: ridesCompletedToday || 0,
          },
          this_month: {
            total: ridesThisMonth || 0,
            by_status: statusCounts,
          },
        },
        revenue: {
          this_month_cents: monthlyRevenue,
          this_month_brl: (monthlyRevenue / 100).toFixed(2),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin metrics error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

    // Parâmetros de filtro
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const format = url.searchParams.get('format') || 'json';

    // Construir query
    let query = supabaseAdmin
      .from('rides_v2')
      .select(`
        *,
        passenger:users_profile!rides_v2_passenger_id_fkey (full_name, phone),
        driver:users_profile!rides_v2_driver_id_fkey (full_name, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: rides, count, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rides' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formato CSV
    if (format === 'csv') {
      const headers = 'id,status,passenger_name,driver_name,origin_address,dest_address,price_brl,created_at,completed_at\n';
      const rows = rides?.map(r => 
        `"${r.id}","${r.status}","${r.passenger?.full_name || ''}","${r.driver?.full_name || ''}","${r.origin_address}","${r.dest_address}","${(r.price_cents / 100).toFixed(2)}","${r.created_at}","${r.completed_at || ''}"`
      ).join('\n') || '';

      return new Response(
        headers + rows,
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="rides_export_${new Date().toISOString().split('T')[0]}.csv"`
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        rides,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: (offset + limit) < (count || 0),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin rides error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

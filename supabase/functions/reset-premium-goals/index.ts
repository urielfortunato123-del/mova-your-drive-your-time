import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthYear = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Reset Premium Goals - Current month: ${currentMonthYear}, Previous month: ${previousMonthYear}`);

    // 1. Get all active premium drivers
    const { data: premiumDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('id, name')
      .eq('premium_status', 'ativo');

    if (driversError) {
      throw new Error(`Error fetching premium drivers: ${driversError.message}`);
    }

    console.log(`Found ${premiumDrivers?.length || 0} active premium drivers`);

    for (const driver of premiumDrivers || []) {
      // 2. Get current month goals (before reset)
      const { data: currentGoals } = await supabase
        .from('premium_monthly_goals')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('month_year', previousMonthYear)
        .single();

      if (currentGoals) {
        // 3. Calculate if all goals were met
        const metasAtingidas = 
          (currentGoals.corridas_mes || 0) >= 160 &&
          (currentGoals.horas_logadas_mes || 0) >= 192 &&
          (currentGoals.litros_combustivel_mes || 0) >= 400 &&
          (currentGoals.gasto_manutencao_mes || 0) >= 120 &&
          currentGoals.seguro_ativo === true;

        const bonusBase = metasAtingidas ? 650 : 0;
        const bonusTelefonia = currentGoals.meta_telefonia ? 50 : 0;
        const bonusTotal = bonusBase + bonusTelefonia;

        // 4. Save to history
        const { error: historyError } = await supabase
          .from('premium_history')
          .upsert({
            driver_id: driver.id,
            month_year: previousMonthYear,
            metas_atingidas: metasAtingidas,
            bonus_recebido: bonusTotal,
            corridas_total: currentGoals.corridas_mes || 0,
            horas_total: currentGoals.horas_logadas_mes || 0,
            litros_total: currentGoals.litros_combustivel_mes || 0,
            manutencao_total: currentGoals.gasto_manutencao_mes || 0,
            beneficio_telefonia: currentGoals.meta_telefonia || false,
            bonus_telefonia: bonusTelefonia,
            status_final: metasAtingidas ? 'liberado' : 'nao_liberado',
          }, {
            onConflict: 'driver_id,month_year'
          });

        if (historyError) {
          console.error(`Error saving history for driver ${driver.id}: ${historyError.message}`);
        }
      }

      // 5. Create new month goals (reset)
      const { error: resetError } = await supabase
        .from('premium_monthly_goals')
        .upsert({
          driver_id: driver.id,
          month_year: currentMonthYear,
          corridas_mes: 0,
          horas_logadas_mes: 0,
          horas_app_mes: 0,
          litros_combustivel_mes: 0,
          gasto_manutencao_mes: 0,
          seguro_ativo: false,
          meta_telefonia: false,
          bonus_status: 'em_progresso',
          bonus_valor: 0,
        }, {
          onConflict: 'driver_id,month_year'
        });

      if (resetError) {
        console.error(`Error resetting goals for driver ${driver.id}: ${resetError.message}`);
      } else {
        console.log(`Successfully reset goals for driver ${driver.id} (${driver.name})`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset completed for ${premiumDrivers?.length || 0} premium drivers`,
        month: currentMonthYear
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in reset-premium-goals:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

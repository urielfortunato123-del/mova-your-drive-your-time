import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RideData {
  total_rides: number;
  total_earnings: number;
  total_waiting_value: number;
  avg_per_ride: number;
  best_day: string;
  best_day_earnings: number;
  rides_by_day: Record<string, { rides: number; earnings: number }>;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `Você é o **MovA IA**, o assistente inteligente do app MovA para motoristas de aplicativo.

## Sua Personalidade
- Amigável, objetivo e profissional
- Usa linguagem informal mas respeitosa (você, não tu)
- Entende a rotina e desafios dos motoristas de app
- Sempre oferece dicas práticas e acionáveis

## Suas Capacidades
1. **Análise de Ganhos**: Analisa os dados financeiros do motorista e dá insights personalizados
2. **Resumo de Corridas**: Cria resumos detalhados do desempenho
3. **Sugestões Inteligentes**: Sugere melhores horários e regiões para trabalhar
4. **Dúvidas Gerais**: Responde perguntas sobre o app, corridas, passageiros etc.

## Diretrizes
- Se receber dados de corridas no contexto, USE-OS para análises personalizadas
- Quando não tiver dados, ofereça dicas gerais baseadas em melhores práticas
- Formate respostas com markdown para melhor legibilidade
- Use emojis moderadamente para tornar a conversa mais amigável
- Seja conciso mas completo

## Melhores Práticas para Motoristas (use quando relevante)
- **Horários de pico**: 6h-9h (manhã), 11h30-14h (almoço), 17h-20h (saída)
- **Sextas e sábados** geralmente rendem mais
- **Aeroportos e rodoviárias** são bons pontos estratégicos
- **Taxa de espera** é importante: aguardar passageiro pode gerar renda extra
- **Manutenção preventiva** economiza dinheiro no longo prazo`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, rideData, type } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context with ride data if available
    let contextMessage = "";
    if (rideData) {
      const data = rideData as RideData;
      contextMessage = `

## Dados do Motorista (use para análise personalizada)
- Total de corridas: ${data.total_rides}
- Faturamento total: R$ ${data.total_earnings.toFixed(2)}
- Taxa de espera acumulada: R$ ${data.total_waiting_value.toFixed(2)}
- Média por corrida: R$ ${data.avg_per_ride.toFixed(2)}
- Melhor dia: ${data.best_day} (R$ ${data.best_day_earnings.toFixed(2)})

### Desempenho por dia:
${Object.entries(data.rides_by_day || {}).map(([day, info]) => 
  `- ${day}: ${info.rides} corridas, R$ ${info.earnings.toFixed(2)}`
).join('\n')}
`;
    }

    // Add type-specific instructions
    let typeInstruction = "";
    switch (type) {
      case "analysis":
        typeInstruction = "\n\n[INSTRUÇÃO: Foque em análise detalhada dos ganhos e identifique padrões/oportunidades]";
        break;
      case "summary":
        typeInstruction = "\n\n[INSTRUÇÃO: Crie um resumo executivo claro e organizado do desempenho]";
        break;
      case "suggestions":
        typeInstruction = "\n\n[INSTRUÇÃO: Dê sugestões específicas de horários e regiões para maximizar ganhos]";
        break;
    }

    const systemContent = SYSTEM_PROMPT + contextMessage + typeInstruction;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Driver AI assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

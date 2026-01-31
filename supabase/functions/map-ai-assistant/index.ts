import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface POI {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  brand?: string;
  open24h?: boolean;
  rating?: number;
  description?: string;
  tips?: string[];
  amenities?: string[];
  updatedAt?: string;
}

interface MapAIRequest {
  action: "search" | "validate" | "suggest" | "enrich";
  lat: number;
  lng: number;
  radius?: number;
  query?: string;
  pois?: POI[];
  driverProfile?: {
    preferredFuelType?: string;
    vehicleType?: string;
    workHours?: string;
    favoriteTypes?: string[];
  };
}

interface AIResponse {
  success: boolean;
  action: string;
  data?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const request: MapAIRequest = await req.json();
    const { action, lat, lng, radius = 5, query, pois, driverProfile } = request;

    console.log(`Map AI Assistant - Action: ${action}, Location: ${lat}, ${lng}`);

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "search":
        systemPrompt = `Você é um assistente especializado em encontrar pontos de interesse para motoristas de aplicativo no Brasil.
Retorne SEMPRE um JSON válido com a estrutura especificada. Não adicione texto antes ou depois do JSON.

Tipos de POIs aceitos:
- gas: Postos de combustível
- rest: Locais para descanso (cafés, restaurantes, áreas de descanso)
- bathroom: Banheiros públicos
- parking: Estacionamentos

Formato de resposta:
{
  "pois": [
    {
      "name": "Nome do local",
      "type": "gas|rest|bathroom|parking",
      "description": "Descrição breve",
      "amenities": ["wifi", "banheiro", "loja de conveniência"],
      "tips": ["Dica útil para motoristas"],
      "estimatedRating": 4.5,
      "category": "Categoria específica"
    }
  ],
  "summary": "Resumo da busca"
}`;

        userPrompt = `Busque pontos de interesse para motoristas próximos à localização (${lat}, ${lng}) no Brasil.
        
${query ? `Busca específica: ${query}` : "Busca geral de POIs úteis para motoristas"}
Raio de busca: ${radius}km

${driverProfile ? `Perfil do motorista:
- Combustível preferido: ${driverProfile.preferredFuelType || "Não especificado"}
- Tipo de veículo: ${driverProfile.vehicleType || "Não especificado"}
- Horário de trabalho: ${driverProfile.workHours || "Não especificado"}
- Tipos favoritos: ${driverProfile.favoriteTypes?.join(", ") || "Todos"}` : ""}

Liste os 5-10 melhores POIs para esta região, priorizando locais úteis para motoristas de app.`;
        break;

      case "validate":
        systemPrompt = `Você é um assistente especializado em validar informações de pontos de interesse no Brasil.
Analise os POIs fornecidos e verifique se as informações parecem corretas e atualizadas.

Retorne SEMPRE um JSON válido:
{
  "validatedPois": [
    {
      "id": "id_original",
      "isValid": true/false,
      "confidence": 0.0-1.0,
      "issues": ["problema encontrado"],
      "suggestions": ["sugestão de correção"],
      "updatedInfo": {
        "name": "nome corrigido se necessário",
        "address": "endereço atualizado"
      }
    }
  ],
  "summary": "Resumo da validação"
}`;

        userPrompt = `Valide os seguintes pontos de interesse próximos a (${lat}, ${lng}):

${JSON.stringify(pois, null, 2)}

Verifique:
1. Se os nomes parecem corretos
2. Se os endereços fazem sentido para a localização
3. Se os tipos estão corretos
4. Se há informações que parecem desatualizadas`;
        break;

      case "suggest":
        systemPrompt = `Você é um assistente inteligente de navegação para motoristas de aplicativo no Brasil.
Forneça sugestões personalizadas de paradas baseadas no perfil do motorista e localização atual.

Retorne SEMPRE um JSON válido:
{
  "suggestions": [
    {
      "type": "gas|rest|bathroom|parking",
      "priority": "high|medium|low",
      "reason": "Por que esta sugestão",
      "searchQuery": "Termo de busca sugerido",
      "timeframe": "agora|próxima_hora|quando_possível"
    }
  ],
  "tips": ["Dica contextual para o motorista"],
  "bestTimeToStop": "Horário sugerido para parada",
  "nearbyHighlights": ["Destaques da região"]
}`;

        userPrompt = `Sugira paradas inteligentes para um motorista de aplicativo na localização (${lat}, ${lng}).

${driverProfile ? `Perfil do motorista:
- Combustível preferido: ${driverProfile.preferredFuelType || "Gasolina"}
- Tipo de veículo: ${driverProfile.vehicleType || "Sedan"}
- Horário de trabalho: ${driverProfile.workHours || "Flexível"}
- Tipos favoritos: ${driverProfile.favoriteTypes?.join(", ") || "Todos"}` : ""}

POIs disponíveis na região:
${pois ? JSON.stringify(pois.slice(0, 10), null, 2) : "Nenhum POI fornecido"}

Considere:
1. Horário atual e previsão de trânsito
2. Necessidades típicas de motoristas de app
3. Economia de tempo e combustível
4. Conforto e segurança`;
        break;

      case "enrich":
        systemPrompt = `Você é um especialista em enriquecer informações de pontos de interesse para motoristas.
Adicione descrições úteis, dicas práticas, amenidades conhecidas e avaliações estimadas.

Retorne SEMPRE um JSON válido:
{
  "enrichedPois": [
    {
      "id": "id_original",
      "enhancedDescription": "Descrição detalhada e útil",
      "tips": ["Dica 1 para motoristas", "Dica 2"],
      "amenities": ["wifi", "banheiro", "estacionamento"],
      "estimatedRating": 4.2,
      "priceLevel": "1-4 ($ a $$$$)",
      "bestTimeToVisit": "Horário recomendado",
      "motoristHighlights": ["Por que é bom para motoristas"],
      "warnings": ["Avisos importantes"]
    }
  ],
  "regionInsights": "Insights sobre a região"
}`;

        userPrompt = `Enriqueça as informações dos seguintes POIs próximos a (${lat}, ${lng}):

${JSON.stringify(pois, null, 2)}

Adicione:
1. Descrições úteis para motoristas de aplicativo
2. Dicas práticas (estacionamento, tomadas, wifi, etc)
3. Amenidades típicas deste tipo de estabelecimento
4. Avaliação estimada (1-5)
5. Melhores horários para visitar
6. Destaques específicos para motoristas`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action. Use: search, validate, suggest, or enrich" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", status, errorText);
      throw new Error(`AI Gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response as JSON
    let parsedData: any = null;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.log("Raw content:", content);
      // Return raw content if JSON parsing fails
      parsedData = { rawContent: content };
    }

    const response: AIResponse = {
      success: true,
      action,
      data: parsedData,
    };

    console.log(`Map AI Assistant - ${action} completed successfully`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Map AI Assistant error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ApiKeyValidation {
  valid: boolean;
  keyId?: string;
  scope?: string;
  error?: string;
}

/**
 * Valida API Key no header X-API-KEY ou Authorization: ApiKey xxx
 */
export async function validateApiKey(req: Request): Promise<ApiKeyValidation> {
  // Tentar X-API-KEY primeiro
  let apiKey = req.headers.get('X-API-KEY');
  
  // Fallback para Authorization: ApiKey xxx
  if (!apiKey) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('ApiKey ')) {
      apiKey = authHeader.replace('ApiKey ', '');
    }
  }

  if (!apiKey) {
    return { valid: false, error: 'API Key not provided' };
  }

  // Validar formato
  if (!apiKey.startsWith('mova_live_') && !apiKey.startsWith('mova_test_')) {
    return { valid: false, error: 'Invalid API Key format' };
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Buscar key no banco
  const { data: keyData, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, scope, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !keyData) {
    return { valid: false, error: 'Invalid or inactive API Key' };
  }

  // Atualizar last_used_at
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return {
    valid: true,
    keyId: keyData.id,
    scope: keyData.scope,
  };
}

/**
 * Verifica se o scope da key permite a operação
 */
export function hasScope(keyScope: string, requiredScope: string): boolean {
  if (keyScope === 'all') return true;
  if (keyScope === requiredScope) return true;
  return false;
}

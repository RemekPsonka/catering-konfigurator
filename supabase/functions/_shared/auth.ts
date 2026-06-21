import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Sprawdza Bearer token i zwraca usera. Jeśli brak/invalid - zwraca Response 401.
 * Użycie:
 *   const authResult = await requireAuth(req);
 *   if (authResult instanceof Response) return authResult;
 *   const { user } = authResult;
 */
export async function requireAuth(req: Request): Promise<{ user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Brak autoryzacji - wymagane zalogowanie' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Nieprawidłowy token autoryzacji' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return { user };
}

export { corsHeaders };

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ATENÇÃO: este client usa a Service Role Key e só pode ser importado
// em código que roda no servidor (Route Handlers, Server Components).
// Nunca importar este arquivo em um componente marcado 'use client'.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

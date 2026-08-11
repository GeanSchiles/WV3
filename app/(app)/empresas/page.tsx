import { createClient } from '@/lib/supabase/server';
import EmpresasLista from './EmpresasLista';

export default async function EmpresasPage() {
  const supabase = createClient();

  const { data: empresas } = await supabase
    .from('empresas_transportadoras')
    .select('*')
    .order('nome');

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-base-100">Empresas Transportadoras</h1>
        <p className="text-sm text-base-300">
          Cadastro das empresas, apólice de seguro e regras automáticas de rastreamento.
        </p>
      </header>

      <EmpresasLista empresasIniciais={empresas ?? []} />
    </div>
  );
}

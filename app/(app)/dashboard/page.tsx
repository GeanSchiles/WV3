import { createClient } from '@/lib/supabase/server';
import PainelOperacional from './PainelOperacional';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: solicitacoes } = await supabase
    .from('solicitacoes')
    .select('*, empresa:empresas_transportadoras(nome)')
    .order('created_at', { ascending: false });

  const { data: empresas } = await supabase
    .from('empresas_transportadoras')
    .select('id, nome')
    .order('nome');

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-base-100">Painel Operacional</h1>
        <p className="text-sm text-base-300">
          Solicitações recebidas das transportadoras e cadastradas manualmente pela Organização.
        </p>
      </header>

      <PainelOperacional
        solicitacoesIniciais={solicitacoes ?? []}
        empresas={empresas ?? []}
      />
    </div>
  );
}

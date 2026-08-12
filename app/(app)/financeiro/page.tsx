import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FinanceiroLista from './FinanceiroLista';

export default async function FinanceiroPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: meuProfile } = await supabase.from('profiles').select('perfil').eq('id', user.id).single();

  if (meuProfile?.perfil !== 'administrador' && meuProfile?.perfil !== 'gestor') {
    redirect('/dashboard');
  }

  const empresasQuery = supabase.from('empresas_transportadoras').select('id, nome').order('nome');

  const { data: empresas } = await empresasQuery;

  const { data: faixas } = await supabase
    .from('financeiro_faixas')
    .select('*')
    .order('valor_de');

  // Resumo: quantidade de solicitações concluídas por empresa (para dar noção de volume)
  const { data: solicitacoesConcluidas } = await supabase
    .from('solicitacoes')
    .select('empresa_id')
    .eq('status', 'concluido');

  const contagemPorEmpresa: Record<string, number> = {};
  (solicitacoesConcluidas ?? []).forEach((s) => {
    contagemPorEmpresa[s.empresa_id] = (contagemPorEmpresa[s.empresa_id] ?? 0) + 1;
  });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-base-100">Financeiro</h1>
        <p className="text-sm text-base-300">
          Valores dos serviços por empresa transportadora. Visível apenas para Administrador e Gestor.
        </p>
      </header>

      <FinanceiroLista
        empresas={empresas ?? []}
        faixasIniciais={faixas ?? []}
        contagemPorEmpresa={contagemPorEmpresa}
        perfil={meuProfile.perfil}
      />
    </div>
  );
}

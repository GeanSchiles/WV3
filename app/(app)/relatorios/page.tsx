import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RelatoriosTabs from './RelatoriosTabs';

export default async function RelatoriosPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: meuProfile } = await supabase.from('profiles').select('perfil').eq('id', user.id).single();
  const perfil = meuProfile?.perfil ?? 'analista';

  if (perfil === 'operacional') {
    // usuário operacional da transportadora não tem tela própria ainda — evita acesso indevido
    redirect('/dashboard');
  }

  const podeVerFinanceiro = perfil === 'administrador' || perfil === 'gestor';

  const { data: solicitacoes } = await supabase
    .from('solicitacoes')
    .select('*, empresa:empresas_transportadoras(nome), analista:profiles!solicitacoes_analista_id_fkey(nome)')
    .order('created_at', { ascending: false });

  const { data: empresas } = await supabase
    .from('empresas_transportadoras')
    .select('id, nome')
    .order('nome');

  const { data: analistas } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('perfil', 'analista')
    .order('nome');

  let servicosFinanceiro: any[] = [];
  if (podeVerFinanceiro) {
    const { data } = await supabase.from('tabela_servicos').select('*');
    servicosFinanceiro = data ?? [];
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-base-100">Relatórios</h1>
        <p className="text-sm text-base-300">
          Consulta de todos os serviços realizados{podeVerFinanceiro ? ' e valores por empresa' : ''}.
        </p>
      </header>

      <RelatoriosTabs
        solicitacoes={solicitacoes ?? []}
        empresas={empresas ?? []}
        analistas={analistas ?? []}
        servicosFinanceiro={servicosFinanceiro}
        podeVerFinanceiro={podeVerFinanceiro}
      />
    </div>
  );
}

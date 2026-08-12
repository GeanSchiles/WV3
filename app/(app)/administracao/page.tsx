import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdministracaoLista from './AdministracaoLista';

export default async function AdministracaoPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: meuProfile } = await supabase.from('profiles').select('perfil').eq('id', user.id).single();

  if (meuProfile?.perfil !== 'administrador') {
    redirect('/dashboard');
  }

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')
    .in('perfil', ['administrador', 'analista', 'gestor', 'operacional'])
    .order('nome');

  const { data: empresas } = await supabase
    .from('empresas_transportadoras')
    .select('id, nome')
    .order('nome');

  const { data: vinculos } = await supabase.from('analista_empresas').select('analista_id, empresa_id');

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-base-100">Administração e Usuários</h1>
        <p className="text-sm text-base-300">
          Cadastro de usuários da Organização (Administrador/Analista) e das Empresas Transportadoras
          (Gestor/Operacional).
        </p>
      </header>

      <AdministracaoLista
        usuariosIniciais={usuarios ?? []}
        empresas={empresas ?? []}
        vinculosIniciais={vinculos ?? []}
      />
    </div>
  );
}

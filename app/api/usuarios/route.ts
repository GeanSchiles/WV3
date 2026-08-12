import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getPerfilDoChamador() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { perfil: null, userId: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single();

  return { perfil: profile?.perfil ?? null, userId: user.id };
}

export async function POST(request: Request) {
  const { perfil: perfilChamador } = await getPerfilDoChamador();

  if (perfilChamador !== 'administrador') {
    return NextResponse.json({ error: 'Apenas administradores podem cadastrar usuários.' }, { status: 403 });
  }

  const body = await request.json();
  const { nome, cpf, telefone, email, endereco, funcao, perfil, senha, empresaIds, empresaTransportadoraId } = body;

  if (!nome || !email || !senha || !perfil) {
    return NextResponse.json({ error: 'Preencha nome, e-mail, senha e perfil.' }, { status: 400 });
  }

  if (empresaIds && empresaIds.length > 50) {
    return NextResponse.json({ error: 'Um analista pode ter no máximo 50 empresas vinculadas.' }, { status: 400 });
  }

  if ((perfil === 'gestor' || perfil === 'operacional') && !empresaTransportadoraId) {
    return NextResponse.json({ error: 'Selecione a empresa transportadora deste usuário.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (erroAuth || !authUser.user) {
    return NextResponse.json({ error: erroAuth?.message ?? 'Erro ao criar usuário.' }, { status: 400 });
  }

  const { error: erroProfile } = await admin.from('profiles').insert({
    id: authUser.user.id,
    nome,
    cpf: cpf || null,
    telefone: telefone || null,
    email,
    endereco: endereco || null,
    funcao: funcao || null,
    perfil,
    empresa_transportadora_id:
      perfil === 'gestor' || perfil === 'operacional' ? empresaTransportadoraId : null,
  });

  if (erroProfile) {
    // reverte a criação do usuário de autenticação se o profile falhar
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: erroProfile.message }, { status: 400 });
  }

  if (perfil === 'analista' && Array.isArray(empresaIds) && empresaIds.length > 0) {
    const vinculos = empresaIds.map((empresaId: string) => ({
      analista_id: authUser.user.id,
      empresa_id: empresaId,
    }));
    const { error: erroVinculos } = await admin.from('analista_empresas').insert(vinculos);
    if (erroVinculos) {
      return NextResponse.json(
        { error: 'Usuário criado, mas houve erro ao vincular empresas: ' + erroVinculos.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ id: authUser.user.id });
}

export async function PATCH(request: Request) {
  const { perfil: perfilChamador } = await getPerfilDoChamador();

  if (perfilChamador !== 'administrador') {
    return NextResponse.json({ error: 'Apenas administradores podem editar usuários.' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, nome, cpf, telefone, endereco, funcao, empresaIds, empresaTransportadoraId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  if (empresaIds && empresaIds.length > 50) {
    return NextResponse.json({ error: 'Um analista pode ter no máximo 50 empresas vinculadas.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const dadosAtualizacao: Record<string, unknown> = {
    nome,
    cpf: cpf || null,
    telefone: telefone || null,
    endereco: endereco || null,
    funcao: funcao || null,
  };

  if (empresaTransportadoraId !== undefined) {
    dadosAtualizacao.empresa_transportadora_id = empresaTransportadoraId || null;
  }

  const { error: erroProfile } = await admin.from('profiles').update(dadosAtualizacao).eq('id', userId);

  if (erroProfile) {
    return NextResponse.json({ error: erroProfile.message }, { status: 400 });
  }

  if (Array.isArray(empresaIds)) {
    const { error: erroDelete } = await admin.from('analista_empresas').delete().eq('analista_id', userId);
    if (erroDelete) {
      return NextResponse.json({ error: erroDelete.message }, { status: 400 });
    }

    if (empresaIds.length > 0) {
      const vinculos = empresaIds.map((empresaId: string) => ({
        analista_id: userId,
        empresa_id: empresaId,
      }));
      const { error: erroInsert } = await admin.from('analista_empresas').insert(vinculos);
      if (erroInsert) {
        return NextResponse.json({ error: erroInsert.message }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

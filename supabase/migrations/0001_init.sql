-- =====================================================================
-- WV3 PLATAFORMA — Migração inicial (MVP)
-- Módulos cobertos: Login/Perfis, Cadastro de Empresas Transportadoras
-- + Apólice, Painel Operacional (Solicitações)
-- =====================================================================

-- ---------- ENUMS ----------
create type perfil_usuario as enum ('administrador', 'analista', 'gestor', 'operacional');
create type tipo_servico as enum ('viagem', 'consulta', 'escolta', 'isca');
create type status_servico as enum ('aguardando', 'concluido', 'cancelada');
create type tipo_motorista as enum ('frota', 'terceiros', 'agregado', 'motorista_px');
create type origem_solicitacao as enum ('transportadora', 'organizacao');
create type tipo_rastreamento as enum ('rastreada', 'nao_rastreada');

-- ---------- EMPRESAS TRANSPORTADORAS ----------
create table empresas_transportadoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  endereco text,
  responsavel text,
  telefone_responsavel text,
  gerenciadora_risco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- APÓLICES ----------
-- Guarda as regras que definem, automaticamente, se uma carga é rastreada.
create table apolices (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_transportadoras(id) on delete cascade,
  arquivo_url text, -- anexo da apólice (Supabase Storage)
  tipos_contratacao tipo_motorista[] not null default '{}',
  tipo_mercadoria_geral boolean not null default false,
  tipo_mercadoria_especifica boolean not null default false,
  cobertura jsonb not null default '[]', -- [{tipo, valor}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Faixas de valor da carga -> tipo de rastreamento (regra automática)
create table apolice_faixas (
  id uuid primary key default gen_random_uuid(),
  apolice_id uuid not null references apolices(id) on delete cascade,
  valor_de numeric(14,2) not null,
  valor_ate numeric(14,2),
  tipo_rastreamento tipo_rastreamento not null,
  created_at timestamptz not null default now()
);

-- ---------- PERFIS DE USUÁRIO (estende auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  cpf text,
  telefone text,
  email text not null,
  endereco text,
  funcao text,
  perfil perfil_usuario not null,
  empresa_transportadora_id uuid references empresas_transportadoras(id), -- usado para gestor/operacional
  created_at timestamptz not null default now()
);

-- Vínculo Analista <-> Empresas (até 50 por analista, controlado por trigger)
create table analista_empresas (
  analista_id uuid not null references profiles(id) on delete cascade,
  empresa_id uuid not null references empresas_transportadoras(id) on delete cascade,
  primary key (analista_id, empresa_id)
);

create or replace function checar_limite_empresas_analista()
returns trigger as $$
begin
  if (select count(*) from analista_empresas where analista_id = new.analista_id) >= 50 then
    raise exception 'Este analista já possui 50 empresas vinculadas (limite máximo).';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_limite_empresas_analista
before insert on analista_empresas
for each row execute function checar_limite_empresas_analista();

-- ---------- SOLICITAÇÕES (Painel Operacional) ----------
create table solicitacoes (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_servico not null,
  empresa_id uuid not null references empresas_transportadoras(id),
  cliente_final text,
  data_coleta timestamptz,
  data_entrega timestamptz,
  local_coleta text,
  local_entrega text,
  produto text,
  valor_carga numeric(14,2),
  tipo_motorista tipo_motorista,
  status status_servico not null default 'aguardando',
  carga_rastreada tipo_rastreamento, -- calculado automaticamente a partir da apólice
  origem origem_solicitacao not null default 'transportadora',
  analista_id uuid references profiles(id),
  criado_por uuid references profiles(id),
  -- campos de resposta (variam por tipo de serviço)
  viagem_liberada boolean,
  numero_sm text,
  consulta_aprovada boolean,
  consulta_motivo text,
  escolta_empresa text,
  isca_numero text,
  respondido_em timestamptz,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_solicitacoes_empresa on solicitacoes(empresa_id);
create index idx_solicitacoes_status on solicitacoes(status);
create index idx_solicitacoes_tipo on solicitacoes(tipo);

-- ---------- ANEXOS (CNH, ANTT, etc.) ----------
create table anexos (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references solicitacoes(id) on delete cascade,
  tipo_documento text not null, -- CNH, Documento do Cavalo, Documento da Carreta, ANTT, Comprovante de Residência
  arquivo_url text not null,
  created_at timestamptz not null default now()
);

-- ---------- FUNÇÃO: calcular rastreamento automaticamente ----------
create or replace function calcular_carga_rastreada(p_empresa_id uuid, p_valor numeric)
returns tipo_rastreamento as $$
declare
  v_resultado tipo_rastreamento;
begin
  select af.tipo_rastreamento into v_resultado
  from apolice_faixas af
  join apolices ap on ap.id = af.apolice_id
  where ap.empresa_id = p_empresa_id
    and p_valor >= af.valor_de
    and (af.valor_ate is null or p_valor <= af.valor_ate)
  order by af.valor_de desc
  limit 1;

  return coalesce(v_resultado, 'nao_rastreada');
end;
$$ language plpgsql;

create or replace function trg_set_carga_rastreada()
returns trigger as $$
begin
  if new.valor_carga is not null then
    new.carga_rastreada := calcular_carga_rastreada(new.empresa_id, new.valor_carga);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_carga_rastreada
before insert or update of valor_carga, empresa_id on solicitacoes
for each row execute function trg_set_carga_rastreada();

-- ---------- ROW LEVEL SECURITY ----------
alter table empresas_transportadoras enable row level security;
alter table apolices enable row level security;
alter table apolice_faixas enable row level security;
alter table profiles enable row level security;
alter table analista_empresas enable row level security;
alter table solicitacoes enable row level security;
alter table anexos enable row level security;

-- helper: perfil do usuário logado
create or replace function meu_perfil()
returns perfil_usuario as $$
  select perfil from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function minha_empresa()
returns uuid as $$
  select empresa_transportadora_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- profiles: cada um vê o próprio; administrador vê todos
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or meu_perfil() = 'administrador');
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all
  using (meu_perfil() = 'administrador');

-- empresas: administrador e analistas vinculados; gestor/operacional só a própria
create policy "empresas_select" on empresas_transportadoras for select
  using (
    meu_perfil() = 'administrador'
    or id in (select empresa_id from analista_empresas where analista_id = auth.uid())
    or id = minha_empresa()
  );
create policy "empresas_admin_write" on empresas_transportadoras for insert
  with check (meu_perfil() = 'administrador');
create policy "empresas_admin_update" on empresas_transportadoras for update
  using (meu_perfil() = 'administrador');

-- apólices / faixas: mesma visibilidade da empresa relacionada
create policy "apolices_select" on apolices for select
  using (
    meu_perfil() = 'administrador'
    or empresa_id in (select empresa_id from analista_empresas where analista_id = auth.uid())
    or empresa_id = minha_empresa()
  );
create policy "apolices_admin_write" on apolices for insert with check (meu_perfil() = 'administrador');
create policy "apolices_admin_update" on apolices for update using (meu_perfil() = 'administrador');

create policy "faixas_select" on apolice_faixas for select
  using (true);
create policy "faixas_admin_write" on apolice_faixas for insert with check (meu_perfil() = 'administrador');

-- analista_empresas: admin gerencia; analista vê os próprios vínculos
create policy "analista_empresas_select" on analista_empresas for select
  using (analista_id = auth.uid() or meu_perfil() = 'administrador');
create policy "analista_empresas_admin_write" on analista_empresas for all
  using (meu_perfil() = 'administrador');

-- solicitações: regra central do painel operacional
create policy "solicitacoes_select" on solicitacoes for select
  using (
    meu_perfil() = 'administrador'
    or (meu_perfil() = 'analista' and empresa_id in (select empresa_id from analista_empresas where analista_id = auth.uid()))
    or (meu_perfil() in ('gestor', 'operacional') and empresa_id = minha_empresa())
  );

create policy "solicitacoes_insert" on solicitacoes for insert
  with check (
    meu_perfil() = 'administrador'
    or (meu_perfil() = 'analista' and empresa_id in (select empresa_id from analista_empresas where analista_id = auth.uid()))
    or (meu_perfil() in ('gestor', 'operacional') and empresa_id = minha_empresa())
  );

create policy "solicitacoes_update" on solicitacoes for update
  using (
    meu_perfil() = 'administrador'
    or (meu_perfil() = 'analista' and empresa_id in (select empresa_id from analista_empresas where analista_id = auth.uid()))
  );

-- anexos: seguem a visibilidade da solicitação
create policy "anexos_select" on anexos for select
  using (
    solicitacao_id in (select id from solicitacoes)
  );
create policy "anexos_insert" on anexos for insert
  with check (
    solicitacao_id in (select id from solicitacoes)
  );

-- ---------- Observação ----------
-- O cadastro do "profile" de cada usuário (após criar o login em Authentication > Users)
-- é feito manualmente pelo Administrador via SQL Editor ou tela de Administração futura.
-- Ver README.md para o passo a passo do primeiro usuário Administrador.

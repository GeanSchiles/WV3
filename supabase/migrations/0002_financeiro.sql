-- =====================================================================
-- WV3 PLATAFORMA — Migração 0002: Módulo Financeiro
-- Cadastro de valores dos serviços por empresa transportadora.
-- Visível apenas para Administrador e Gestor da Empresa Transportadora.
-- =====================================================================

create type tipo_valor_servico as enum ('viagem', 'extra');

create table financeiro_faixas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_transportadoras(id) on delete cascade,
  tipo_servico tipo_valor_servico not null,
  valor_de numeric(14,2) not null default 0,
  valor_ate numeric(14,2), -- null = "a partir de" (sem limite superior)
  valor_cobrado numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financeiro_faixas_empresa on financeiro_faixas(empresa_id);

alter table financeiro_faixas enable row level security;

-- Reaproveita as funções meu_perfil() e minha_empresa() criadas na migração 0001
create policy "financeiro_select" on financeiro_faixas for select
  using (
    meu_perfil() = 'administrador'
    or (meu_perfil() = 'gestor' and empresa_id = minha_empresa())
  );

create policy "financeiro_admin_write" on financeiro_faixas for insert
  with check (meu_perfil() = 'administrador');

create policy "financeiro_admin_update" on financeiro_faixas for update
  using (meu_perfil() = 'administrador');

create policy "financeiro_admin_delete" on financeiro_faixas for delete
  using (meu_perfil() = 'administrador');

-- =====================================================================
-- WV3 PLATAFORMA — Migração 0004: Tabela de Serviços por transportadora
-- Cadastro do valor acordado para cada tipo de serviço (Viagem, Isca,
-- Consulta, Escolta e serviços customizados) por empresa transportadora.
-- =====================================================================

create table tabela_servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_transportadoras(id) on delete cascade,
  nome text not null,
  valor numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index idx_tabela_servicos_empresa on tabela_servicos(empresa_id);

alter table tabela_servicos enable row level security;

-- Reaproveita as funções meu_perfil() e minha_empresa() criadas na migração 0001
-- Mesma visibilidade da empresa relacionada (igual apolices_select / financeiro_select)
create policy "tabela_servicos_select" on tabela_servicos for select
  using (
    meu_perfil() = 'administrador'
    or empresa_id in (select empresa_id from analista_empresas where analista_id = auth.uid())
    or empresa_id = minha_empresa()
  );

create policy "tabela_servicos_admin_write" on tabela_servicos for insert
  with check (meu_perfil() = 'administrador');

create policy "tabela_servicos_admin_update" on tabela_servicos for update
  using (meu_perfil() = 'administrador');

create policy "tabela_servicos_admin_delete" on tabela_servicos for delete
  using (meu_perfil() = 'administrador');

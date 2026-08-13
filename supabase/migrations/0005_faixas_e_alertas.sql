-- =====================================================================
-- WV3 PLATAFORMA — Migração 0005
-- 1) Tabela de Serviços passa a ser por FAIXA DE QUANTIDADE (volume) em
--    vez de valor único — ex: Viagem de 0 a 100 = R$100/viagem, de 101
--    a 150 = R$115/viagem, etc. Vale para Viagem, Isca, Consulta,
--    Escolta e serviços customizados.
-- 2) Alerta de visualização no Painel Operacional (3 minutos).
-- 3) Bucket de storage para anexo da apólice de seguro.
-- =====================================================================

-- ---------- 1) Tabela de Serviços → faixas de quantidade ----------
alter table tabela_servicos drop constraint if exists tabela_servicos_empresa_id_nome_key;
alter table tabela_servicos rename column nome to tipo_servico;
alter table tabela_servicos rename column valor to valor_unitario;
alter table tabela_servicos add column if not exists faixa_de integer not null default 0;
alter table tabela_servicos add column if not exists faixa_ate integer;
alter table tabela_servicos alter column faixa_de drop default;

create index if not exists idx_tabela_servicos_empresa_tipo on tabela_servicos(empresa_id, tipo_servico);

-- ---------- 2) Alerta de visualização (Painel Operacional) ----------
alter table solicitacoes add column if not exists visualizado_em timestamptz;

-- ---------- 3) Anexo da apólice de seguro (bucket privado) ----------
insert into storage.buckets (id, name, public)
values ('apolices-empresas', 'apolices-empresas', false)
on conflict (id) do nothing;

-- Visibilidade do arquivo segue a mesma regra de visibilidade da empresa
-- (o primeiro nível da pasta no storage é o empresa_id)
create policy "apolices_empresas_select" on storage.objects for select
  using (
    bucket_id = 'apolices-empresas'
    and (
      meu_perfil() = 'administrador'
      or ((storage.foldername(name))[1])::uuid in (select empresa_id from analista_empresas where analista_id = auth.uid())
      or ((storage.foldername(name))[1])::uuid = minha_empresa()
    )
  );

create policy "apolices_empresas_admin_insert" on storage.objects for insert
  with check (bucket_id = 'apolices-empresas' and meu_perfil() = 'administrador');

create policy "apolices_empresas_admin_update" on storage.objects for update
  using (bucket_id = 'apolices-empresas' and meu_perfil() = 'administrador');

create policy "apolices_empresas_admin_delete" on storage.objects for delete
  using (bucket_id = 'apolices-empresas' and meu_perfil() = 'administrador');

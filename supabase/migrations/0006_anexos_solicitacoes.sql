-- =====================================================================
-- WV3 PLATAFORMA — Migração 0006
-- Upload real dos documentos obrigatórios (CNH, Documento do Cavalo,
-- Documento da Carreta, ANTT, Comprovante de Residência) nas
-- solicitações de Viagem (Terceiros/Agregado/Motorista PX) e Consulta.
-- =====================================================================

alter table solicitacoes add column if not exists anexos jsonb not null default '[]';

insert into storage.buckets (id, name, public)
values ('anexos-solicitacoes', 'anexos-solicitacoes', false)
on conflict (id) do nothing;

-- Caminho no storage: {empresa_id}/{solicitacao_id}/{arquivo}
-- Visibilidade e permissão de envio seguem a mesma regra de quem pode
-- ver/criar solicitações daquela empresa.
create policy "anexos_solicitacoes_select" on storage.objects for select
  using (
    bucket_id = 'anexos-solicitacoes'
    and (
      meu_perfil() = 'administrador'
      or ((storage.foldername(name))[1])::uuid in (select empresa_id from analista_empresas where analista_id = auth.uid())
      or ((storage.foldername(name))[1])::uuid = minha_empresa()
    )
  );

create policy "anexos_solicitacoes_insert" on storage.objects for insert
  with check (
    bucket_id = 'anexos-solicitacoes'
    and (
      meu_perfil() = 'administrador'
      or meu_perfil() = 'analista'
      or ((storage.foldername(name))[1])::uuid = minha_empresa()
    )
  );

create policy "anexos_solicitacoes_admin_delete" on storage.objects for delete
  using (bucket_id = 'anexos-solicitacoes' and meu_perfil() = 'administrador');

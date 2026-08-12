-- =====================================================================
-- WV3 PLATAFORMA — Migração 0003: Logos
-- Adiciona campo de logo para empresas transportadoras e cria o bucket
-- de armazenamento (Supabase Storage) para as imagens.
-- =====================================================================

alter table empresas_transportadoras add column if not exists logo_url text;

-- Cria o bucket público "logos-empresas" (se ainda não existir)
insert into storage.buckets (id, name, public)
values ('logos-empresas', 'logos-empresas', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode visualizar as logos (bucket público)
create policy "logos_empresas_select_publico" on storage.objects for select
  using (bucket_id = 'logos-empresas');

-- Só Administrador pode enviar/atualizar/remover logos
create policy "logos_empresas_admin_insert" on storage.objects for insert
  with check (bucket_id = 'logos-empresas' and meu_perfil() = 'administrador');

create policy "logos_empresas_admin_update" on storage.objects for update
  using (bucket_id = 'logos-empresas' and meu_perfil() = 'administrador');

create policy "logos_empresas_admin_delete" on storage.objects for delete
  using (bucket_id = 'logos-empresas' and meu_perfil() = 'administrador');

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EmpresaTransportadora, TipoMotorista, SERVICOS_PADRAO } from '@/lib/types';
import TabelaServicosModal, { LinhaServico } from './TabelaServicosModal';

interface Faixa {
  valor_de: string;
  valor_ate: string;
  tipo_rastreamento: 'rastreada' | 'nao_rastreada';
}

interface Props {
  empresa: EmpresaTransportadora | null;
  onClose: () => void;
  onSalvo: () => void;
}

const TIPOS_CONTRATACAO: { value: TipoMotorista; label: string }[] = [
  { value: 'frota', label: 'Frota' },
  { value: 'terceiros', label: 'Terceiros' },
  { value: 'agregado', label: 'Agregado' },
  { value: 'motorista_px', label: 'Motorista PX' },
];

export default function EmpresaModal({ empresa, onClose, onSalvo }: Props) {
  const supabase = createClient();
  const [nome, setNome] = useState(empresa?.nome ?? '');
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? '');
  const [endereco, setEndereco] = useState(empresa?.endereco ?? '');
  const [responsavel, setResponsavel] = useState(empresa?.responsavel ?? '');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState(empresa?.telefone_responsavel ?? '');
  const [gerenciadoraRisco, setGerenciadoraRisco] = useState(empresa?.gerenciadora_risco ?? '');
  const [logoUrl, setLogoUrl] = useState(empresa?.logo_url ?? '');
  const [arquivoLogo, setArquivoLogo] = useState<File | null>(null);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  const [tiposContratacao, setTiposContratacao] = useState<TipoMotorista[]>([]);
  const [mercadoriaGeral, setMercadoriaGeral] = useState(false);
  const [mercadoriaEspecifica, setMercadoriaEspecifica] = useState(false);
  const [faixas, setFaixas] = useState<Faixa[]>([
    { valor_de: '0', valor_ate: '', tipo_rastreamento: 'nao_rastreada' },
  ]);

  const [servicos, setServicos] = useState<LinhaServico[]>(
    SERVICOS_PADRAO.map((nome) => ({ nome, valor: '', padrao: true }))
  );
  const [modalServicosAberto, setModalServicosAberto] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    (async () => {
      const { data } = await supabase
        .from('tabela_servicos')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at');

      if (data && data.length > 0) {
        const doBanco: LinhaServico[] = data.map((s) => ({
          id: s.id,
          nome: s.nome,
          valor: String(s.valor),
          padrao: SERVICOS_PADRAO.includes(s.nome),
        }));
        // garante que os serviços padrão apareçam mesmo que ainda não tenham sido cadastrados
        SERVICOS_PADRAO.forEach((nome) => {
          if (!doBanco.some((s) => s.nome === nome)) {
            doBanco.unshift({ nome, valor: '', padrao: true });
          }
        });
        setServicos(doBanco);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id]);

  function atualizarFaixa(i: number, campo: keyof Faixa, valor: string) {
    setFaixas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  }

  function toggleTipoContratacao(v: TipoMotorista) {
    setTiposContratacao((prev) => (prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome || !cnpj) {
      setErro('Nome e CNPJ são obrigatórios.');
      return;
    }

    setSalvando(true);

    let empresaId = empresa?.id;

    if (empresaId) {
      const { error } = await supabase
        .from('empresas_transportadoras')
        .update({
          nome,
          cnpj,
          endereco,
          responsavel,
          telefone_responsavel: telefoneResponsavel,
          gerenciadora_risco: gerenciadoraRisco,
        })
        .eq('id', empresaId);
      if (error) {
        setSalvando(false);
        setErro('Erro ao salvar empresa: ' + error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('empresas_transportadoras')
        .insert({
          nome,
          cnpj,
          endereco,
          responsavel,
          telefone_responsavel: telefoneResponsavel,
          gerenciadora_risco: gerenciadoraRisco,
        })
        .select('id')
        .single();
      if (error || !data) {
        setSalvando(false);
        setErro('Erro ao salvar empresa: ' + (error?.message ?? ''));
        return;
      }
      empresaId = data.id;
    }

    // Upload da logo, se um arquivo novo foi selecionado
    if (arquivoLogo && empresaId) {
      setEnviandoLogo(true);
      const extensao = arquivoLogo.name.split('.').pop();
      const caminho = `${empresaId}/logo-${Date.now()}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from('logos-empresas')
        .upload(caminho, arquivoLogo, { upsert: true });

      if (erroUpload) {
        setEnviandoLogo(false);
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao enviar a logo: ' + erroUpload.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('logos-empresas').getPublicUrl(caminho);

      const { error: erroLogoUrl } = await supabase
        .from('empresas_transportadoras')
        .update({ logo_url: publicUrlData.publicUrl })
        .eq('id', empresaId);

      setEnviandoLogo(false);

      if (erroLogoUrl) {
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao vincular a logo: ' + erroLogoUrl.message);
        return;
      }
    }

    // Tabela de serviços — substitui os valores cadastrados pelo conjunto atual
    const servicosValidos = servicos.filter((s) => s.nome.trim() !== '' && s.valor !== '');
    if (servicosValidos.length > 0 && empresaId) {
      const { error: erroDeleteServicos } = await supabase
        .from('tabela_servicos')
        .delete()
        .eq('empresa_id', empresaId);
      if (erroDeleteServicos) {
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao salvar a tabela de serviços: ' + erroDeleteServicos.message);
        return;
      }

      const { error: erroServicos } = await supabase.from('tabela_servicos').insert(
        servicosValidos.map((s) => ({
          empresa_id: empresaId,
          nome: s.nome.trim(),
          valor: Number(s.valor),
        }))
      );
      if (erroServicos) {
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao salvar a tabela de serviços: ' + erroServicos.message);
        return;
      }
    }

    const faixasValidas = faixas.filter((f) => f.valor_de !== '');
    if (faixasValidas.length > 0) {
      const { data: apolice, error: erroApolice } = await supabase
        .from('apolices')
        .insert({
          empresa_id: empresaId,
          tipos_contratacao: tiposContratacao,
          tipo_mercadoria_geral: mercadoriaGeral,
          tipo_mercadoria_especifica: mercadoriaEspecifica,
        })
        .select('id')
        .single();

      if (erroApolice) {
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao salvar a apólice: ' + erroApolice.message);
        return;
      }

      const faixasParaInserir = faixasValidas.map((f) => ({
        apolice_id: apolice.id,
        valor_de: Number(f.valor_de),
        valor_ate: f.valor_ate ? Number(f.valor_ate) : null,
        tipo_rastreamento: f.tipo_rastreamento,
      }));

      const { error: erroFaixas } = await supabase.from('apolice_faixas').insert(faixasParaInserir);
      if (erroFaixas) {
        setSalvando(false);
        setErro('Empresa salva, mas houve erro ao salvar as faixas: ' + erroFaixas.message);
        return;
      }
    }

    setSalvando(false);
    onSalvo();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">
            {empresa ? 'Editar empresa' : 'Nova empresa transportadora'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalServicosAberto(true)}
              title="Tabela de Serviços"
              className="flex items-center gap-1.5 rounded-sm border border-base-600 px-2.5 py-1.5 text-xs text-base-300 hover:border-accent/50 hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18M9 9v11" />
              </svg>
              Tabela de Serviços
              {servicos.some((s) => s.valor !== '') && (
                <span className="ml-0.5 rounded-full bg-accent/15 px-1.5 text-[10px] text-accent">
                  {servicos.filter((s) => s.valor !== '').length}
                </span>
              )}
            </button>
            <button onClick={onClose} className="text-base-400 hover:text-base-100">
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-base-400">Dados da empresa</h3>

            <div>
              <label className="label">Logo da empresa</label>
              <div className="flex items-center gap-3">
                {(arquivoLogo || logoUrl) && (
                  <img
                    src={arquivoLogo ? URL.createObjectURL(arquivoLogo) : logoUrl}
                    alt="Logo"
                    className="h-14 w-14 rounded-md object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setArquivoLogo(e.target.files?.[0] ?? null)}
                />
              </div>
              {enviandoLogo && <p className="mt-1 text-[11px] text-base-400">Enviando logo…</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome da empresa</label>
                <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input className="input" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Endereço</label>
              <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Responsável</label>
                <input className="input" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone do responsável</label>
                <input
                  className="input"
                  value={telefoneResponsavel}
                  onChange={(e) => setTelefoneResponsavel(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Gerenciadora de risco</label>
              <input
                className="input"
                value={gerenciadoraRisco}
                onChange={(e) => setGerenciadoraRisco(e.target.value)}
              />
            </div>
          </section>

          {!empresa && (
            <section className="space-y-3 border-t border-base-700 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-base-400">
                Apólice — regras de rastreamento
              </h3>

              <div>
                <p className="label">Tipos de contratação</p>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_CONTRATACAO.map((t) => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => toggleTipoContratacao(t.value)}
                      className={`rounded-sm border px-2.5 py-1 text-xs ${
                        tiposContratacao.includes(t.value)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-base-600 text-base-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-base-200">
                  <input type="checkbox" checked={mercadoriaGeral} onChange={(e) => setMercadoriaGeral(e.target.checked)} />
                  Mercadorias gerais
                </label>
                <label className="flex items-center gap-2 text-sm text-base-200">
                  <input
                    type="checkbox"
                    checked={mercadoriaEspecifica}
                    onChange={(e) => setMercadoriaEspecifica(e.target.checked)}
                  />
                  Mercadorias específicas
                </label>
              </div>

              <div>
                <p className="label">Faixas de valor da carga → tipo de rastreamento</p>
                <p className="mb-2 text-[11px] text-base-400">
                  Essas faixas definem automaticamente se a carga é rastreada — o analista nunca informa isso manualmente.
                </p>
                <div className="space-y-2">
                  {faixas.map((f, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                      <div>
                        <label className="label">De (R$)</label>
                        <input
                          type="number"
                          className="input"
                          value={f.valor_de}
                          onChange={(e) => atualizarFaixa(i, 'valor_de', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Até (R$)</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="sem limite"
                          value={f.valor_ate}
                          onChange={(e) => atualizarFaixa(i, 'valor_ate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Tipo</label>
                        <select
                          className="input"
                          value={f.tipo_rastreamento}
                          onChange={(e) => atualizarFaixa(i, 'tipo_rastreamento', e.target.value)}
                        >
                          <option value="nao_rastreada">Não rastreada</option>
                          <option value="rastreada">Rastreada</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFaixas((prev) => prev.filter((_, idx) => idx !== i))}
                        className="btn-ghost h-9 px-2 text-danger"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-2 text-xs"
                  onClick={() =>
                    setFaixas((prev) => [...prev, { valor_de: '', valor_ate: '', tipo_rastreamento: 'rastreada' }])
                  }
                >
                  + adicionar faixa
                </button>
              </div>
            </section>
          )}

          {erro && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

          <div className="flex justify-end gap-2 border-t border-base-700 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando…' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>

      {modalServicosAberto && (
        <TabelaServicosModal
          nomeEmpresa={nome || 'Nova empresa'}
          servicos={servicos}
          onFechar={() => setModalServicosAberto(false)}
          onSalvar={(novosServicos) => {
            setServicos(novosServicos);
            setModalServicosAberto(false);
          }}
        />
      )}
    </div>
  );
}

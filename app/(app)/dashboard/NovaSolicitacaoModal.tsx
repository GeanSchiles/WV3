'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TipoServico,
  TipoMotorista,
  PerfilUsuario,
  anexosObrigatoriosViagem,
  ANEXOS_CONSULTA,
} from '@/lib/types';

interface Props {
  empresas: { id: string; nome: string }[];
  perfil: PerfilUsuario;
  onClose: () => void;
  onCriado: () => void;
}

const TIPOS: { value: TipoServico; label: string }[] = [
  { value: 'viagem', label: 'Nova Viagem (Rastreio)' },
  { value: 'consulta', label: 'Nova Consulta' },
  { value: 'escolta', label: 'Escolta' },
  { value: 'isca', label: 'Isca' },
];

export default function NovaSolicitacaoModal({ empresas, perfil, onClose, onCriado }: Props) {
  const ehTransportadora = perfil === 'gestor' || perfil === 'operacional';
  const tiposDisponiveis = TIPOS;

  const supabase = createClient();
  const [tipo, setTipo] = useState<TipoServico>('viagem');
  const [empresaId, setEmpresaId] = useState(ehTransportadora && empresas.length > 0 ? empresas[0].id : '');
  const [clienteFinal, setClienteFinal] = useState('');
  const [dataColeta, setDataColeta] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [localColeta, setLocalColeta] = useState('');
  const [localEntrega, setLocalEntrega] = useState('');
  const [produto, setProduto] = useState('');
  const [valorCarga, setValorCarga] = useState('');
  const [tipoMotorista, setTipoMotorista] = useState<TipoMotorista>('frota');
  const [anexosConfirmados, setAnexosConfirmados] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const anexosNecessarios =
    tipo === 'viagem' ? anexosObrigatoriosViagem(tipoMotorista) : tipo === 'consulta' ? ANEXOS_CONSULTA : [];

  const anexosPendentes = anexosNecessarios.filter((a) => !anexosConfirmados[a]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!empresaId) {
      setErro('Selecione a empresa transportadora.');
      return;
    }
    if (anexosPendentes.length > 0) {
      setErro(`Anexe/confirme os documentos obrigatórios: ${anexosPendentes.join(', ')}.`);
      return;
    }

    setSalvando(true);

    const payload: Record<string, unknown> = {
      tipo,
      empresa_id: empresaId,
      cliente_final: clienteFinal || null,
      origem: ehTransportadora ? 'transportadora' : 'organizacao',
    };

    if (tipo === 'viagem') {
      Object.assign(payload, {
        data_coleta: dataColeta || null,
        data_entrega: dataEntrega || null,
        local_coleta: localColeta || null,
        local_entrega: localEntrega || null,
        produto: produto || null,
        valor_carga: valorCarga ? Number(valorCarga) : null,
        tipo_motorista: tipoMotorista,
      });
    }

    if (tipo === 'consulta') {
      Object.assign(payload, { tipo_motorista: tipoMotorista });
    }

    const { error } = await supabase.from('solicitacoes').insert(payload);

    setSalvando(false);

    if (error) {
      setErro('Não foi possível salvar a solicitação: ' + error.message);
      return;
    }

    onCriado();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">Nova solicitação</h2>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tipo de serviço</label>
            <div className="grid grid-cols-2 gap-2">
              {tiposDisponiveis.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    tipo === t.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-base-600 text-base-300 hover:bg-base-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Empresa transportadora</label>
            {ehTransportadora ? (
              <input className="input opacity-60" value={empresas[0]?.nome ?? ''} disabled />
            ) : (
              <select className="input" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
                <option value="">Selecione…</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {(tipo === 'viagem' || tipo === 'consulta') && (
            <div>
              <label className="label">Cliente final</label>
              <input className="input" value={clienteFinal} onChange={(e) => setClienteFinal(e.target.value)} />
            </div>
          )}

          {tipo === 'viagem' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data/hora da coleta</label>
                  <input type="datetime-local" className="input" value={dataColeta} onChange={(e) => setDataColeta(e.target.value)} />
                </div>
                <div>
                  <label className="label">Data/hora da entrega</label>
                  <input type="datetime-local" className="input" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Local da coleta</label>
                  <input className="input" value={localColeta} onChange={(e) => setLocalColeta(e.target.value)} />
                </div>
                <div>
                  <label className="label">Local da entrega</label>
                  <input className="input" value={localEntrega} onChange={(e) => setLocalEntrega(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Produto</label>
                  <input className="input" value={produto} onChange={(e) => setProduto(e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor da carga (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={valorCarga}
                    onChange={(e) => setValorCarga(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-base-400">
                    O rastreamento (rastreada/não rastreada) é calculado automaticamente pela apólice da empresa.
                  </p>
                </div>
              </div>
            </>
          )}

          {(tipo === 'viagem' || tipo === 'consulta') && (
            <div>
              <label className="label">Tipo de motorista</label>
              <select
                className="input"
                value={tipoMotorista}
                onChange={(e) => setTipoMotorista(e.target.value as TipoMotorista)}
              >
                <option value="frota">Frota</option>
                <option value="terceiros">Terceiros</option>
                <option value="agregado">Agregado</option>
                <option value="motorista_px">Motorista PX</option>
              </select>
            </div>
          )}

          {anexosNecessarios.length > 0 && (
            <div className="rounded-md border border-base-600 bg-base-800 p-3">
              <p className="label mb-2">Anexos obrigatórios</p>
              <div className="space-y-1.5">
                {anexosNecessarios.map((doc) => (
                  <label key={doc} className="flex items-center gap-2 text-sm text-base-200">
                    <input
                      type="checkbox"
                      checked={!!anexosConfirmados[doc]}
                      onChange={(e) =>
                        setAnexosConfirmados((prev) => ({ ...prev, [doc]: e.target.checked }))
                      }
                    />
                    {doc}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-base-400">
                Upload dos arquivos fica disponível assim que o Supabase Storage estiver configurado.
                Por ora, confirme aqui que os documentos foram recebidos.
              </p>
            </div>
          )}

          {erro && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando…' : 'Registrar solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

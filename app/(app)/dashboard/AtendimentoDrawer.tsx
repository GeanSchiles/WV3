'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Solicitacao, TIPO_SERVICO_LABEL, STATUS_LABEL, PerfilUsuario } from '@/lib/types';

interface Props {
  solicitacao: Solicitacao;
  perfil: PerfilUsuario;
  onClose: () => void;
  onAtualizado: () => void;
}

export default function AtendimentoDrawer({ solicitacao, perfil, onClose, onAtualizado }: Props) {
  const ehTransportadora = perfil === 'gestor' || perfil === 'operacional';
  const supabase = createClient();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [viagemLiberada, setViagemLiberada] = useState<boolean | null>(solicitacao.viagem_liberada);
  const [numeroSm, setNumeroSm] = useState(solicitacao.numero_sm ?? '');

  const [consultaAprovada, setConsultaAprovada] = useState<boolean | null>(solicitacao.consulta_aprovada);
  const [motivo, setMotivo] = useState(solicitacao.consulta_motivo ?? '');

  const [escoltaEmpresa, setEscoltaEmpresa] = useState(solicitacao.escolta_empresa ?? '');

  const [iscaNumero, setIscaNumero] = useState(solicitacao.isca_numero ?? '');

  async function salvar(concluir: boolean) {
    setErro(null);
    setSalvando(true);

    const payload: Record<string, unknown> = {};

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) payload.analista_id = user.id;

    if (solicitacao.tipo === 'viagem') {
      payload.viagem_liberada = viagemLiberada;
      payload.numero_sm = numeroSm || null;
    } else if (solicitacao.tipo === 'consulta') {
      payload.consulta_aprovada = consultaAprovada;
      payload.consulta_motivo = motivo || null;
    } else if (solicitacao.tipo === 'escolta') {
      payload.escolta_empresa = escoltaEmpresa || null;
    } else if (solicitacao.tipo === 'isca') {
      payload.isca_numero = iscaNumero || null;
    }

    if (concluir) {
      payload.status = 'concluido';
      payload.respondido_em = new Date().toISOString();
    }

    const { error } = await supabase.from('solicitacoes').update(payload).eq('id', solicitacao.id);

    setSalvando(false);

    if (error) {
      setErro('Não foi possível salvar: ' + error.message);
      return;
    }

    onAtualizado();
  }

  async function cancelar() {
    const motivoCancelamento = window.prompt('Motivo do cancelamento:');
    if (motivoCancelamento === null) return;

    setSalvando(true);
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'cancelada',
        cancelado_em: new Date().toISOString(),
        motivo_cancelamento: motivoCancelamento,
      })
      .eq('id', solicitacao.id);
    setSalvando(false);

    if (error) {
      setErro('Não foi possível cancelar: ' + error.message);
      return;
    }
    onAtualizado();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="h-full w-full max-w-md overflow-y-auto bg-base-900 p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">{TIPO_SERVICO_LABEL[solicitacao.tipo]}</h2>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>
        <span className={`badge-${solicitacao.status}`}>{STATUS_LABEL[solicitacao.status]}</span>

        <div className="my-5 space-y-2 rounded-md border border-base-700 bg-base-800 p-4 text-sm">
          <Info label="Transportadora" value={solicitacao.empresa?.nome ?? '—'} />
          <Info label="Cliente final" value={solicitacao.cliente_final ?? '—'} />
          <Info label="Local de coleta" value={solicitacao.local_coleta ?? '—'} />
          <Info label="Local de entrega" value={solicitacao.local_entrega ?? '—'} />
          <Info label="Produto" value={solicitacao.produto ?? '—'} />
          <Info
            label="Valor da carga"
            value={solicitacao.valor_carga != null ? `R$ ${solicitacao.valor_carga.toFixed(2)}` : '—'}
          />
          <Info
            label="Rastreamento"
            value={
              solicitacao.carga_rastreada
                ? solicitacao.carga_rastreada === 'rastreada'
                  ? 'Rastreada (automático via apólice)'
                  : 'Não rastreada (automático via apólice)'
                : '—'
            }
          />
        </div>

        {!ehTransportadora && solicitacao.status !== 'cancelada' && (
          <div className="space-y-4">
            {solicitacao.tipo === 'viagem' && (
              <>
                <div>
                  <p className="label">Viagem liberada?</p>
                  <div className="flex gap-2">
                    <button
                      className={`btn ${viagemLiberada === true ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setViagemLiberada(true)}
                      type="button"
                    >
                      Sim
                    </button>
                    <button
                      className={`btn ${viagemLiberada === false ? 'bg-danger text-white' : 'btn-ghost'}`}
                      onClick={() => setViagemLiberada(false)}
                      type="button"
                    >
                      Não
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Número da SM</label>
                  <input className="input" value={numeroSm} onChange={(e) => setNumeroSm(e.target.value)} />
                </div>
              </>
            )}

            {solicitacao.tipo === 'consulta' && (
              <>
                <div>
                  <p className="label">Resultado</p>
                  <div className="flex gap-2">
                    <button
                      className={`btn ${consultaAprovada === true ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setConsultaAprovada(true)}
                      type="button"
                    >
                      Aprovado
                    </button>
                    <button
                      className={`btn ${consultaAprovada === false ? 'bg-danger text-white' : 'btn-ghost'}`}
                      onClick={() => setConsultaAprovada(false)}
                      type="button"
                    >
                      Reprovado
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-base-400">Prazo de resposta: 30 minutos.</p>
                </div>
                <div>
                  <label className="label">Motivo</label>
                  <textarea className="input" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>
              </>
            )}

            {solicitacao.tipo === 'escolta' && (
              <div>
                <label className="label">Empresa responsável pela escolta</label>
                <input className="input" value={escoltaEmpresa} onChange={(e) => setEscoltaEmpresa(e.target.value)} />
              </div>
            )}

            {solicitacao.tipo === 'isca' && (
              <div>
                <label className="label">Número da isca</label>
                <input className="input" value={iscaNumero} onChange={(e) => setIscaNumero(e.target.value)} />
              </div>
            )}

            {erro && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

            <div className="flex justify-between gap-2 pt-2">
              <button onClick={cancelar} disabled={salvando} className="btn-ghost text-danger">
                Cancelar solicitação
              </button>
              <div className="flex gap-2">
                <button onClick={() => salvar(false)} disabled={salvando} className="btn-ghost">
                  Salvar
                </button>
                <button onClick={() => salvar(true)} disabled={salvando} className="btn-primary">
                  {salvando ? 'Salvando…' : 'Confirmar e concluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {ehTransportadora && solicitacao.status === 'concluido' && (
          <div className="space-y-2 rounded-md border border-base-700 bg-base-800 p-4 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-400">
              Resposta da Organização
            </p>
            {solicitacao.tipo === 'viagem' && (
              <>
                <Info label="Viagem liberada" value={solicitacao.viagem_liberada ? 'Sim' : 'Não'} />
                <Info label="Número da SM" value={solicitacao.numero_sm ?? '—'} />
              </>
            )}
            {solicitacao.tipo === 'consulta' && (
              <>
                <Info label="Resultado" value={solicitacao.consulta_aprovada ? 'Aprovado' : 'Reprovado'} />
                <Info label="Motivo" value={solicitacao.consulta_motivo ?? '—'} />
              </>
            )}
            {solicitacao.tipo === 'escolta' && (
              <Info label="Empresa da escolta" value={solicitacao.escolta_empresa ?? '—'} />
            )}
            {solicitacao.tipo === 'isca' && <Info label="Número da isca" value={solicitacao.isca_numero ?? '—'} />}
          </div>
        )}

        {ehTransportadora && solicitacao.status === 'aguardando' && (
          <p className="text-sm text-base-400">Aguardando atendimento da Organização.</p>
        )}

        {solicitacao.status === 'cancelada' && (
          <p className="text-sm text-base-400">
            Motivo do cancelamento: {solicitacao.motivo_cancelamento ?? '—'}
          </p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-base-400">{label}</span>
      <span className="text-right text-base-100">{value}</span>
    </div>
  );
}

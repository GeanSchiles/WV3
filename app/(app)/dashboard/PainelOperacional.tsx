'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Solicitacao,
  TIPO_SERVICO_LABEL,
  STATUS_LABEL,
  StatusServico,
  TipoServico,
  PerfilUsuario,
} from '@/lib/types';
import NovaSolicitacaoModal from './NovaSolicitacaoModal';
import AtendimentoDrawer from './AtendimentoDrawer';

interface Props {
  solicitacoesIniciais: Solicitacao[];
  empresas: { id: string; nome: string }[];
  perfil: PerfilUsuario;
}

export default function PainelOperacional({ solicitacoesIniciais, empresas, perfil }: Props) {
  const supabase = createClient();
  const [solicitacoes, setSolicitacoes] = useState(solicitacoesIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<Solicitacao | null>(null);

  const [filtroStatus, setFiltroStatus] = useState<StatusServico | 'todos'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<TipoServico | 'todos'>('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  async function recarregar() {
    const { data } = await supabase
      .from('solicitacoes')
      .select('*, empresa:empresas_transportadoras(nome)')
      .order('created_at', { ascending: false });
    setSolicitacoes((data as Solicitacao[]) ?? []);
  }

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
      if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) return false;
      if (
        filtroCliente &&
        !`${s.cliente_final ?? ''} ${s.empresa?.nome ?? ''}`
          .toLowerCase()
          .includes(filtroCliente.toLowerCase())
      )
        return false;
      if (filtroDataInicio && s.data_coleta && s.data_coleta < filtroDataInicio) return false;
      if (filtroDataFim && s.data_coleta && s.data_coleta > filtroDataFim) return false;
      return true;
    });
  }, [solicitacoes, filtroStatus, filtroTipo, filtroCliente, filtroDataInicio, filtroDataFim]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-base-700 bg-base-900 p-4">
        <div>
          <label className="label">Status</label>
          <select
            className="input w-40"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusServico | 'todos')}
          >
            <option value="todos">Todos</option>
            <option value="aguardando">Aguardando</option>
            <option value="concluido">Concluído</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="label">Tipo de serviço</label>
          <select
            className="input w-48"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoServico | 'todos')}
          >
            <option value="todos">Todos</option>
            <option value="viagem">Nova Viagem (Rastreio)</option>
            <option value="consulta">Nova Consulta</option>
            <option value="escolta">Escolta</option>
            <option value="isca">Isca</option>
          </select>
        </div>

        <div>
          <label className="label">Cliente</label>
          <input
            className="input w-52"
            placeholder="Buscar cliente ou transportadora"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Período — de</label>
          <input
            type="date"
            className="input w-40"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="label">até</label>
          <input
            type="date"
            className="input w-40"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </div>

        <button onClick={() => setModalAberto(true)} className="btn-primary ml-auto">
          + Nova solicitação
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Transportadora</th>
              <th className="px-4 py-3 font-medium">Cliente final</th>
              <th className="px-4 py-3 font-medium">Coleta</th>
              <th className="px-4 py-3 font-medium">Entrega</th>
              <th className="px-4 py-3 font-medium">Carga</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-base-400">
                  Nenhuma solicitação encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
            {filtradas.map((s) => (
              <tr
                key={s.id}
                onClick={() => setSelecionada(s)}
                className="cursor-pointer border-b border-base-800 bg-base-950 last:border-0 hover:bg-base-900"
              >
                <td className="px-4 py-3">
                  <span className={`badge-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td className="px-4 py-3 text-base-200">{TIPO_SERVICO_LABEL[s.tipo]}</td>
                <td className="px-4 py-3 text-base-200">{s.empresa?.nome ?? '—'}</td>
                <td className="px-4 py-3 text-base-200">{s.cliente_final ?? '—'}</td>
                <td className="px-4 py-3 text-base-300">{formatarData(s.data_coleta)}</td>
                <td className="px-4 py-3 text-base-300">{formatarData(s.data_entrega)}</td>
                <td className="px-4 py-3">
                  {s.carga_rastreada ? (
                    <span
                      className={
                        s.carga_rastreada === 'rastreada' ? 'badge-rastreada' : 'badge-nao-rastreada'
                      }
                    >
                      {s.carga_rastreada === 'rastreada' ? 'Rastreada' : 'Não rastreada'}
                    </span>
                  ) : (
                    <span className="text-base-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <NovaSolicitacaoModal
          empresas={empresas}
          perfil={perfil}
          onClose={() => setModalAberto(false)}
          onCriado={() => {
            setModalAberto(false);
            recarregar();
          }}
        />
      )}

      {selecionada && (
        <AtendimentoDrawer
          solicitacao={selecionada}
          perfil={perfil}
          onClose={() => setSelecionada(null)}
          onAtualizado={() => {
            setSelecionada(null);
            recarregar();
          }}
        />
      )}
    </div>
  );
}

function formatarData(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

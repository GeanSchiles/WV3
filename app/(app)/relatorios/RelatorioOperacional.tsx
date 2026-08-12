'use client';

import { useMemo, useState } from 'react';
import {
  Solicitacao,
  TIPO_SERVICO_LABEL,
  STATUS_LABEL,
  StatusServico,
  TipoServico,
} from '@/lib/types';

interface Props {
  solicitacoes: Solicitacao[];
  empresas: { id: string; nome: string }[];
  analistas: { id: string; nome: string }[];
}

export default function RelatorioOperacional({ solicitacoes, empresas, analistas }: Props) {
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState<TipoServico | 'todos'>('todos');
  const [filtroAnalista, setFiltroAnalista] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<StatusServico | 'todos'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (filtroEmpresa !== 'todas' && s.empresa_id !== filtroEmpresa) return false;
      if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) return false;
      if (filtroAnalista !== 'todos' && s.analista_id !== filtroAnalista) return false;
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
      if (dataInicio && s.created_at < dataInicio) return false;
      if (dataFim && s.created_at > dataFim + 'T23:59:59') return false;
      return true;
    });
  }, [solicitacoes, filtroEmpresa, filtroTipo, filtroAnalista, filtroStatus, dataInicio, dataFim]);

  const totais = useMemo(() => {
    return {
      total: filtradas.length,
      concluidos: filtradas.filter((s) => s.status === 'concluido').length,
      aguardando: filtradas.filter((s) => s.status === 'aguardando').length,
      cancelados: filtradas.filter((s) => s.status === 'cancelada').length,
    };
  }, [filtradas]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-base-700 bg-base-900 p-4">
        <div>
          <label className="label">Empresa</label>
          <select className="input w-48" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
            <option value="todas">Todas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Período — de</label>
          <input type="date" className="input w-40" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="label">até</label>
          <input type="date" className="input w-40" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>

        <div>
          <label className="label">Tipo de serviço</label>
          <select className="input w-48" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as TipoServico | 'todos')}>
            <option value="todos">Todos</option>
            <option value="viagem">Nova Viagem (Rastreio)</option>
            <option value="consulta">Nova Consulta</option>
            <option value="escolta">Escolta</option>
            <option value="isca">Isca</option>
          </select>
        </div>

        <div>
          <label className="label">Analista responsável</label>
          <select className="input w-48" value={filtroAnalista} onChange={(e) => setFiltroAnalista(e.target.value)}>
            <option value="todos">Todos</option>
            {analistas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input w-40" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusServico | 'todos')}>
            <option value="todos">Todos</option>
            <option value="aguardando">Aguardando</option>
            <option value="concluido">Concluído</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-semibold text-base-100">{totais.total}</p>
          <p className="text-xs text-base-400">Total no filtro</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-semibold text-ok">{totais.concluidos}</p>
          <p className="text-xs text-base-400">Concluídos</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-semibold text-warn">{totais.aguardando}</p>
          <p className="text-xs text-base-400">Aguardando</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-semibold text-danger">{totais.cancelados}</p>
          <p className="text-xs text-base-400">Cancelados</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Analista</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-base-400">
                  Nenhum serviço encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
            {filtradas.map((s) => (
              <tr key={s.id} className="border-b border-base-800 bg-base-950 last:border-0">
                <td className="px-4 py-3 text-base-300">
                  {new Date(s.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-base-200">{TIPO_SERVICO_LABEL[s.tipo]}</td>
                <td className="px-4 py-3 text-base-200">{s.empresa?.nome ?? '—'}</td>
                <td className="px-4 py-3 text-base-300">{s.analista?.nome ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

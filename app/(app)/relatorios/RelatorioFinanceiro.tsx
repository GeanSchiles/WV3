'use client';

import { useMemo, useState } from 'react';
import { Solicitacao, TabelaServico, calcularValorPorFaixas } from '@/lib/types';

interface Props {
  solicitacoes: Solicitacao[];
  empresas: { id: string; nome: string }[];
  servicos: TabelaServico[];
}

function formatarReal(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mapeia o tipo interno da solicitação (viagem/consulta/escolta/isca) para o
// nome do serviço cadastrado na Tabela de Serviços (Viagem/Consulta/Escolta/Isca).
const NOME_SERVICO_POR_TIPO: Record<string, string> = {
  viagem: 'Viagem',
  consulta: 'Consulta',
  escolta: 'Escolta',
  isca: 'Isca',
};

export default function RelatorioFinanceiro({ solicitacoes, empresas, servicos }: Props) {
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const linhas = useMemo(() => {
    const empresasFiltradas = filtroEmpresa === 'todas' ? empresas : empresas.filter((e) => e.id === filtroEmpresa);

    const resultado: {
      empresa: { id: string; nome: string };
      tipoServico: string;
      quantidade: number;
      valor: number;
    }[] = [];

    empresasFiltradas.forEach((empresa) => {
      const servicosEmpresa = servicos.filter((s) => s.empresa_id === empresa.id);

      const solicitacoesEmpresa = solicitacoes.filter((s) => {
        if (s.empresa_id !== empresa.id) return false;
        if (s.status !== 'concluido') return false;
        if (dataInicio && s.created_at < dataInicio) return false;
        if (dataFim && s.created_at > dataFim + 'T23:59:59') return false;
        return true;
      });

      // agrupa nomes de serviço presentes tanto nas solicitações quanto na tabela cadastrada
      const tiposPresentes = new Set<string>();
      solicitacoesEmpresa.forEach((s) => tiposPresentes.add(NOME_SERVICO_POR_TIPO[s.tipo] ?? s.tipo));

      tiposPresentes.forEach((tipoServico) => {
        const quantidade = solicitacoesEmpresa.filter(
          (s) => (NOME_SERVICO_POR_TIPO[s.tipo] ?? s.tipo) === tipoServico
        ).length;
        const faixasDoServico = servicosEmpresa.filter((f) => f.tipo_servico === tipoServico);
        const valor = calcularValorPorFaixas(quantidade, faixasDoServico);
        resultado.push({ empresa, tipoServico, quantidade, valor });
      });
    });

    return resultado;
  }, [empresas, servicos, solicitacoes, filtroEmpresa, dataInicio, dataFim]);

  const totaisPorEmpresa = useMemo(() => {
    const mapa: Record<string, { nome: string; total: number; qtd: number }> = {};
    linhas.forEach((l) => {
      if (!mapa[l.empresa.id]) mapa[l.empresa.id] = { nome: l.empresa.nome, total: 0, qtd: 0 };
      mapa[l.empresa.id].total += l.valor;
      mapa[l.empresa.id].qtd += l.quantidade;
    });
    return Object.values(mapa);
  }, [linhas]);

  const totalGeral = linhas.reduce((soma, l) => soma + l.valor, 0);

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
      </div>

      <p className="mb-3 text-xs text-base-400">
        Valores calculados a partir da Tabela de Serviços cadastrada em cada empresa (faixas por quantidade),
        aplicada aos serviços concluídos no período. Representa o valor <span className="text-base-200">a receber</span>{' '}
        — o controle de valores já recebidos ainda não está implementado nesta versão.
      </p>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Quantidade concluída</th>
              <th className="px-4 py-3 font-medium">Valor calculado</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-base-400">
                  Nenhum serviço concluído encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
            {linhas.map((l, i) => (
              <tr key={`${l.empresa.id}-${l.tipoServico}-${i}`} className="border-b border-base-800 bg-base-950 last:border-0">
                <td className="px-4 py-3 text-base-100">{l.empresa.nome}</td>
                <td className="px-4 py-3 text-base-200">{l.tipoServico}</td>
                <td className="px-4 py-3 text-base-300">{l.quantidade}</td>
                <td className="px-4 py-3 text-base-200">
                  {l.valor > 0 ? formatarReal(l.valor) : <span className="text-base-500">sem faixa cadastrada</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {totaisPorEmpresa.length > 0 && (
            <tfoot>
              {totaisPorEmpresa.map((t) => (
                <tr key={t.nome} className="border-t border-base-800 bg-base-900">
                  <td className="px-4 py-2 text-sm font-medium text-base-200" colSpan={2}>
                    Subtotal — {t.nome}
                  </td>
                  <td className="px-4 py-2 text-sm text-base-300">{t.qtd}</td>
                  <td className="px-4 py-2 text-sm font-medium text-base-100">{formatarReal(t.total)}</td>
                </tr>
              ))}
              <tr className="bg-base-900">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-base-300">
                  Total geral
                </td>
                <td className="px-4 py-3 text-base font-semibold text-accent">{formatarReal(totalGeral)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

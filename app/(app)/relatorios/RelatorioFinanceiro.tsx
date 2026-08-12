'use client';

import { useMemo, useState } from 'react';
import { Solicitacao } from '@/lib/types';

interface FaixaFinanceiro {
  id: string;
  empresa_id: string;
  tipo_servico: 'viagem' | 'extra';
  valor_de: number;
  valor_ate: number | null;
  valor_cobrado: number;
}

interface Props {
  solicitacoes: Solicitacao[];
  empresas: { id: string; nome: string }[];
  faixas: FaixaFinanceiro[];
}

function calcularValorViagem(valorCarga: number | null, faixasEmpresa: FaixaFinanceiro[]): number {
  if (valorCarga == null) return 0;
  const faixa = faixasEmpresa
    .filter((f) => f.tipo_servico === 'viagem')
    .find((f) => valorCarga >= f.valor_de && (f.valor_ate == null || valorCarga <= f.valor_ate));
  return faixa?.valor_cobrado ?? 0;
}

function formatarReal(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RelatorioFinanceiro({ solicitacoes, empresas, faixas }: Props) {
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const linhas = useMemo(() => {
    const empresasFiltradas = filtroEmpresa === 'todas' ? empresas : empresas.filter((e) => e.id === filtroEmpresa);

    return empresasFiltradas.map((empresa) => {
      const faixasEmpresa = faixas.filter((f) => f.empresa_id === empresa.id);
      const faixaExtra = faixasEmpresa.find((f) => f.tipo_servico === 'extra');

      const solicitacoesEmpresa = solicitacoes.filter((s) => {
        if (s.empresa_id !== empresa.id) return false;
        if (s.status !== 'concluido') return false;
        if (dataInicio && s.created_at < dataInicio) return false;
        if (dataFim && s.created_at > dataFim + 'T23:59:59') return false;
        return true;
      });

      const viagens = solicitacoesEmpresa.filter((s) => s.tipo === 'viagem');
      const extras = solicitacoesEmpresa.filter((s) => s.tipo !== 'viagem');

      const valorServicos = viagens.reduce((soma, s) => soma + calcularValorViagem(s.valor_carga, faixasEmpresa), 0);
      const valorExtras = extras.length * (faixaExtra?.valor_cobrado ?? 0);

      return {
        empresa,
        qtdViagens: viagens.length,
        qtdExtras: extras.length,
        valorServicos,
        valorExtras,
        total: valorServicos + valorExtras,
      };
    });
  }, [empresas, faixas, solicitacoes, filtroEmpresa, dataInicio, dataFim]);

  const totalGeral = linhas.reduce((soma, l) => soma + l.total, 0);

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
        Valores calculados a partir das faixas cadastradas no módulo Financeiro, aplicadas aos serviços concluídos
        no período. Representa o valor <span className="text-base-200">a receber</span> — o controle de valores já
        recebidos ainda não está implementado nesta versão.
      </p>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Viagens concluídas</th>
              <th className="px-4 py-3 font-medium">Valor dos serviços</th>
              <th className="px-4 py-3 font-medium">Serviços extras</th>
              <th className="px-4 py-3 font-medium">Valores extras</th>
              <th className="px-4 py-3 font-medium">Total a receber</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-base-400">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
            {linhas.map((l) => (
              <tr key={l.empresa.id} className="border-b border-base-800 bg-base-950 last:border-0">
                <td className="px-4 py-3 text-base-100">{l.empresa.nome}</td>
                <td className="px-4 py-3 text-base-300">{l.qtdViagens}</td>
                <td className="px-4 py-3 text-base-200">{formatarReal(l.valorServicos)}</td>
                <td className="px-4 py-3 text-base-300">{l.qtdExtras}</td>
                <td className="px-4 py-3 text-base-200">{formatarReal(l.valorExtras)}</td>
                <td className="px-4 py-3 font-medium text-base-100">{formatarReal(l.total)}</td>
              </tr>
            ))}
          </tbody>
          {linhas.length > 0 && (
            <tfoot>
              <tr className="bg-base-900">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-base-300">
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

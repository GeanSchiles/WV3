'use client';

import { useState } from 'react';
import { Solicitacao } from '@/lib/types';
import RelatorioOperacional from './RelatorioOperacional';
import RelatorioFinanceiro from './RelatorioFinanceiro';

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
  analistas: { id: string; nome: string }[];
  faixasFinanceiro: FaixaFinanceiro[];
  podeVerFinanceiro: boolean;
}

export default function RelatoriosTabs({
  solicitacoes,
  empresas,
  analistas,
  faixasFinanceiro,
  podeVerFinanceiro,
}: Props) {
  const [aba, setAba] = useState<'operacional' | 'financeiro'>('operacional');

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-base-700">
        <button
          onClick={() => setAba('operacional')}
          className={`px-4 py-2 text-sm font-medium ${
            aba === 'operacional'
              ? 'border-b-2 border-accent text-accent'
              : 'text-base-400 hover:text-base-200'
          }`}
        >
          Relatório Operacional
        </button>
        {podeVerFinanceiro && (
          <button
            onClick={() => setAba('financeiro')}
            className={`px-4 py-2 text-sm font-medium ${
              aba === 'financeiro'
                ? 'border-b-2 border-accent text-accent'
                : 'text-base-400 hover:text-base-200'
            }`}
          >
            Relatório Financeiro
          </button>
        )}
      </div>

      {aba === 'operacional' && (
        <RelatorioOperacional solicitacoes={solicitacoes} empresas={empresas} analistas={analistas} />
      )}

      {aba === 'financeiro' && podeVerFinanceiro && (
        <RelatorioFinanceiro solicitacoes={solicitacoes} empresas={empresas} faixas={faixasFinanceiro} />
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FinanceiroFaixa, PerfilUsuario } from '@/lib/types';
import FinanceiroModal from './FinanceiroModal';

interface Props {
  empresas: { id: string; nome: string }[];
  faixasIniciais: FinanceiroFaixa[];
  contagemPorEmpresa: Record<string, number>;
  perfil: PerfilUsuario;
}

export default function FinanceiroLista({ empresas, faixasIniciais, contagemPorEmpresa, perfil }: Props) {
  const supabase = createClient();
  const [faixas, setFaixas] = useState(faixasIniciais);
  const [busca, setBusca] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<{ id: string; nome: string } | null>(null);

  const faixasPorEmpresa = useMemo(() => {
    const mapa: Record<string, FinanceiroFaixa[]> = {};
    faixas.forEach((f) => {
      if (!mapa[f.empresa_id]) mapa[f.empresa_id] = [];
      mapa[f.empresa_id].push(f);
    });
    return mapa;
  }, [faixas]);

  const filtradas = empresas.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase()));

  async function recarregarFaixas() {
    const { data } = await supabase.from('financeiro_faixas').select('*').order('valor_de');
    setFaixas(data ?? []);
  }

  return (
    <div>
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Buscar empresa"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Faixas cadastradas</th>
              <th className="px-4 py-3 font-medium">Serviços concluídos</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-base-400">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
            {filtradas.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => setEmpresaSelecionada(emp)}
                className="cursor-pointer border-b border-base-800 bg-base-950 last:border-0 hover:bg-base-900"
              >
                <td className="px-4 py-3 text-base-100">{emp.nome}</td>
                <td className="px-4 py-3 text-base-300">{faixasPorEmpresa[emp.id]?.length ?? 0}</td>
                <td className="px-4 py-3 text-base-300">{contagemPorEmpresa[emp.id] ?? 0}</td>
                <td className="px-4 py-3 text-right text-accent">
                  {perfil === 'administrador' ? 'Gerenciar valores →' : 'Ver valores →'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {empresaSelecionada && (
        <FinanceiroModal
          empresa={empresaSelecionada}
          faixas={faixasPorEmpresa[empresaSelecionada.id] ?? []}
          somenteLeitura={perfil !== 'administrador'}
          onClose={() => setEmpresaSelecionada(null)}
          onSalvo={() => {
            setEmpresaSelecionada(null);
            recarregarFaixas();
          }}
        />
      )}
    </div>
  );
}

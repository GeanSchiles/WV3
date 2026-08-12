'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FinanceiroFaixa, TipoValorServico } from '@/lib/types';

interface LinhaFaixa {
  id?: string;
  tipo_servico: TipoValorServico;
  valor_de: string;
  valor_ate: string;
  valor_cobrado: string;
}

interface Props {
  empresa: { id: string; nome: string };
  faixas: FinanceiroFaixa[];
  somenteLeitura: boolean;
  onClose: () => void;
  onSalvo: () => void;
}

export default function FinanceiroModal({ empresa, faixas, somenteLeitura, onClose, onSalvo }: Props) {
  const supabase = createClient();

  const [linhas, setLinhas] = useState<LinhaFaixa[]>(
    faixas.length > 0
      ? faixas.map((f) => ({
          id: f.id,
          tipo_servico: f.tipo_servico,
          valor_de: String(f.valor_de),
          valor_ate: f.valor_ate != null ? String(f.valor_ate) : '',
          valor_cobrado: String(f.valor_cobrado),
        }))
      : [{ tipo_servico: 'viagem', valor_de: '0', valor_ate: '', valor_cobrado: '' }]
  );

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function atualizarLinha(i: number, campo: keyof LinhaFaixa, valor: string) {
    setLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, { tipo_servico: 'viagem', valor_de: '', valor_ate: '', valor_cobrado: '' }]);
  }

  function removerLinha(i: number) {
    setLinhas((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const linhasValidas = linhas.filter((l) => l.valor_cobrado !== '');
    if (linhasValidas.length === 0) {
      setErro('Adicione ao menos uma faixa com valor cobrado.');
      return;
    }

    setSalvando(true);

    // substitui todas as faixas da empresa pelo conjunto atual (simples e previsível)
    const { error: erroDelete } = await supabase.from('financeiro_faixas').delete().eq('empresa_id', empresa.id);
    if (erroDelete) {
      setSalvando(false);
      setErro('Erro ao salvar: ' + erroDelete.message);
      return;
    }

    const paraInserir = linhasValidas.map((l) => ({
      empresa_id: empresa.id,
      tipo_servico: l.tipo_servico,
      valor_de: l.valor_de ? Number(l.valor_de) : 0,
      valor_ate: l.valor_ate ? Number(l.valor_ate) : null,
      valor_cobrado: Number(l.valor_cobrado),
    }));

    const { error: erroInsert } = await supabase.from('financeiro_faixas').insert(paraInserir);
    setSalvando(false);

    if (erroInsert) {
      setErro('Erro ao salvar: ' + erroInsert.message);
      return;
    }

    onSalvo();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">Valores — {empresa.nome}</h2>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-base-400">
            "Viagem" usa faixas de valor da carga (De / Até). "Extra" é cobrado a partir de um valor, sem limite
            superior — deixe "Até" em branco.
          </p>

          <div className="space-y-2">
            {linhas.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    disabled={somenteLeitura}
                    value={l.tipo_servico}
                    onChange={(e) => atualizarLinha(i, 'tipo_servico', e.target.value)}
                  >
                    <option value="viagem">Viagem</option>
                    <option value="extra">Extra</option>
                  </select>
                </div>
                <div>
                  <label className="label">De (R$)</label>
                  <input
                    type="number"
                    className="input"
                    disabled={somenteLeitura}
                    value={l.valor_de}
                    onChange={(e) => atualizarLinha(i, 'valor_de', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Até (R$)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="sem limite"
                    disabled={somenteLeitura}
                    value={l.valor_ate}
                    onChange={(e) => atualizarLinha(i, 'valor_ate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Valor cobrado (R$)</label>
                  <input
                    type="number"
                    className="input"
                    disabled={somenteLeitura}
                    value={l.valor_cobrado}
                    onChange={(e) => atualizarLinha(i, 'valor_cobrado', e.target.value)}
                  />
                </div>
                {!somenteLeitura && (
                  <button
                    type="button"
                    onClick={() => removerLinha(i)}
                    className="btn-ghost h-9 px-2 text-danger"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {!somenteLeitura && (
            <button type="button" className="btn-ghost text-xs" onClick={adicionarLinha}>
              + adicionar faixa
            </button>
          )}

          {erro && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

          <div className="flex justify-end gap-2 border-t border-base-700 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </button>
            {!somenteLeitura && (
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? 'Salvando…' : 'Salvar valores'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

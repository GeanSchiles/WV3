'use client';

import { useState } from 'react';

export interface LinhaServico {
  id?: string;
  nome: string;
  valor: string;
  padrao: boolean;
}

interface Props {
  nomeEmpresa: string;
  servicos: LinhaServico[];
  onFechar: () => void;
  onSalvar: (servicos: LinhaServico[]) => void;
}

export default function TabelaServicosModal({ nomeEmpresa, servicos, onFechar, onSalvar }: Props) {
  const [linhas, setLinhas] = useState<LinhaServico[]>(servicos);
  const [erro, setErro] = useState<string | null>(null);

  function atualizarLinha(i: number, campo: 'nome' | 'valor', valor: string) {
    setLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }

  function removerLinha(i: number) {
    setLinhas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function adicionarServico() {
    setLinhas((prev) => [...prev, { nome: '', valor: '', padrao: false }]);
  }

  function confirmar() {
    const nomesVistos = new Set<string>();
    for (const l of linhas) {
      if (!l.nome.trim()) {
        setErro('Todo serviço precisa de um nome.');
        return;
      }
      const chave = l.nome.trim().toLowerCase();
      if (nomesVistos.has(chave)) {
        setErro(`Serviço repetido: "${l.nome}".`);
        return;
      }
      nomesVistos.add(chave);
    }
    setErro(null);
    onSalvar(linhas);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">Tabela de Serviços</h2>
          <button onClick={onFechar} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>
        <p className="mb-5 text-xs text-base-400">{nomeEmpresa}</p>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_140px_auto] gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-base-400">
            <span>Serviço</span>
            <span>Valor acordado (R$)</span>
            <span></span>
          </div>

          {linhas.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_auto] items-center gap-2">
              <input
                className="input"
                placeholder="Nome do serviço"
                value={l.nome}
                disabled={l.padrao}
                onChange={(e) => atualizarLinha(i, 'nome', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0,00"
                value={l.valor}
                onChange={(e) => atualizarLinha(i, 'valor', e.target.value)}
              />
              {l.padrao ? (
                <span className="w-9" />
              ) : (
                <button
                  type="button"
                  onClick={() => removerLinha(i)}
                  className="btn-ghost h-9 w-9 px-0 text-danger"
                  title="Remover serviço"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="btn-ghost mt-3 text-xs" onClick={adicionarServico}>
          + Novo serviço
        </button>

        {erro && <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

        <div className="mt-6 flex justify-end gap-2 border-t border-base-700 pt-4">
          <button type="button" onClick={onFechar} className="btn-ghost">
            Cancelar
          </button>
          <button type="button" onClick={confirmar} className="btn-primary">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

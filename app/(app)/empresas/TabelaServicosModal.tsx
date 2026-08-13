'use client';

import { useState } from 'react';

export interface LinhaFaixaServico {
  id?: string;
  faixa_de: string;
  faixa_ate: string;
  valor_unitario: string;
}

export interface GrupoServico {
  tipo_servico: string;
  padrao: boolean;
  faixas: LinhaFaixaServico[];
}

interface Props {
  nomeEmpresa: string;
  grupos: GrupoServico[];
  somenteLeitura?: boolean;
  onFechar: () => void;
  onSalvar: (grupos: GrupoServico[]) => void;
}

const UNIDADE_POR_TIPO: Record<string, string> = {
  Viagem: 'por viagem',
  Isca: 'por isca',
  Consulta: 'por consulta',
  Escolta: 'por escolta',
};

export default function TabelaServicosModal({
  nomeEmpresa,
  grupos,
  somenteLeitura = false,
  onFechar,
  onSalvar,
}: Props) {
  const [listaGrupos, setListaGrupos] = useState<GrupoServico[]>(grupos);
  const [erro, setErro] = useState<string | null>(null);

  function atualizarNomeGrupo(gi: number, valor: string) {
    setListaGrupos((prev) => prev.map((g, i) => (i === gi ? { ...g, tipo_servico: valor } : g)));
  }

  function atualizarFaixa(gi: number, fi: number, campo: keyof LinhaFaixaServico, valor: string) {
    setListaGrupos((prev) =>
      prev.map((g, i) =>
        i === gi
          ? { ...g, faixas: g.faixas.map((f, j) => (j === fi ? { ...f, [campo]: valor } : f)) }
          : g
      )
    );
  }

  function adicionarFaixa(gi: number) {
    setListaGrupos((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, faixas: [...g.faixas, { faixa_de: '', faixa_ate: '', valor_unitario: '' }] } : g))
    );
  }

  function removerFaixa(gi: number, fi: number) {
    setListaGrupos((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, faixas: g.faixas.filter((_, j) => j !== fi) } : g))
    );
  }

  function removerGrupo(gi: number) {
    setListaGrupos((prev) => prev.filter((_, i) => i !== gi));
  }

  function adicionarServico() {
    setListaGrupos((prev) => [
      ...prev,
      { tipo_servico: '', padrao: false, faixas: [{ faixa_de: '0', faixa_ate: '', valor_unitario: '' }] },
    ]);
  }

  function confirmar() {
    const nomesVistos = new Set<string>();
    for (const g of listaGrupos) {
      if (!g.tipo_servico.trim()) {
        setErro('Todo serviço precisa de um nome.');
        return;
      }
      const chave = g.tipo_servico.trim().toLowerCase();
      if (nomesVistos.has(chave)) {
        setErro(`Serviço repetido: "${g.tipo_servico}".`);
        return;
      }
      nomesVistos.add(chave);

      const faixasPreenchidas = g.faixas.filter((f) => f.faixa_de !== '' && f.valor_unitario !== '');
      if (faixasPreenchidas.length === 0) continue;

      const ordenadas = [...faixasPreenchidas].sort((a, b) => Number(a.faixa_de) - Number(b.faixa_de));
      for (let i = 0; i < ordenadas.length; i++) {
        const atual = ordenadas[i];
        if (atual.faixa_ate !== '' && Number(atual.faixa_ate) < Number(atual.faixa_de)) {
          setErro(`Em "${g.tipo_servico}", a faixa "até" não pode ser menor que "de".`);
          return;
        }
        const proxima = ordenadas[i + 1];
        if (proxima && atual.faixa_ate !== '' && Number(proxima.faixa_de) <= Number(atual.faixa_ate)) {
          setErro(`Em "${g.tipo_servico}", as faixas de quantidade não podem se sobrepor.`);
          return;
        }
      }
    }
    setErro(null);
    onSalvar(listaGrupos);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">Tabela de Serviços</h2>
          <button onClick={onFechar} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>
        <p className="mb-5 text-xs text-base-400">{nomeEmpresa}</p>
        <p className="mb-4 text-[11px] text-base-400">
          Valor acordado por faixa de quantidade (volume). Ex: de 0 a 100 viagens = R$ 100 por viagem; de 101 a 150 =
          R$ 115 por viagem. Deixe "até" em branco para "sem limite superior".
        </p>

        <div className="space-y-5">
          {listaGrupos.map((g, gi) => (
            <div key={gi} className="rounded-md border border-base-700 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <input
                  className="input max-w-[220px] font-medium"
                  placeholder="Nome do serviço"
                  value={g.tipo_servico}
                  disabled={g.padrao || somenteLeitura}
                  onChange={(e) => atualizarNomeGrupo(gi, e.target.value)}
                />
                {!g.padrao && !somenteLeitura && (
                  <button
                    type="button"
                    onClick={() => removerGrupo(gi)}
                    className="btn-ghost h-8 px-2 text-xs text-danger"
                  >
                    Remover serviço
                  </button>
                )}
              </div>

              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-400">
                <span>De (qtd.)</span>
                <span>Até (qtd.)</span>
                <span>Valor {UNIDADE_POR_TIPO[g.tipo_servico] ?? 'por unidade'} (R$)</span>
                <span></span>
              </div>
              <div className="mt-1 space-y-1.5">
                {g.faixas.map((f, fi) => (
                  <div key={fi} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="input"
                      disabled={somenteLeitura}
                      value={f.faixa_de}
                      onChange={(e) => atualizarFaixa(gi, fi, 'faixa_de', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      className="input"
                      placeholder="sem limite"
                      disabled={somenteLeitura}
                      value={f.faixa_ate}
                      onChange={(e) => atualizarFaixa(gi, fi, 'faixa_ate', e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder="0,00"
                      disabled={somenteLeitura}
                      value={f.valor_unitario}
                      onChange={(e) => atualizarFaixa(gi, fi, 'valor_unitario', e.target.value)}
                    />
                    {!somenteLeitura && (
                      <button
                        type="button"
                        onClick={() => removerFaixa(gi, fi)}
                        className="btn-ghost h-9 w-9 px-0 text-danger"
                        title="Remover faixa"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!somenteLeitura && (
                <button type="button" className="btn-ghost mt-2 text-xs" onClick={() => adicionarFaixa(gi)}>
                  + adicionar faixa
                </button>
              )}
            </div>
          ))}
        </div>

        {!somenteLeitura && (
          <button type="button" className="btn-ghost mt-4 text-xs" onClick={adicionarServico}>
            + Novo serviço
          </button>
        )}

        {erro && <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

        <div className="mt-6 flex justify-end gap-2 border-t border-base-700 pt-4">
          <button type="button" onClick={onFechar} className="btn-ghost">
            {somenteLeitura ? 'Fechar' : 'Cancelar'}
          </button>
          {!somenteLeitura && (
            <button type="button" onClick={confirmar} className="btn-primary">
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

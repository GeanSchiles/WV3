'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TabelaServico, PerfilUsuario, SERVICOS_PADRAO } from '@/lib/types';
import TabelaServicosModal, { GrupoServico } from '../empresas/TabelaServicosModal';

interface Props {
  empresas: { id: string; nome: string }[];
  servicosIniciais: TabelaServico[];
  contagemPorEmpresa: Record<string, number>;
  perfil: PerfilUsuario;
}

function paraGrupos(servicosEmpresa: TabelaServico[]): GrupoServico[] {
  const grupos: GrupoServico[] = [];
  servicosEmpresa
    .slice()
    .sort((a, b) => a.faixa_de - b.faixa_de)
    .forEach((s) => {
      let grupo = grupos.find((g) => g.tipo_servico === s.tipo_servico);
      if (!grupo) {
        grupo = { tipo_servico: s.tipo_servico, padrao: SERVICOS_PADRAO.includes(s.tipo_servico), faixas: [] };
        grupos.push(grupo);
      }
      grupo.faixas.push({
        id: s.id,
        faixa_de: String(s.faixa_de),
        faixa_ate: s.faixa_ate != null ? String(s.faixa_ate) : '',
        valor_unitario: String(s.valor_unitario),
      });
    });
  SERVICOS_PADRAO.forEach((tipo_servico) => {
    if (!grupos.some((g) => g.tipo_servico === tipo_servico)) {
      grupos.unshift({ tipo_servico, padrao: true, faixas: [{ faixa_de: '0', faixa_ate: '', valor_unitario: '' }] });
    }
  });
  return grupos;
}

export default function FinanceiroLista({ empresas, servicosIniciais, contagemPorEmpresa, perfil }: Props) {
  const supabase = createClient();
  const [servicos, setServicos] = useState(servicosIniciais);
  const [busca, setBusca] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<{ id: string; nome: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const servicosPorEmpresa = useMemo(() => {
    const mapa: Record<string, TabelaServico[]> = {};
    servicos.forEach((s) => {
      if (!mapa[s.empresa_id]) mapa[s.empresa_id] = [];
      mapa[s.empresa_id].push(s);
    });
    return mapa;
  }, [servicos]);

  const filtradas = empresas.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase()));

  async function recarregarServicos() {
    const { data } = await supabase.from('tabela_servicos').select('*').order('faixa_de');
    setServicos(data ?? []);
  }

  async function salvarGrupos(empresaId: string, grupos: GrupoServico[]) {
    setSalvando(true);
    setErro(null);

    const linhas: { empresa_id: string; tipo_servico: string; faixa_de: number; faixa_ate: number | null; valor_unitario: number }[] = [];
    grupos.forEach((g) => {
      g.faixas
        .filter((f) => f.faixa_de !== '' && f.valor_unitario !== '')
        .forEach((f) => {
          linhas.push({
            empresa_id: empresaId,
            tipo_servico: g.tipo_servico.trim(),
            faixa_de: Number(f.faixa_de),
            faixa_ate: f.faixa_ate ? Number(f.faixa_ate) : null,
            valor_unitario: Number(f.valor_unitario),
          });
        });
    });

    const { error: erroDelete } = await supabase.from('tabela_servicos').delete().eq('empresa_id', empresaId);
    if (erroDelete) {
      setSalvando(false);
      setErro('Erro ao salvar: ' + erroDelete.message);
      return;
    }

    if (linhas.length > 0) {
      const { error: erroInsert } = await supabase.from('tabela_servicos').insert(linhas);
      if (erroInsert) {
        setSalvando(false);
        setErro('Erro ao salvar: ' + erroInsert.message);
        return;
      }
    }

    setSalvando(false);
    setEmpresaSelecionada(null);
    recarregarServicos();
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

      {erro && <p className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

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
                <td className="px-4 py-3 text-base-300">{servicosPorEmpresa[emp.id]?.length ?? 0}</td>
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
        <TabelaServicosModal
          nomeEmpresa={empresaSelecionada.nome}
          grupos={paraGrupos(servicosPorEmpresa[empresaSelecionada.id] ?? [])}
          somenteLeitura={perfil !== 'administrador' || salvando}
          onFechar={() => setEmpresaSelecionada(null)}
          onSalvar={(grupos) => salvarGrupos(empresaSelecionada.id, grupos)}
        />
      )}
    </div>
  );
}

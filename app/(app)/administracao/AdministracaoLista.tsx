'use client';

import { useMemo, useState } from 'react';
import { Profile, PerfilUsuario } from '@/lib/types';
import UsuarioModal from './UsuarioModal';

interface Vinculo {
  analista_id: string;
  empresa_id: string;
}

interface Props {
  usuariosIniciais: Profile[];
  empresas: { id: string; nome: string }[];
  vinculosIniciais: Vinculo[];
}

export default function AdministracaoLista({ usuariosIniciais, empresas, vinculosIniciais }: Props) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [vinculos, setVinculos] = useState(vinculosIniciais);
  const [filtro, setFiltro] = useState<PerfilUsuario | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Profile | null>(null);

  const empresasPorAnalista = useMemo(() => {
    const mapa: Record<string, number> = {};
    vinculos.forEach((v) => {
      mapa[v.analista_id] = (mapa[v.analista_id] ?? 0) + 1;
    });
    return mapa;
  }, [vinculos]);

  const nomeEmpresaPorId = useMemo(() => {
    const mapa: Record<string, string> = {};
    empresas.forEach((e) => {
      mapa[e.id] = e.nome;
    });
    return mapa;
  }, [empresas]);

  const filtrados = useMemo(
    () =>
      usuarios.filter((u) => {
        if (filtro !== 'todos' && u.perfil !== filtro) return false;
        if (busca && !`${u.nome} ${u.email}`.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      }),
    [usuarios, filtro, busca]
  );

  async function recarregar() {
    // recarrega a página inteira para simplificar — mantém server component como fonte da verdade
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="input w-48"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as PerfilUsuario | 'todos')}
        >
          <option value="todos">Todos os perfis</option>
          <option value="administrador">Administrador</option>
          <option value="analista">Analista</option>
          <option value="gestor">Gestor</option>
          <option value="operacional">Operacional</option>
        </select>

        <input
          className="input max-w-xs"
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button
          className="btn-primary ml-auto"
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
        >
          + Novo usuário
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 bg-base-900 text-left text-xs uppercase tracking-wide text-base-400">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Empresa(s)</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-base-400">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {filtrados.map((u) => (
              <tr
                key={u.id}
                onClick={() => {
                  setEditando(u);
                  setModalAberto(true);
                }}
                className="cursor-pointer border-b border-base-800 bg-base-950 last:border-0 hover:bg-base-900"
              >
                <td className="px-4 py-3 text-base-100">{u.nome}</td>
                <td className="px-4 py-3 text-base-300">{u.email}</td>
                <td className="px-4 py-3 capitalize text-base-200">{u.perfil}</td>
                <td className="px-4 py-3 text-base-300">{u.funcao ?? '—'}</td>
                <td className="px-4 py-3 text-base-300">
                  {u.perfil === 'analista' && `${empresasPorAnalista[u.id] ?? 0} / 50`}
                  {(u.perfil === 'gestor' || u.perfil === 'operacional') &&
                    (u.empresa_transportadora_id ? nomeEmpresaPorId[u.empresa_transportadora_id] ?? '—' : '—')}
                  {u.perfil === 'administrador' && '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <UsuarioModal
          usuario={editando}
          empresas={empresas}
          empresasVinculadasIds={
            editando ? vinculos.filter((v) => v.analista_id === editando.id).map((v) => v.empresa_id) : []
          }
          onClose={() => setModalAberto(false)}
          onSalvo={() => {
            setModalAberto(false);
            recarregar();
          }}
        />
      )}
    </div>
  );
}

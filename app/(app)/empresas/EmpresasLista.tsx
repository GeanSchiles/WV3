'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EmpresaTransportadora } from '@/lib/types';
import EmpresaModal from './EmpresaModal';

export default function EmpresasLista({
  empresasIniciais,
}: {
  empresasIniciais: EmpresaTransportadora[];
}) {
  const supabase = createClient();
  const [empresas, setEmpresas] = useState(empresasIniciais);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<EmpresaTransportadora | null>(null);

  const filtradas = useMemo(
    () =>
      empresas.filter(
        (e) =>
          e.nome.toLowerCase().includes(busca.toLowerCase()) ||
          e.cnpj.includes(busca)
      ),
    [empresas, busca]
  );

  async function recarregar() {
    const { data } = await supabase.from('empresas_transportadoras').select('*').order('nome');
    setEmpresas(data ?? []);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nome ou CNPJ"
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
          + Nova empresa
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtradas.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setEditando(e);
              setModalAberto(true);
            }}
            className="card p-4 text-left hover:border-accent/50"
          >
            <p className="font-medium text-base-100">{e.nome}</p>
            <p className="mt-0.5 text-xs text-base-400">{e.cnpj}</p>
            <p className="mt-2 text-xs text-base-300">Responsável: {e.responsavel ?? '—'}</p>
          </button>
        ))}
        {filtradas.length === 0 && (
          <p className="col-span-full py-10 text-center text-base-400">
            Nenhuma empresa cadastrada ainda.
          </p>
        )}
      </div>

      {modalAberto && (
        <EmpresaModal
          empresa={editando}
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

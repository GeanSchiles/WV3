'use client';

import { useEffect, useState } from 'react';
import SignOutButton from './SignOutButton';
import NavLinks from './NavLinks';
import { PerfilUsuario } from '@/lib/types';

interface Props {
  perfil: PerfilUsuario;
  nome: string;
}

export default function Sidebar({ perfil, nome }: Props) {
  const [recolhido, setRecolhido] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem('wv3-sidebar-recolhido');
    if (salvo === 'true') setRecolhido(true);
    setCarregado(true);
  }, []);

  function alternar() {
    setRecolhido((prev) => {
      localStorage.setItem('wv3-sidebar-recolhido', String(!prev));
      return !prev;
    });
  }

  // evita "flash" com largura errada antes de ler o localStorage
  if (!carregado) {
    return <aside className="w-60 shrink-0 border-r border-base-700 bg-base-900" />;
  }

  return (
    <aside
      className={`relative flex shrink-0 flex-col border-r border-base-700 bg-base-900 transition-all duration-200 ${
        recolhido ? 'w-[68px]' : 'w-60'
      }`}
    >
      <button
        onClick={alternar}
        title={recolhido ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-base-600 bg-base-800 text-base-300 hover:text-base-100"
      >
        {recolhido ? '›' : '‹'}
      </button>

      <div className={`flex items-center gap-2 px-4 py-5 ${recolhido ? 'justify-center px-0' : ''}`}>
        <img src="/logo-wv3.png" alt="WV3" className="h-9 w-9 shrink-0 rounded-full" />
        {!recolhido && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold leading-tight text-base-100">WV3</p>
            <p className="truncate text-[11px] leading-tight text-base-400">Controle de Serviço</p>
          </div>
        )}
      </div>

      <NavLinks perfil={perfil} recolhido={recolhido} />

      <div className={`mt-auto border-t border-base-700 p-4 ${recolhido ? 'px-2' : ''}`}>
        {!recolhido && (
          <>
            <p className="truncate text-sm text-base-100">{nome}</p>
            <p className="mb-3 truncate text-xs capitalize text-base-400">{perfil}</p>
          </>
        )}
        <SignOutButton recolhido={recolhido} />
      </div>
    </aside>
  );
}

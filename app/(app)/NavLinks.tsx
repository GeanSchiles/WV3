'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PerfilUsuario } from '@/lib/types';

const ITEM_CLASS =
  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors';

export default function NavLinks({ perfil, recolhido }: { perfil: PerfilUsuario; recolhido: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Painel Operacional', sigla: 'PO', show: true },
    {
      href: '/empresas',
      label: 'Empresas Transportadoras',
      sigla: 'ET',
      show: perfil === 'administrador' || perfil === 'analista',
    },
    {
      href: '/administracao',
      label: 'Administração',
      sigla: 'AD',
      show: perfil === 'administrador',
    },
    {
      href: '/financeiro',
      label: 'Financeiro',
      sigla: 'FI',
      show: perfil === 'administrador' || perfil === 'gestor',
    },
    {
      href: '/relatorios',
      label: 'Relatórios',
      sigla: 'RE',
      show: perfil === 'administrador' || perfil === 'analista' || perfil === 'gestor',
    },
  ].filter((i) => i.show);

  return (
    <nav className={`flex flex-col gap-1 ${recolhido ? 'px-2' : 'px-3'}`}>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={recolhido ? item.label : undefined}
            className={`${ITEM_CLASS} ${recolhido ? 'justify-center px-0' : ''} ${
              active
                ? 'bg-accent/15 text-accent'
                : 'text-base-300 hover:bg-base-800 hover:text-base-100'
            }`}
          >
            {recolhido ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold">
                {item.sigla}
              </span>
            ) : (
              item.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}

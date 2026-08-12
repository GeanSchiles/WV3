'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PerfilUsuario } from '@/lib/types';

const ITEM_CLASS =
  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors';

export default function NavLinks({ perfil }: { perfil: PerfilUsuario }) {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Painel Operacional', show: true },
    {
      href: '/empresas',
      label: 'Empresas Transportadoras',
      show: perfil === 'administrador' || perfil === 'analista',
    },
    {
      href: '/administracao',
      label: 'Administração',
      show: perfil === 'administrador',
    },
    {
      href: '/financeiro',
      label: 'Financeiro',
      show: perfil === 'administrador' || perfil === 'gestor',
    },
    {
      href: '/relatorios',
      label: 'Relatórios',
      show: perfil === 'administrador' || perfil === 'analista' || perfil === 'gestor',
    },
  ].filter((i) => i.show);

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${ITEM_CLASS} ${
              active
                ? 'bg-accent/15 text-accent'
                : 'text-base-300 hover:bg-base-800 hover:text-base-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

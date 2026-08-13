'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PerfilUsuario } from '@/lib/types';

const ITEM_CLASS =
  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors';

function IconPainel() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 4v6" />
    </svg>
  );
}

function IconEmpresas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20V9l6-4 6 4v11" />
      <path d="M15 20v-7l6 3v4" />
      <path d="M8 20v-4h2v4M8 12h2M8 8h2" />
    </svg>
  );
}

function IconAdministracao() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="7.5" r="2" />
      <path d="M21 13.5a4.5 4.5 0 0 0-3.2-1.4" />
    </svg>
  );
}

function IconFinanceiro() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.5 6 4.4 0 1.4-1.3 2.3-3 2.3s-3-1-3-2.3" />
    </svg>
  );
}

function IconRelatorios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

export default function NavLinks({ perfil, recolhido }: { perfil: PerfilUsuario; recolhido: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Painel Operacional', Icon: IconPainel, show: true },
    {
      href: '/empresas',
      label: 'Empresas Transportadoras',
      Icon: IconEmpresas,
      show: perfil === 'administrador' || perfil === 'analista',
    },
    {
      href: '/administracao',
      label: 'Administração',
      Icon: IconAdministracao,
      show: perfil === 'administrador',
    },
    {
      href: '/financeiro',
      label: 'Financeiro',
      Icon: IconFinanceiro,
      show: perfil === 'administrador' || perfil === 'gestor',
    },
    {
      href: '/relatorios',
      label: 'Relatórios',
      Icon: IconRelatorios,
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
                ? 'bg-base-100/20 text-base-100'
                : 'text-base-200 hover:bg-base-100/10 hover:text-base-100'
            }`}
          >
            {recolhido ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-md">
                <item.Icon />
              </span>
            ) : (
              <>
                <item.Icon />
                {item.label}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

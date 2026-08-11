import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';
import NavLinks from './NavLinks';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const perfil = profile?.perfil ?? 'analista';

  return (
    <div className="flex min-h-screen bg-base-950">
      <aside className="flex w-60 shrink-0 flex-col border-r border-base-700 bg-base-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 font-mono text-sm font-bold text-accent">
            W3
          </div>
          <div>
            <p className="text-sm font-semibold text-base-100 leading-tight">WV3</p>
            <p className="text-[11px] text-base-400 leading-tight">Controle de Serviço</p>
          </div>
        </div>

        <NavLinks perfil={perfil} />

        <div className="mt-auto border-t border-base-700 p-4">
          <p className="truncate text-sm text-base-100">{profile?.nome ?? user.email}</p>
          <p className="mb-3 truncate text-xs capitalize text-base-400">{perfil}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

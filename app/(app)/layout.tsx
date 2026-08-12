import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';

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
      <Sidebar perfil={perfil} nome={profile?.nome ?? user.email ?? ''} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

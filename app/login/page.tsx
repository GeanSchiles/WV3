'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro('Código ou senha inválidos. Verifique e tente novamente.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-wv3.png" alt="WV3" className="mx-auto mb-3 h-16 w-16 rounded-full" />
          <h1 className="text-lg font-semibold text-base-100">Organização WV3</h1>
          <p className="mt-1 text-sm text-base-300">Plataforma de controle de serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-4">
            <label className="label" htmlFor="email">E-mail / código de acesso</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              className="input"
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className="mb-5 text-right">
            <Link href="/esqueci-senha" className="text-xs text-accent hover:underline">
              Esqueci minha senha
            </Link>
          </div>

          {erro && (
            <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
          )}

          <button type="submit" disabled={carregando} className="btn-primary w-full">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-base-400">
          Acesso restrito. Usuários são cadastrados pelo Administrador da Organização.
        </p>
      </div>
    </div>
  );
}

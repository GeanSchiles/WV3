'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function EsqueciSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const redirectTo = `${window.location.origin}/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setCarregando(false);

    if (error) {
      setErro('Não foi possível enviar o e-mail: ' + error.message);
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-wv3.png" alt="WV3" className="mx-auto mb-3 h-16 w-16 rounded-full" />
          <h1 className="text-lg font-semibold text-base-100">Recuperar senha</h1>
          <p className="mt-1 text-sm text-base-300">
            Informe seu e-mail e enviaremos um link para redefinir a senha.
          </p>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="card p-6">
            <div className="mb-5">
              <label className="label" htmlFor="email">E-mail</label>
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

            {erro && (
              <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full">
              {carregando ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm text-base-100">
              Se esse e-mail estiver cadastrado, um link de recuperação foi enviado.
            </p>
            <p className="mt-2 text-xs text-base-400">
              Verifique também a caixa de spam. O link expira em algumas horas.
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-base-400">
          <Link href="/login" className="text-accent hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}

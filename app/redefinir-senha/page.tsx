'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaConteudo />
    </Suspense>
  );
}

function RedefinirSenhaConteudo() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [validando, setValidando] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function validarLink() {
      // Fluxo PKCE: o link de recuperação chega com ?code=...
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErro('Este link expirou ou já foi usado. Solicite um novo link de recuperação.');
          setValidando(false);
          return;
        }
        setLinkValido(true);
        setValidando(false);
        return;
      }

      // Fallback: alguns links antigos usam hash (#access_token=...&type=recovery)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setLinkValido(true);
      } else {
        setErro('Este link expirou ou é inválido. Solicite um novo link de recuperação.');
      }
      setValidando(false);
    }

    validarLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro('Não foi possível salvar a nova senha: ' + error.message);
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-wv3.png" alt="WV3" className="mx-auto mb-3 h-16 w-16 rounded-full" />
          <h1 className="text-lg font-semibold text-base-100">Definir nova senha</h1>
        </div>

        <div className="card p-6">
          {validando && <p className="text-center text-sm text-base-300">Validando link…</p>}

          {!validando && !linkValido && (
            <div className="text-center">
              <p className="text-sm text-danger">{erro}</p>
              <a href="/esqueci-senha" className="mt-4 inline-block text-sm text-accent hover:underline">
                Solicitar novo link
              </a>
            </div>
          )}

          {!validando && linkValido && !sucesso && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="label" htmlFor="senha">Nova senha</label>
                <input
                  id="senha"
                  type="password"
                  required
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="mb-5">
                <label className="label" htmlFor="confirmarSenha">Confirmar nova senha</label>
                <input
                  id="confirmarSenha"
                  type="password"
                  required
                  className="input"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>

              {erro && (
                <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
              )}

              <button type="submit" disabled={salvando} className="btn-primary w-full">
                {salvando ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          )}

          {sucesso && (
            <p className="text-center text-sm text-ok">
              Senha atualizada! Redirecionando para o painel…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

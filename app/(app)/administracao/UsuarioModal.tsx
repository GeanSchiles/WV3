'use client';

import { useState } from 'react';
import { Profile, PerfilUsuario } from '@/lib/types';

interface Props {
  usuario: Profile | null;
  empresas: { id: string; nome: string }[];
  empresasVinculadasIds: string[];
  onClose: () => void;
  onSalvo: () => void;
}

export default function UsuarioModal({ usuario, empresas, empresasVinculadasIds, onClose, onSalvo }: Props) {
  const editando = !!usuario;

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [cpf, setCpf] = useState(usuario?.cpf ?? '');
  const [telefone, setTelefone] = useState(usuario?.telefone ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [endereco, setEndereco] = useState(usuario?.endereco ?? '');
  const [funcao, setFuncao] = useState(usuario?.funcao ?? '');
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? 'analista');
  const [senha, setSenha] = useState('');
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<string[]>(empresasVinculadasIds);
  const [buscaEmpresa, setBuscaEmpresa] = useState('');

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const empresasFiltradas = empresas.filter((e) => e.nome.toLowerCase().includes(buscaEmpresa.toLowerCase()));

  function toggleEmpresa(id: string) {
    setEmpresasSelecionadas((prev) => {
      if (prev.includes(id)) return prev.filter((e) => e !== id);
      if (prev.length >= 50) {
        setErro('Limite de 50 empresas por analista atingido.');
        return prev;
      }
      setErro(null);
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome || !email) {
      setErro('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editando && !senha) {
      setErro('Defina uma senha inicial para o novo usuário.');
      return;
    }
    if (!editando && senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setSalvando(true);

    try {
      if (editando) {
        const res = await fetch('/api/usuarios', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: usuario!.id,
            nome,
            cpf,
            telefone,
            endereco,
            funcao,
            empresaIds: perfil === 'analista' ? empresasSelecionadas : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar.');
      } else {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            cpf,
            telefone,
            email,
            endereco,
            funcao,
            perfil,
            senha,
            empresaIds: perfil === 'analista' ? empresasSelecionadas : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar usuário.');
      }

      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-base-100">
            {editando ? 'Editar usuário' : 'Novo usuário'}
          </h2>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Perfil de acesso</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={editando}
                onClick={() => setPerfil('administrador')}
                className={`rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${
                  perfil === 'administrador'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-base-600 text-base-300'
                }`}
              >
                Administrador
              </button>
              <button
                type="button"
                disabled={editando}
                onClick={() => setPerfil('analista')}
                className={`rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${
                  perfil === 'analista' ? 'border-accent bg-accent/10 text-accent' : 'border-base-600 text-base-300'
                }`}
              >
                Analista
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="label">CPF</label>
              <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input disabled:opacity-60"
                value={email}
                disabled={editando}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Endereço</label>
            <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>

          <div>
            <label className="label">Função</label>
            <input className="input" value={funcao} onChange={(e) => setFuncao(e.target.value)} />
          </div>

          {!editando && (
            <div>
              <label className="label">Senha inicial</label>
              <input
                type="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-base-400">
                Repasse essa senha ao usuário. Ele pode trocá-la depois em "Esqueci minha senha".
              </p>
            </div>
          )}

          {perfil === 'analista' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Empresas de atendimento</p>
                <span className="text-xs text-base-400">{empresasSelecionadas.length} / 50</span>
              </div>
              <input
                className="input mb-2"
                placeholder="Buscar empresa"
                value={buscaEmpresa}
                onChange={(e) => setBuscaEmpresa(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto rounded-md border border-base-600 bg-base-800 p-2">
                {empresasFiltradas.length === 0 && (
                  <p className="px-2 py-2 text-xs text-base-400">Nenhuma empresa encontrada.</p>
                )}
                {empresasFiltradas.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-base-200 hover:bg-base-700"
                  >
                    <input
                      type="checkbox"
                      checked={empresasSelecionadas.includes(emp.id)}
                      onChange={() => toggleEmpresa(emp.id)}
                    />
                    {emp.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

          {erro && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

          <div className="flex justify-end gap-2 border-t border-base-700 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

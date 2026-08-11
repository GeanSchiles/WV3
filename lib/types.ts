export type PerfilUsuario = 'administrador' | 'analista' | 'gestor' | 'operacional';
export type TipoServico = 'viagem' | 'consulta' | 'escolta' | 'isca';
export type StatusServico = 'aguardando' | 'concluido' | 'cancelada';
export type TipoMotorista = 'frota' | 'terceiros' | 'agregado' | 'motorista_px';
export type OrigemSolicitacao = 'transportadora' | 'organizacao';
export type TipoRastreamento = 'rastreada' | 'nao_rastreada';

export interface Profile {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string;
  endereco: string | null;
  funcao: string | null;
  perfil: PerfilUsuario;
  empresa_transportadora_id: string | null;
}

export interface EmpresaTransportadora {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  responsavel: string | null;
  telefone_responsavel: string | null;
  gerenciadora_risco: string | null;
  created_at: string;
}

export interface Solicitacao {
  id: string;
  tipo: TipoServico;
  empresa_id: string;
  empresa?: { nome: string };
  cliente_final: string | null;
  data_coleta: string | null;
  data_entrega: string | null;
  local_coleta: string | null;
  local_entrega: string | null;
  produto: string | null;
  valor_carga: number | null;
  tipo_motorista: TipoMotorista | null;
  status: StatusServico;
  carga_rastreada: TipoRastreamento | null;
  origem: OrigemSolicitacao;
  numero_sm: string | null;
  viagem_liberada: boolean | null;
  consulta_aprovada: boolean | null;
  consulta_motivo: string | null;
  escolta_empresa: string | null;
  isca_numero: string | null;
  motivo_cancelamento: string | null;
  created_at: string;
}

export const TIPO_SERVICO_LABEL: Record<TipoServico, string> = {
  viagem: 'Nova Viagem (Rastreio)',
  consulta: 'Nova Consulta',
  escolta: 'Escolta',
  isca: 'Isca',
};

export const STATUS_LABEL: Record<StatusServico, string> = {
  aguardando: 'Aguardando',
  concluido: 'Concluído',
  cancelada: 'Cancelada',
};

export const TIPO_MOTORISTA_LABEL: Record<TipoMotorista, string> = {
  frota: 'Frota',
  terceiros: 'Terceiros',
  agregado: 'Agregado',
  motorista_px: 'Motorista PX',
};

// Documentos exigidos conforme tipo de motorista (regra do item 8.1 do projeto)
export function anexosObrigatoriosViagem(tipo: TipoMotorista | null): string[] {
  if (!tipo || tipo === 'frota') return [];
  return ['CNH', 'Documento do Cavalo', 'Documento da Carreta', 'ANTT'];
}

export const ANEXOS_CONSULTA = [
  'CNH',
  'Documento do Cavalo',
  'Documento da Carreta',
  'ANTT',
  'Comprovante de Residência',
];

export interface RefAtenuacao {
  id: number;
  espessura_mm: number;
  frequencia_hz: number;
  d_ref_db: number;
}

export interface ConstantesVdiPerdaCarga {
  id: number;
  espessura_mm: number;
  a1: number;
  a2: number;
  b1: number;
  b2: number;
}

export interface PrecoUnitarioCaixa {
  id: number;
  descricao: string;
  tipo: string;
  valor: number;
}

export interface PrecoUnitarioBaffle {
  id: number;
  descricao: string;
  tipo: string;
  valor: number;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  // password_hash omitted for frontend mock security
}

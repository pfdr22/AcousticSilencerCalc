import { 
  RefAtenuacao, 
  ConstantesVdiPerdaCarga, 
  PrecoUnitarioCaixa, 
  PrecoUnitarioBaffle, 
  User 
} from '../types/schema';

export const mockRefAtenuacao: RefAtenuacao[] = [
  { id: 1, espessura_mm: 100, frequencia_hz: 63, d_ref_db: 4 },
  { id: 2, espessura_mm: 100, frequencia_hz: 125, d_ref_db: 8 },
  { id: 3, espessura_mm: 100, frequencia_hz: 250, d_ref_db: 14 },
  { id: 4, espessura_mm: 200, frequencia_hz: 63, d_ref_db: 6 },
  { id: 5, espessura_mm: 200, frequencia_hz: 125, d_ref_db: 12 },
];

export const mockConstantesVdi: ConstantesVdiPerdaCarga[] = [
  { id: 1, espessura_mm: 100, a1: 0.5, a2: 0.1, b1: 1.2, b2: 0.8 },
  { id: 2, espessura_mm: 200, a1: 0.6, a2: 0.15, b1: 1.3, b2: 0.9 },
];

export const mockPrecosCaixa: PrecoUnitarioCaixa[] = [
  { id: 1, descricao: "Chapa Galvanizada 0.8mm", tipo: "material", valor: 15.50 },
  { id: 2, descricao: "Mão de Obra Montagem", tipo: "servico", valor: 45.00 },
];

export const mockPrecosBaffle: PrecoUnitarioBaffle[] = [
  { id: 1, descricao: "Lã Mineral 50mm", tipo: "isolamento", valor: 8.20 },
  { id: 2, descricao: "Perfil Perfurado", tipo: "estrutura", valor: 12.40 },
];

export const mockUsers: User[] = [
  { id: 1, username: "admin", role: "admin" },
  { id: 2, username: "eng_civil", role: "user" },
];

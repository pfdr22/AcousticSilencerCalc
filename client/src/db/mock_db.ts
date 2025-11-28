import { 
  RefAtenuacao, 
  ConstantesVdiPerdaCarga, 
  PrecoUnitarioCaixa, 
  PrecoUnitarioBaffle, 
  User 
} from '../types/schema';

// Updated Mock Data based on the Excel Image for D_ref (CLA)
// 100mm: 2, 4, 11, 28, 43, 50, 38, 25
// 200mm: 5, 7, 16, 28, 35, 38, 23, 13
// 300mm: 2, 8, 16, 23, 28, 24, 16, 11

export const mockRefAtenuacao: RefAtenuacao[] = [
  // 100mm
  { id: 1, espessura_mm: 100, frequencia_hz: 63, d_ref_db: 2 },
  { id: 2, espessura_mm: 100, frequencia_hz: 125, d_ref_db: 4 },
  { id: 3, espessura_mm: 100, frequencia_hz: 250, d_ref_db: 11 },
  { id: 4, espessura_mm: 100, frequencia_hz: 500, d_ref_db: 28 },
  { id: 5, espessura_mm: 100, frequencia_hz: 1000, d_ref_db: 43 },
  { id: 6, espessura_mm: 100, frequencia_hz: 2000, d_ref_db: 50 },
  { id: 7, espessura_mm: 100, frequencia_hz: 4000, d_ref_db: 38 },
  { id: 8, espessura_mm: 100, frequencia_hz: 8000, d_ref_db: 25 },

  // 200mm
  { id: 9, espessura_mm: 200, frequencia_hz: 63, d_ref_db: 5 },
  { id: 10, espessura_mm: 200, frequencia_hz: 125, d_ref_db: 7 },
  { id: 11, espessura_mm: 200, frequencia_hz: 250, d_ref_db: 16 },
  { id: 12, espessura_mm: 200, frequencia_hz: 500, d_ref_db: 28 },
  { id: 13, espessura_mm: 200, frequencia_hz: 1000, d_ref_db: 35 },
  { id: 14, espessura_mm: 200, frequencia_hz: 2000, d_ref_db: 38 },
  { id: 15, espessura_mm: 200, frequencia_hz: 4000, d_ref_db: 23 },
  { id: 16, espessura_mm: 200, frequencia_hz: 8000, d_ref_db: 13 },

  // 300mm
  { id: 17, espessura_mm: 300, frequencia_hz: 63, d_ref_db: 2 },
  { id: 18, espessura_mm: 300, frequencia_hz: 125, d_ref_db: 8 },
  { id: 19, espessura_mm: 300, frequencia_hz: 250, d_ref_db: 16 },
  { id: 20, espessura_mm: 300, frequencia_hz: 500, d_ref_db: 23 },
  { id: 21, espessura_mm: 300, frequencia_hz: 1000, d_ref_db: 28 },
  { id: 22, espessura_mm: 300, frequencia_hz: 2000, d_ref_db: 24 },
  { id: 23, espessura_mm: 300, frequencia_hz: 4000, d_ref_db: 16 },
  { id: 24, espessura_mm: 300, frequencia_hz: 8000, d_ref_db: 11 },
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

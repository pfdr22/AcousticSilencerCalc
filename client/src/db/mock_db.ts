import { 
  RefAtenuacao, 
  ConstantesVdiPerdaCarga, 
  PrecoUnitarioCaixa, 
  PrecoUnitarioBaffle, 
  User 
} from '../types/schema';

// Mock Data for D_ref (CLA)
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

// Updated VDI 2081 Constants (Modified for custom polynomial formula)
export const mockConstantesVdi: ConstantesVdiPerdaCarga[] = [
  { id: 1, espessura_mm: 100, a1: 0.235, a2: 0.017, b1: 0.012, b2: -2.70 }, // Using positive b1 as requested example
  { id: 2, espessura_mm: 200, a1: 0.255, a2: 0.015, b1: 0.012, b2: -2.91 },
  { id: 3, espessura_mm: 300, a1: 0.294, a2: 0.0167, b1: 0.012, b2: -2.95 },
];

export const mockPrecosCaixa: PrecoUnitarioCaixa[] = [
  { id: 1, descricao: "Chapa 0.8mm (m2)", tipo: "material", valor: 7.50 },
  { id: 2, descricao: "Perfil P30 (m.l)", tipo: "material", valor: 1.30 },
  { id: 3, descricao: "Cantos metálicos (un)", tipo: "material", valor: 0.15 },
  { id: 4, descricao: "Rebites (un)", tipo: "material", valor: 0.02 },
  { id: 5, descricao: "Palete + Embalagem (un)", tipo: "material", valor: 4.50 },
  { id: 6, descricao: "Mão de obra caixa (€/m2)", tipo: "servico", valor: 4.50 },
  { id: 7, descricao: "Custos indiretos (%)", tipo: "fator", valor: 35 },
  { id: 8, descricao: "Lucro (%)", tipo: "fator", valor: 15 },
];

export const mockPrecosBaffle: PrecoUnitarioBaffle[] = [
  { id: 1, descricao: "Chapa 0.6mm (m2)", tipo: "material", valor: 5.50 },
  { id: 2, descricao: "Lã Knauf (m2)", tipo: "material", valor: 6.50 },
  { id: 3, descricao: "Lã Knauf s/ pelicula (m2)", tipo: "material", valor: 4.00 },
  { id: 4, descricao: "Mão de obra baffles (€/m2)", tipo: "servico", valor: 5.00 },
  { id: 5, descricao: "Mão de obra baffles lateral (€/m2)", tipo: "servico", valor: 5.00 },
  { id: 6, descricao: "Custos indiretos (%)", tipo: "fator", valor: 35 },
  { id: 7, descricao: "Lucro (%)", tipo: "fator", valor: 15 },
];

export const mockUsers: User[] = [
  { id: 1, username: "admin", role: "admin" },
  { id: 2, username: "eng_civil", role: "user" },
];

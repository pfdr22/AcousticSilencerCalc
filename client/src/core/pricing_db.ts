
export const PRICING_DB = {
  materials: {
    'chapa_08_mm_m2': 10.0,
    'chapa_06_mm_m2': 8.0,
    'la_knauf_m2': 9.0,
    'la_knauf_sem_pelicula_m2': 6.0,
    'perfil_p30_ml': 1.8,
    'cantos_metalicos_un': 0.25,
    'rebites_un': 0.04,
    'palete_embalagem_un': 6.5,
  },
  labor: {
    'mao_obra_caixa_m2': 6.0, 
    'mao_obra_baffles_m2': 10.0,
  },
  factors: {
    'custos_indiretos': 0.40,
    'lucro': 0.20
  }
};

export type PricingData = typeof PRICING_DB;

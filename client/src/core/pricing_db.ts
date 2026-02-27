
export const PRICING_DB = {
  materials: {
    'chapa_08_mm_m2': 7.5,
    'chapa_06_mm_m2': 5.5,
    'la_knauf_m2': 6.5,
    'la_knauf_sem_pelicula_m2': 4.0,
    'perfil_p30_ml': 1.3,
    'cantos_metalicos_un': 0.15,
    'rebites_un': 0.02,
    'palete_embalagem_un': 4.5,
  },
  labor: {
    'mao_obra_caixa_m2': 20.55, 
    'mao_obra_baffles_m2': 7.0,
  },
  factors: {
    'custos_indiretos': 0.35,
    'lucro': 0.15
  }
};

export type PricingData = typeof PRICING_DB;

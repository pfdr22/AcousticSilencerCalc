
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
    // These keys are kept for compatibility/admin panel but might be ignored by new logic 
    // if the logic uses hardcoded dynamic formulas as per prompt.
    // However, since the prompt says "Preços unitários (constantes ou configuráveis...)", 
    // and then lists dynamic functions separately, I'll leave these here but maybe unused or 
    // I could map the coefficients to these if possible. 
    // Given the strict instruction "Substituir 100% da lógica", I will use the formulas.
    'mao_obra_caixa_m2': 4.5, // Used as factor in formula?
    'mao_obra_baffles_m2': 8.0, // Unused/Legacy
  },
  factors: {
    'custos_indiretos': 0.35,
    'lucro': 0.15
  }
};

export type PricingData = typeof PRICING_DB;

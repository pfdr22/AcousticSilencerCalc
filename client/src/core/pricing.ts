import { PricingData } from "./pricing_db";

interface BoxDimensions {
  width_mm: number;
  height_mm: number;
  depth_mm: number;
}

export interface FinalPriceResult {
  preco_final: number;
  custo_caixa: {
    subtotal: number;
    custos_indiretos: number;
    lucro: number;
    preco_final: number;
  };
  custo_baffles: {
    subtotal: number;
    custos_indiretos: number;
    lucro: number;
    preco_final: number;
  };
  subtotal_direto: number;
  custos_indiretos_valor: number;
  margem_lucro_valor: number;
}

export function calcular_preco_final(
  dimensoes: BoxDimensions,
  n_baffles: number,
  espessura_baffle_mm: number,
  pricing: PricingData
): FinalPriceResult {
  
  const LARGURA = dimensoes.width_mm;
  const ALTURA = dimensoes.height_mm;
  const PROFUNDIDADE = dimensoes.depth_mm;
  const N_BAFFLES = n_baffles;
  const ESPESSURA_BAFFLES = espessura_baffle_mm;

  const PU_ch08 = pricing.materials.chapa_08_mm_m2;
  const PU_ch06 = pricing.materials.chapa_06_mm_m2;
  const PU_la = pricing.materials.la_knauf_m2;
  const PU_la_np = pricing.materials.la_knauf_sem_pelicula_m2;
  const PU_P30 = pricing.materials.perfil_p30_ml;
  const PU_cantos = pricing.materials.cantos_metalicos_un;
  const PU_rebite = pricing.materials.rebites_un;
  const PU_palete = pricing.materials.palete_embalagem_un;
  
  const CUSTOS_INDIRETOS_PCT = pricing.factors.custos_indiretos;
  const LUCRO_PCT = pricing.factors.lucro;

  // =================================================================================
  // CÁLCULO DE MÃO DE OBRA (DINÂMICO)
  // =================================================================================
  
  // mo_caixa = ((2*PROFUNDIDADE*(ALTURA+35) + 2*PROFUNDIDADE*(LARGURA+35))/1_000_000)*4.5 + LARGURA*ALTURA*PROFUNDIDADE/1_000_000_000*2
  const term1_mo_caixa = ((2 * PROFUNDIDADE * (ALTURA + 35) + 2 * PROFUNDIDADE * (LARGURA + 35)) / 1000000) * 4.5;
  const term2_mo_caixa = (LARGURA * ALTURA * PROFUNDIDADE / 1000000000) * 2;
  const mo_caixa = term1_mo_caixa + term2_mo_caixa;

  // mo_baffles = ((ALTURA*2+PROFUNDIDADE*2)/1000*1.5)+0.5*((ALTURA*PROFUNDIDADE/1_000_000)*ESPESSURA_BAFFLES/100*2)
  const term1_mo_baffles = ((ALTURA * 2 + PROFUNDIDADE * 2) / 1000) * 1.5;
  const term2_mo_baffles = 0.5 * ((ALTURA * PROFUNDIDADE / 1000000) * (ESPESSURA_BAFFLES / 100) * 2);
  const mo_baffles = term1_mo_baffles + term2_mo_baffles;


  // =================================================================================
  // 1. Cálculo BAFFLES (Cálculo Atenuador BAFFLE)
  // =================================================================================

  // Quantidades
  // area_ch06_baf = ((2*ALTURA*(ESPESSURA_BAFFLES+90)+2*PROFUNDIDADE*(ESPESSURA_BAFFLES+50))/1_000_000 * N_BAFFLES) + (2*PROFUNDIDADE*100/1_000_000) * (N_BAFFLES se ALTURA>1250 senão 0)
  const term1_ch06_baf = ((2 * ALTURA * (ESPESSURA_BAFFLES + 90) + 2 * PROFUNDIDADE * (ESPESSURA_BAFFLES + 50)) / 1000000) * N_BAFFLES;
  const term2_ch06_baf = (2 * PROFUNDIDADE * 100 / 1000000) * (ALTURA > 1250 ? N_BAFFLES : 0);
  const area_ch06_baf = term1_ch06_baf + term2_ch06_baf;

  // area_la_baf = ALTURA*PROFUNDIDADE/1_000_000 * 2 * N_BAFFLES
  const area_la_baf = (ALTURA * PROFUNDIDADE / 1000000) * 2 * N_BAFFLES;

  // area_la_sem_pel_baf = ALTURA*PROFUNDIDADE/1_000_000 * N_BAFFLES * ((ESPESSURA_BAFFLES-100)/50)
  const area_la_sem_pel_baf = (ALTURA * PROFUNDIDADE / 1000000) * N_BAFFLES * ((ESPESSURA_BAFFLES - 100) / 50);

  // qtd_rebites_baf = N_BAFFLES * 12
  const qtd_rebites_baf = N_BAFFLES * 12;

  // custo_mo_baffles_baf = mo_baffles * N_BAFFLES
  const custo_mo_baffles_baf = mo_baffles * N_BAFFLES;

  // Custos BAFFLES
  const custo_chapa_06_baf = area_ch06_baf * PU_ch06;
  const custo_la_baf = area_la_baf * PU_la;
  const custo_la_sem_pel_baf = area_la_sem_pel_baf * PU_la_np;
  const custo_rebites_baf = qtd_rebites_baf * PU_rebite;
  
  const Subtotal_BAFFLES = custo_chapa_06_baf + custo_la_baf + custo_la_sem_pel_baf + custo_rebites_baf + custo_mo_baffles_baf;

  const Custos_indiretos_BAFFLES = Subtotal_BAFFLES * CUSTOS_INDIRETOS_PCT;
  const Lucro_BAFFLES = (Subtotal_BAFFLES + Custos_indiretos_BAFFLES) * LUCRO_PCT;
  const Preco_BAFFLES = Subtotal_BAFFLES + Custos_indiretos_BAFFLES + Lucro_BAFFLES;


  // =================================================================================
  // 2. Cálculo CAIXA
  // =================================================================================

  // Quantidades
  // area_ch08_caixa = ((2*PROFUNDIDADE*(ALTURA+35) + 2*PROFUNDIDADE*(LARGURA+35))/1_000_000)
  const area_ch08_caixa = ((2 * PROFUNDIDADE * (ALTURA + 35) + 2 * PROFUNDIDADE * (LARGURA + 35)) / 1000000);

  // compr_P30_caixa = 4*(LARGURA+ALTURA)/1000
  const compr_P30_caixa = 4 * (LARGURA + ALTURA) / 1000;

  // qtd_cantos_caixa = 8
  const qtd_cantos_caixa = 8;

  // qtd_rebites_caixa = N_BAFFLES * 12
  const qtd_rebites_caixa = N_BAFFLES * 12;

  // qtd_palete_caixa = 1
  const qtd_palete_caixa = 1;

  // custo_mo_caixa = mo_caixa (resultado da fórmula acima)
  const custo_mo_caixa_caixa = mo_caixa;

  // Custos CAIXA
  const custo_chapa_08_caixa = area_ch08_caixa * PU_ch08;
  const custo_P30_caixa = compr_P30_caixa * PU_P30;
  const custo_cantos_caixa = qtd_cantos_caixa * PU_cantos;
  const custo_rebites_caixa = qtd_rebites_caixa * PU_rebite;
  const custo_palete_caixa = qtd_palete_caixa * PU_palete;

  const Subtotal_CAIXA = custo_chapa_08_caixa + custo_P30_caixa + custo_cantos_caixa + custo_rebites_caixa + custo_palete_caixa + custo_mo_caixa_caixa;

  const Custos_indiretos_CAIXA = Subtotal_CAIXA * CUSTOS_INDIRETOS_PCT;
  const Lucro_CAIXA = (Subtotal_CAIXA + Custos_indiretos_CAIXA) * LUCRO_PCT;
  const Preco_CAIXA = Subtotal_CAIXA + Custos_indiretos_CAIXA + Lucro_CAIXA;


  // =================================================================================
  // 3. Preço Final
  // =================================================================================
  
  const Preco_FINAL = Preco_BAFFLES + Preco_CAIXA;


  return {
    preco_final: Number(Preco_FINAL.toFixed(2)),
    custo_caixa: {
      subtotal: Number(Subtotal_CAIXA.toFixed(2)),
      custos_indiretos: Number(Custos_indiretos_CAIXA.toFixed(2)),
      lucro: Number(Lucro_CAIXA.toFixed(2)),
      preco_final: Number(Preco_CAIXA.toFixed(2))
    },
    custo_baffles: {
      subtotal: Number(Subtotal_BAFFLES.toFixed(2)),
      custos_indiretos: Number(Custos_indiretos_BAFFLES.toFixed(2)),
      lucro: Number(Lucro_BAFFLES.toFixed(2)),
      preco_final: Number(Preco_BAFFLES.toFixed(2))
    },
    subtotal_direto: Number((Subtotal_BAFFLES + Subtotal_CAIXA).toFixed(2)),
    custos_indiretos_valor: Number((Custos_indiretos_BAFFLES + Custos_indiretos_CAIXA).toFixed(2)),
    margem_lucro_valor: Number((Lucro_BAFFLES + Lucro_CAIXA).toFixed(2))
  };
}

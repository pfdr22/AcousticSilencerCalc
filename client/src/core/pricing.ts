import { PricingData } from "./pricing_db";

interface BoxDimensions {
  width_mm: number;
  height_mm: number;
  depth_mm: number;
}

export interface FinalPriceResult {
  preco_final: number;
  // Detailed breakdown for UI if needed, though the prompt focuses on the final price.
  // I'll include the main components as requested by the prompt's "Show only..." but the calculator usually shows details.
  // The prompt says "devolve o preco_final_eur" but also "Subtotal_ATEN_BAFFLE", etc.
  // I'll return a structured object so the UI can still show details.
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
  subtotal_direto: number; // Total direct costs
  custos_indiretos_valor: number; // Total indirect
  margem_lucro_valor: number; // Total profit
}

export function calcular_preco_final(
  dimensoes: BoxDimensions,
  n_baffles: number,
  espessura_baffle_mm: number,
  pricing: PricingData
): FinalPriceResult {
  // Mapeamento de variáveis conforme solicitado:
  const B2 = dimensoes.width_mm;
  const B4 = dimensoes.height_mm;
  const B6 = dimensoes.depth_mm;
  const B9 = n_baffles;
  const B11 = espessura_baffle_mm;

  const PU = {
    chapa_08: pricing.materials.chapa_08_mm_m2,
    chapa_06: pricing.materials.chapa_06_mm_m2,
    la_knauf: pricing.materials.la_knauf_m2,
    la_knauf_sp: pricing.materials.la_knauf_sem_pelicula_m2,
    perfil_p30: pricing.materials.perfil_p30_ml,
    cantos: pricing.materials.cantos_metalicos_un,
    rebites: pricing.materials.rebites_un,
    palete: pricing.materials.palete_embalagem_un,
    mo_caixa: pricing.labor.mao_obra_caixa_m2,
    mo_baffles: pricing.labor.mao_obra_baffles_m2,
    indiretos: pricing.factors.custos_indiretos,
    lucro: pricing.factors.lucro
  };

  // ==========================================
  // 2.1. Cálculo Atenuador BAFFLE
  // ==========================================

  // Quantidades
  const area_chapa_08_baffle_m2 = ((2 * B6 * (B4 + 35) + 2 * B6 * (B2 + 35)) / 1000000) * 1.2;
  
  // Formula: ((2*B4*(B11+90) + 2*B6*(B11+50))/1_000_000 * B9) + (2*B6*100/1_000_000) * (B9 se B4>1250 senão 0)
  const term1_chapa06 = ((2 * B4 * (B11 + 90) + 2 * B6 * (B11 + 50)) / 1000000) * B9;
  const term2_chapa06 = (2 * B6 * 100 / 1000000) * (B4 > 1250 ? B9 : 0);
  const area_chapa_06_baffle_m2 = term1_chapa06 + term2_chapa06;

  const area_la_baffle_m2 = (B4 * B6 / 1000000) * 2 * B9;
  
  const area_la_sem_pel_baffle_m2 = (B4 * B6 / 1000000) * B9 * ((B11 - 100) / 50);

  // comprimento_P30_baffle_ml = 4*(B2+B4)/1000 (Wait, is this for baffle? The text says "comprimento_P30_baffle_ml = 4*(B2+B4)/1000". 
  // But usually P30 is for the box connection. The text lists it under "2.1 Cálculo Atenuador BAFFLE". 
  // However, "custo_P30_baffle = 0" in the cost section below. So it calculates qty but cost is 0.
  // I will calculate it but cost is 0.)
  const comprimento_P30_baffle_ml = 4 * (B2 + B4) / 1000;

  const qtd_cantos_baffle = 8;
  const qtd_rebites_baffle = B9 * 12;
  const qtd_palete_baffle = 0;

  const mao_obra_caixa_baffle_m2 = PU.mo_caixa * area_chapa_08_baffle_m2; // This variable name in prompt is "mao_obra_caixa_baffle_m2" but it equals price * area? 
  // Prompt says: "mao_obra_caixa_baffle_m2 = preco_mo_caixa * area_chapa_08_baffle_m2"
  // And later: "custo_mo_caixa_baffle = mao_obra_caixa_baffle_m2 (já é custo)"
  // So yes, this variable holds the COST.
  const custo_mo_caixa_baffle = mao_obra_caixa_baffle_m2;

  const mao_obra_baffles_baffle = PU.mo_baffles * B9;
  const custo_mo_baffles_baffle = mao_obra_baffles_baffle;

  // Custos diretos (Baffle)
  const custo_chapa_08_baffle = area_chapa_08_baffle_m2 * PU.chapa_08; // Wait, usually baffle doesn't use chapa 0.8 for itself, but the prompt says so.
  // Prompt says: "custo_chapa_08_baffle = area_chapa_08_baffle_m2 * PU['Chapa 0.8mm (m2)']"
  // It seems the prompt attributes some box costs to the "Atenuador BAFFLE" calculation block?
  // The excel screenshot shows "Cálculo Atenuador BAFFLE" and "CAIXA".
  // Let's strictly follow the formulas.
  
  const custo_chapa_06_baffle = area_chapa_06_baffle_m2 * PU.chapa_06;
  const custo_la_baffle = area_la_baffle_m2 * PU.la_knauf;
  const custo_la_sem_pel_baffle = area_la_sem_pel_baffle_m2 * PU.la_knauf_sp;
  const custo_P30_baffle = 0;
  const custo_cantos_baffle = 0;
  const custo_rebites_baffle = qtd_rebites_baffle * PU.rebites;
  const custo_palete_baffle = 0;

  const Subtotal_ATEN_BAFFLE = 
    custo_chapa_08_baffle + 
    custo_chapa_06_baffle + 
    custo_la_baffle + 
    custo_la_sem_pel_baffle + 
    custo_P30_baffle + 
    custo_cantos_baffle + 
    custo_rebites_baffle + 
    custo_palete_baffle + 
    custo_mo_caixa_baffle + 
    custo_mo_baffles_baffle;

  const Custos_indiretos_ATEN_BAFFLE = Subtotal_ATEN_BAFFLE * PU.indiretos;
  const Lucro_ATEN_BAFFLE = (Subtotal_ATEN_BAFFLE + Custos_indiretos_ATEN_BAFFLE) * PU.lucro;
  const Preco_ATEN_BAFFLE = Subtotal_ATEN_BAFFLE + Custos_indiretos_ATEN_BAFFLE + Lucro_ATEN_BAFFLE;


  // ==========================================
  // 2.2. Cálculo CAIXA
  // ==========================================

  // Quantidades
  const area_chapa_08_caixa_m2 = ((2 * B6 * (B4 + 35) + 2 * B6 * (B2 + 35)) / 1000000);
  
  // Formula: ((2*B4*(B11+95) + 2*B6*(B11+50))/1_000_000 * B9) + (2 * B4 * 295 / 1_000_000) * (B9 se B6>1000 senão 0) + (2 * B6 * 250 / 1_000_000) * (B9 se B4>1000 senão 0)
  const term1_caixa_06 = ((2 * B4 * (B11 + 95) + 2 * B6 * (B11 + 50)) / 1000000) * B9;
  const term2_caixa_06 = (2 * B4 * 295 / 1000000) * (B6 > 1000 ? B9 : 0);
  const term3_caixa_06 = (2 * B6 * 250 / 1000000) * (B4 > 1000 ? B9 : 0);
  const area_chapa_06_caixa_m2 = term1_caixa_06 + term2_caixa_06 + term3_caixa_06;

  const area_la_caixa_m2 = (B6 * B4 / 1000000) * B9 * (B11 / 50);
  
  const comprimento_P30_caixa_ml = 4 * (B2 + B4) / 1000;
  
  const qtd_cantos_caixa = 8;
  const qtd_rebites_caixa = B9 * 12;
  const qtd_palete_caixa = 1;

  const mao_obra_caixa_caixa = PU.mo_caixa; // "já custo" - Wait. "mao_obra_caixa_caixa = preco_mo_caixa". Is it a fixed cost?
  // The prompt says: "‘Mão de obra caixa (€/m2)’ – default calculated... but in software just editable value (ex: 9.63)."
  // But here "mao_obra_caixa_caixa = preco_mo_caixa (já custo)".
  // Usually "Preço MO Caixa" is per m2. 
  // In "Cálculo Atenuador BAFFLE": mao_obra_caixa_baffle_m2 = preco_mo_caixa * area_chapa_08_baffle_m2.
  // In "Cálculo CAIXA": "mao_obra_caixa_caixa = preco_mo_caixa". This implies it treats the unit price as a fixed cost per box?
  // OR is it "preco_mo_caixa * area..."?
  // Looking at the Excel image (row 46): "Mão de obra - caixa" = "=B66". B66 is "Mão de obra caixa (€/m2)".
  // It seems in the "CAIXA" calculation, it just takes the value directly? That's odd if it's €/m2.
  // BUT, look at "Cálculo Atenuador BAFFLE" row 28: "Mão de obra - caixa" = "=B66*B21". B21 is Area Chapa 0.8mm.
  // So in Baffle calc, it multiplies by area.
  // In Box calc, row 46, it says "=B66". Just B66.
  // If B66 is ~9.63, then Labor for Box is 9.63 total? 
  // Maybe the Excel has a specific logic.
  // The prompt text says: "mao_obra_caixa_caixa = preco_mo_caixa (já custo)".
  // I will follow the prompt strictly. If it says it equals the price, I'll set it to the price.
  const custo_mo_caixa_caixa = PU.mo_caixa;

  // "mao_obra_baffles_caixa = preco_mo_baffles * area_chapa_06_caixa_m2"
  const custo_mo_baffles_caixa = PU.mo_baffles * area_chapa_06_caixa_m2;

  // Custos diretos (Caixa)
  const custo_chapa_08_caixa = area_chapa_08_caixa_m2 * PU.chapa_08;
  const custo_chapa_06_caixa = area_chapa_06_caixa_m2 * PU.chapa_06;
  const custo_la_caixa = area_la_caixa_m2 * PU.la_knauf;
  const custo_P30_caixa = comprimento_P30_caixa_ml * PU.perfil_p30;
  const custo_cantos_caixa = qtd_cantos_caixa * PU.cantos;
  const custo_rebites_caixa = qtd_rebites_caixa * PU.rebites;
  const custo_palete_caixa = qtd_palete_caixa * PU.palete;
  
  const Subtotal_CAIXA = 
    custo_chapa_08_caixa + 
    custo_chapa_06_caixa + 
    custo_la_caixa + 
    custo_P30_caixa + 
    custo_cantos_caixa + 
    custo_rebites_caixa + 
    custo_palete_caixa + 
    custo_mo_caixa_caixa + 
    custo_mo_baffles_caixa;

  const Custos_indiretos_CAIXA = Subtotal_CAIXA * PU.indiretos;
  const Lucro_CAIXA = (Subtotal_CAIXA + Custos_indiretos_CAIXA) * PU.lucro;
  const Preco_CAIXA = Subtotal_CAIXA + Custos_indiretos_CAIXA + Lucro_CAIXA;

  // ==========================================
  // 2.3. Preço final
  // ==========================================
  const preco_final = Preco_ATEN_BAFFLE + Preco_CAIXA;

  return {
    preco_final: Number(preco_final.toFixed(2)),
    custo_caixa: {
      subtotal: Number(Subtotal_CAIXA.toFixed(2)),
      custos_indiretos: Number(Custos_indiretos_CAIXA.toFixed(2)),
      lucro: Number(Lucro_CAIXA.toFixed(2)),
      preco_final: Number(Preco_CAIXA.toFixed(2))
    },
    custo_baffles: {
      subtotal: Number(Subtotal_ATEN_BAFFLE.toFixed(2)),
      custos_indiretos: Number(Custos_indiretos_ATEN_BAFFLE.toFixed(2)),
      lucro: Number(Lucro_ATEN_BAFFLE.toFixed(2)),
      preco_final: Number(Preco_ATEN_BAFFLE.toFixed(2))
    },
    subtotal_direto: Number((Subtotal_ATEN_BAFFLE + Subtotal_CAIXA).toFixed(2)),
    custos_indiretos_valor: Number((Custos_indiretos_ATEN_BAFFLE + Custos_indiretos_CAIXA).toFixed(2)),
    margem_lucro_valor: Number((Lucro_ATEN_BAFFLE + Lucro_CAIXA).toFixed(2))
  };
}

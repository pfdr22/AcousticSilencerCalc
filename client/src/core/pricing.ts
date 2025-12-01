import { PrecoUnitarioCaixa } from "../types/schema";

interface BoxDimensions {
  width_mm: number;
  height_mm: number;
  depth_mm: number;
}

export interface PriceComponentResult {
  custo_materiais: number;
  custo_mao_de_obra: number;
  subtotal: number;
  custos_indiretos_valor: number;
  lucro_valor: number;
  preco_final: number;
  detalhes?: any;
}

export interface FinalPriceResult {
  preco_atenuador_baffle: PriceComponentResult;
  preco_caixa: PriceComponentResult;
  preco_total: number;
}

// Helper to get unit price
const PU = (list: PrecoUnitarioCaixa[], desc: string): number => {
  const item = list.find(i => i.descricao === desc);
  return item ? item.valor : 0;
};

/**
 * 2.1 Cálculo Atenuador BAFFLE
 */
function calcular_atenuador_baffle(
  dim: BoxDimensions,
  n_baffles: number,
  espessura_mm: number,
  precos: PrecoUnitarioCaixa[]
): PriceComponentResult {
  const B2 = dim.width_mm;
  const B4 = dim.height_mm;
  const B6 = dim.depth_mm;
  const B9 = n_baffles;
  const B11 = espessura_mm;

  // Quantities
  const area_chapa_08_baffle_m2 = ((2*B6*(B4+35) + 2*B6*(B2+35))/1_000_000) * 1.2;
  
  const term1 = (2*B4*(B11+90) + 2*B6*(B11+50))/1_000_000 * B9;
  const term2 = (2*B6*100/1_000_000) * (B4 > 1250 ? B9 : 0);
  const area_chapa_06_baffle_m2 = term1 + term2;

  const area_la_baffle_m2 = B4*B6/1_000_000 * 2 * B9;
  const area_la_sem_pel_baffle_m2 = B4*B6/1_000_000 * B9 * ((B11-100)/50);

  // const comprimento_P30_baffle_ml = 4*(B2+B4)/1000; // Not used in cost calculation according to instructions
  // const qtd_cantos_baffle = 8; // Not used
  const qtd_rebites_baffle = B9 * 12;
  // const qtd_palete_baffle = 0; // Not used

  const mao_obra_caixa_baffle_m2 = PU(precos, 'Mão de obra caixa (€/m2)') * area_chapa_08_baffle_m2;
  const mao_obra_baffles_baffle = PU(precos, 'Mão de obra baffles (€/m2)') * B9;

  // Direct Costs
  const custo_chapa_08_baffle = area_chapa_08_baffle_m2 * PU(precos, 'Chapa 0.8mm (m2)');
  const custo_chapa_06_baffle = area_chapa_06_baffle_m2 * PU(precos, 'Chapa 0.6mm (m2)');
  const custo_la_baffle = area_la_baffle_m2 * PU(precos, 'Lã Knauf (m2)');
  const custo_la_sem_pel_baffle = area_la_sem_pel_baffle_m2 * PU(precos, 'Lã Knauf s/ pelicula (m2)');
  // custo_P30_baffle = 0
  // custo_cantos_baffle = 0
  const custo_rebites_baffle = qtd_rebites_baffle * PU(precos, 'Rebites (un)');
  // custo_palete_baffle = 0
  const custo_mo_caixa_baffle = mao_obra_caixa_baffle_m2;
  const custo_mo_baffles_baffle = mao_obra_baffles_baffle;

  const custo_materiais = custo_chapa_08_baffle + custo_chapa_06_baffle + custo_la_baffle + 
                          custo_la_sem_pel_baffle + custo_rebites_baffle;
  const custo_mao_de_obra = custo_mo_caixa_baffle + custo_mo_baffles_baffle;

  const Subtotal_ATEN_BAFFLE = custo_materiais + custo_mao_de_obra;

  const Custos_indiretos_ATEN_BAFFLE = Subtotal_ATEN_BAFFLE * (PU(precos, 'Custos indiretos (%)') / 100);
  const Lucro_ATEN_BAFFLE = (Subtotal_ATEN_BAFFLE + Custos_indiretos_ATEN_BAFFLE) * (PU(precos, 'Lucro (%)') / 100);
  const Preco_ATEN_BAFFLE = Subtotal_ATEN_BAFFLE + Custos_indiretos_ATEN_BAFFLE + Lucro_ATEN_BAFFLE;

  return {
    custo_materiais,
    custo_mao_de_obra,
    subtotal: Subtotal_ATEN_BAFFLE,
    custos_indiretos_valor: Custos_indiretos_ATEN_BAFFLE,
    lucro_valor: Lucro_ATEN_BAFFLE,
    preco_final: Preco_ATEN_BAFFLE,
    detalhes: {
      custo_chapa_08_baffle,
      custo_chapa_06_baffle,
      custo_la_baffle,
      custo_la_sem_pel_baffle,
      custo_rebites_baffle,
      custo_mo_caixa_baffle,
      custo_mo_baffles_baffle
    }
  };
}

/**
 * 2.2 Cálculo CAIXA
 */
function calcular_caixa(
  dim: BoxDimensions,
  n_baffles: number,
  espessura_mm: number,
  precos: PrecoUnitarioCaixa[]
): PriceComponentResult {
  const B2 = dim.width_mm;
  const B4 = dim.height_mm;
  const B6 = dim.depth_mm;
  const B9 = n_baffles;
  const B11 = espessura_mm;

  // Quantities
  const area_chapa_08_caixa_m2 = ((2*B6*(B4+35) + 2*B6*(B2+35))/1_000_000);
  
  const term1 = ((2*B4*(B11+95) + 2*B6*(B11+50))/1_000_000 * B9);
  const term2 = (2 * B4 * 295 / 1_000_000) * (B6 > 1000 ? B9 : 0);
  const term3 = (2 * B6 * 250 / 1_000_000) * (B4 > 1000 ? B9 : 0);
  const area_chapa_06_caixa_m2 = term1 + term2 + term3;

  const area_la_caixa_m2 = (B6*B4/1_000_000 * B9 * (B11/50));
  const comprimento_P30_caixa_ml = 4*(B2+B4)/1000;
  const qtd_cantos_caixa = 8;
  const qtd_rebites_caixa = B9 * 12;
  const qtd_palete_caixa = 1;

  const mao_obra_caixa_caixa = PU(precos, 'Mão de obra caixa (€/m2)'); // Treated as cost directly per instructions
  const mao_obra_baffles_caixa = PU(precos, 'Mão de obra baffles (€/m2)') * area_chapa_06_caixa_m2;

  // Direct Costs
  const custo_chapa_08_caixa = area_chapa_08_caixa_m2 * PU(precos, 'Chapa 0.8mm (m2)');
  const custo_chapa_06_caixa = area_chapa_06_caixa_m2 * PU(precos, 'Chapa 0.6mm (m2)');
  const custo_la_caixa = area_la_caixa_m2 * PU(precos, 'Lã Knauf (m2)');
  const custo_P30_caixa = comprimento_P30_caixa_ml * PU(precos, 'Perfil P30 (m.l)');
  const custo_cantos_caixa = qtd_cantos_caixa * PU(precos, 'Cantos metálicos (un)');
  const custo_rebites_caixa = qtd_rebites_caixa * PU(precos, 'Rebites (un)');
  const custo_palete_caixa = qtd_palete_caixa * PU(precos, 'Palete + Embalagem (un)');
  const custo_mo_caixa_caixa = mao_obra_caixa_caixa;
  const custo_mo_baffles_caixa = mao_obra_baffles_caixa;

  const custo_materiais = custo_chapa_08_caixa + custo_chapa_06_caixa + custo_la_caixa + 
                          custo_P30_caixa + custo_cantos_caixa + custo_rebites_caixa + 
                          custo_palete_caixa;
  const custo_mao_de_obra = custo_mo_caixa_caixa + custo_mo_baffles_caixa;

  const Subtotal_CAIXA = custo_materiais + custo_mao_de_obra;

  const Custos_indiretos_CAIXA = Subtotal_CAIXA * (PU(precos, 'Custos indiretos (%)') / 100);
  const Lucro_CAIXA = (Subtotal_CAIXA + Custos_indiretos_CAIXA) * (PU(precos, 'Lucro (%)') / 100);
  const Preco_CAIXA = Subtotal_CAIXA + Custos_indiretos_CAIXA + Lucro_CAIXA;

  return {
    custo_materiais,
    custo_mao_de_obra,
    subtotal: Subtotal_CAIXA,
    custos_indiretos_valor: Custos_indiretos_CAIXA,
    lucro_valor: Lucro_CAIXA,
    preco_final: Preco_CAIXA,
    detalhes: {
      custo_chapa_08_caixa,
      custo_chapa_06_caixa,
      custo_la_caixa,
      custo_P30_caixa,
      custo_cantos_caixa,
      custo_rebites_caixa,
      custo_palete_caixa,
      custo_mo_caixa_caixa,
      custo_mo_baffles_caixa
    }
  };
}

/**
 * Main Pricing Function
 */
export function calcular_preco_total(
  dim: BoxDimensions,
  n_baffles: number,
  espessura_mm: number,
  precos_caixa: PrecoUnitarioCaixa[]
): FinalPriceResult {
  
  const preco_atenuador_baffle = calcular_atenuador_baffle(dim, n_baffles, espessura_mm, precos_caixa);
  const preco_caixa = calcular_caixa(dim, n_baffles, espessura_mm, precos_caixa);

  // 2.3. Preço final
  const preco_total = preco_atenuador_baffle.preco_final + preco_caixa.preco_final;

  return {
    preco_atenuador_baffle,
    preco_caixa,
    preco_total: Number(preco_total.toFixed(2))
  };
}

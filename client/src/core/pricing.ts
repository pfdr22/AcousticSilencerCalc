import { PrecoUnitarioCaixa, PrecoUnitarioBaffle } from "../types/schema";

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
  detalhes: Record<string, number>; // Stores quantities or specific costs for debugging/display
}

export interface FinalPriceResult {
  preco_atenuador_baffle: PriceComponentResult;
  preco_caixa: PriceComponentResult;
  preco_baffle_lateral: PriceComponentResult;
  preco_total: number;
}

const getVal = (list: { descricao: string; valor: number }[], desc: string): number => {
  const item = list.find(i => i.descricao === desc);
  return item ? item.valor : 0;
};

/**
 * Cálculo CAIXA (C14)
 */
export function calcular_preco_caixa(
  dim: BoxDimensions,
  n_baffles: number,
  precos: PrecoUnitarioCaixa[]
): PriceComponentResult {
  const W = dim.width_mm;
  const H = dim.height_mm;
  const L = dim.depth_mm;

  // Prices
  const p_chapa08 = getVal(precos, "Chapa 0.8mm (m2)");
  const p_perfil = getVal(precos, "Perfil P30 (m.l)");
  const p_cantos = getVal(precos, "Cantos metálicos (un)");
  const p_rebites = getVal(precos, "Rebites (un)");
  const p_palete = getVal(precos, "Palete + Embalagem (un)");
  const p_mao_obra = getVal(precos, "Mão de obra caixa (€/m2)");
  const pct_indiretos = getVal(precos, "Custos indiretos (%)") / 100;
  const pct_lucro = getVal(precos, "Lucro (%)") / 100;

  // Quantities
  // Area Chapa 0.8 (Box Walls) - Formula approximation based on perimeter * length + flanges
  // (2*L*(H+35) + 2*L*(W+35)) / 1e6 * 1.2 (waste)
  const area_walls_m2 = (2 * L * (H + 35) + 2 * L * (W + 35)) / 1000000;
  const qtd_chapa08 = area_walls_m2 * 1.2;

  const qtd_perfil = (4 * (W + H)) / 1000;
  const qtd_cantos = 8;
  const qtd_rebites = n_baffles * 12; // Estimation
  const qtd_palete = 1;

  // Direct Costs
  const c_chapa = qtd_chapa08 * p_chapa08;
  const c_perfil = qtd_perfil * p_perfil;
  const c_cantos = qtd_cantos * p_cantos;
  const c_rebites = qtd_rebites * p_rebites;
  const c_palete = qtd_palete * p_palete;
  
  const custo_materiais = c_chapa + c_perfil + c_cantos + c_rebites + c_palete;
  const custo_mao_de_obra = area_walls_m2 * p_mao_obra; // Labor based on surface area
  
  const subtotal = custo_materiais + custo_mao_de_obra;
  const custos_indiretos_valor = subtotal * pct_indiretos;
  const base_lucro = subtotal + custos_indiretos_valor;
  const lucro_valor = base_lucro * pct_lucro;
  const preco_final = base_lucro + lucro_valor;

  return {
    custo_materiais,
    custo_mao_de_obra,
    subtotal,
    custos_indiretos_valor,
    lucro_valor,
    preco_final,
    detalhes: {
      qtd_chapa08,
      qtd_perfil,
      qtd_cantos,
      qtd_rebites,
      qtd_palete
    }
  };
}

/**
 * Cálculo Atenuador BAFFLE (C15) - Central Baffles
 */
export function calcular_preco_atenuador_baffle(
  dim: BoxDimensions,
  n_baffles: number,
  espessura_mm: number,
  precos: PrecoUnitarioBaffle[]
): PriceComponentResult {
  if (n_baffles <= 0) {
    return { custo_materiais: 0, custo_mao_de_obra: 0, subtotal: 0, custos_indiretos_valor: 0, lucro_valor: 0, preco_final: 0, detalhes: {} };
  }

  const H = dim.height_mm;
  const L = dim.depth_mm;

  // Prices
  const p_chapa06 = getVal(precos, "Chapa 0.6mm (m2)");
  const p_la = getVal(precos, "Lã Knauf (m2)");
  // const p_la_sem_pelicula = getVal(precos, "Lã Knauf s/ pelicula (m2)"); // Not used in standard baffle?
  const p_mao_obra = getVal(precos, "Mão de obra baffles (€/m2)");
  const pct_indiretos = getVal(precos, "Custos indiretos (%)") / 100;
  const pct_lucro = getVal(precos, "Lucro (%)") / 100;

  // Quantities
  // Wool: 2 faces per baffle
  const area_la_raw = (2 * H * L * n_baffles) / 1000000;
  const qtd_la = area_la_raw * 1.05; // 5% waste

  // Frame (Chapa 0.6): Perimeter of baffle * thickness frame
  const perimeter_mm = 2 * (H + L);
  const frame_width_mm = espessura_mm + 40; 
  const area_frame_raw = (n_baffles * perimeter_mm * frame_width_mm) / 1000000;
  const qtd_chapa06 = area_frame_raw * 1.2;

  // Costs
  const c_la = qtd_la * p_la;
  const c_chapa = qtd_chapa06 * p_chapa06;

  const custo_materiais = c_la + c_chapa;
  const custo_mao_de_obra = area_la_raw * p_mao_obra; // Based on wool area?

  const subtotal = custo_materiais + custo_mao_de_obra;
  const custos_indiretos_valor = subtotal * pct_indiretos;
  const base_lucro = subtotal + custos_indiretos_valor;
  const lucro_valor = base_lucro * pct_lucro;
  const preco_final = base_lucro + lucro_valor;

  return {
    custo_materiais,
    custo_mao_de_obra,
    subtotal,
    custos_indiretos_valor,
    lucro_valor,
    preco_final,
    detalhes: {
      qtd_la,
      qtd_chapa06
    }
  };
}

/**
 * Cálculo "Baffle" BAFFLE (C14) - Lateral Baffles (Side Linings)
 * Usually half thickness or specific treatment on the box walls.
 * Assuming this calculation is for ONE side baffle.
 */
export function calcular_preco_baffle_lateral(
  dim: BoxDimensions,
  espessura_mm: number, // Typically half of central baffle or same? Let's use passed thickness
  precos: PrecoUnitarioBaffle[]
): PriceComponentResult {
  const H = dim.height_mm;
  const L = dim.depth_mm;

  // Prices
  const p_chapa06 = getVal(precos, "Chapa 0.6mm (m2)");
  // Side baffles often use wool without film or different mounting?
  // Prompt says "Lã Knauf s/ pelicula" exists. Let's use it if appropriate, or standard.
  // Let's assume standard for now unless specified.
  const p_la = getVal(precos, "Lã Knauf (m2)"); 
  const p_mao_obra = getVal(precos, "Mão de obra baffles lateral (€/m2)");
  const pct_indiretos = getVal(precos, "Custos indiretos (%)") / 100;
  const pct_lucro = getVal(precos, "Lucro (%)") / 100;

  // Quantities for ONE side baffle
  // Usually covers 1 wall (H * L)
  const area_surface = (H * L) / 1000000;
  const qtd_la = area_surface * 1.05; // 1 layer?

  // Frame/Perforated sheet for side baffle
  // Usually a perforated sheet covering the wool.
  const qtd_chapa06 = area_surface * 1.2; // Perforated sheet area

  // Costs
  const c_la = qtd_la * p_la;
  const c_chapa = qtd_chapa06 * p_chapa06;

  const custo_materiais = c_la + c_chapa;
  const custo_mao_de_obra = area_surface * p_mao_obra;

  const subtotal = custo_materiais + custo_mao_de_obra;
  const custos_indiretos_valor = subtotal * pct_indiretos;
  const base_lucro = subtotal + custos_indiretos_valor;
  const lucro_valor = base_lucro * pct_lucro;
  const preco_final = base_lucro + lucro_valor;

  return {
    custo_materiais,
    custo_mao_de_obra,
    subtotal,
    custos_indiretos_valor,
    lucro_valor,
    preco_final,
    detalhes: {
      qtd_la,
      qtd_chapa06
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
  precos_caixa: PrecoUnitarioCaixa[],
  precos_baffle: PrecoUnitarioBaffle[]
): FinalPriceResult {
  
  const preco_caixa = calcular_preco_caixa(dim, n_baffles, precos_caixa);
  const preco_atenuador_baffle = calcular_preco_atenuador_baffle(dim, n_baffles, espessura_mm, precos_baffle);
  const preco_baffle_lateral = calcular_preco_baffle_lateral(dim, espessura_mm, precos_baffle);

  // Final Formula: Atenuador + Caixa + 2 * Lateral
  const preco_total = preco_atenuador_baffle.preco_final + 
                      preco_caixa.preco_final + 
                      (2 * preco_baffle_lateral.preco_final);

  return {
    preco_atenuador_baffle,
    preco_caixa,
    preco_baffle_lateral,
    preco_total: Number(preco_total.toFixed(2))
  };
}

import { PRICING_DB } from "./pricing_db";

interface BoxDimensions {
  width_mm: number;
  height_mm: number;
  depth_mm: number;
}

interface BoxCostsResult {
  area_chapa_08: number;
  area_chapa_06: number; // Usually 0 for box, but kept for structure
  area_la: number; // Usually 0 for box
  comprimento_perfil: number;
  qtd_cantos: number;
  qtd_rebites: number;
  qtd_palete: number;
  custo_materiais: number;
  custo_mao_de_obra: number;
  subtotal: number;
}

interface BaffleCostsResult {
  area_chapa_06: number;
  area_la: number;
  custo_materiais: number;
  custo_mao_de_obra: number;
  subtotal: number;
}

export interface FinalPriceResult {
  custo_caixa: BoxCostsResult;
  custo_baffles: BaffleCostsResult;
  subtotal_direto: number;
  custos_indiretos_valor: number;
  margem_lucro_valor: number;
  preco_final: number;
}

/**
 * Calculates the cost of the outer box (Caixa).
 */
export function calcular_custos_caixa(
  dimensoes: BoxDimensions, 
  n_baffles: number
): BoxCostsResult {
  const W = dimensoes.width_mm;
  const H = dimensoes.height_mm;
  const L = dimensoes.depth_mm;

  // 1. Area Chapa 0.8mm (Box Walls)
  // Formula: ((2*L*(H+35) + 2*L*(W+35))/1e6) * 1.2
  const area_walls_raw = (2 * L * (H + 35) + 2 * L * (W + 35)) / 1000000;
  const area_chapa_08 = area_walls_raw * PRICING_DB.factors.waste_chapa;

  // 2. Perfil P30
  // Formula: 4 * (W + H) / 1000
  const comprimento_perfil = (4 * (W + H)) / 1000;

  // 3. Accessories
  const qtd_cantos = 8;
  // Formula for rivets: n_baffles * 12 (fixing baffles to box)
  const qtd_rebites = n_baffles * 12; 
  const qtd_palete = 1;

  // Costs
  const cost_chapa = area_chapa_08 * PRICING_DB.materials.chapa_08_mm;
  const cost_perfil = comprimento_perfil * PRICING_DB.materials.perfil_p30;
  const cost_cantos = qtd_cantos * PRICING_DB.materials.cantos;
  const cost_rebites = qtd_rebites * PRICING_DB.materials.rebites;
  const cost_palete = qtd_palete * PRICING_DB.materials.palete_embalagem;

  const custo_materiais = cost_chapa + cost_perfil + cost_cantos + cost_rebites + cost_palete;

  // Labor: Based on Box Surface Area
  const custo_mao_de_obra = area_walls_raw * PRICING_DB.labor.caixa_m2;

  return {
    area_chapa_08: Number(area_chapa_08.toFixed(3)),
    area_chapa_06: 0,
    area_la: 0,
    comprimento_perfil: Number(comprimento_perfil.toFixed(2)),
    qtd_cantos,
    qtd_rebites,
    qtd_palete,
    custo_materiais: Number(custo_materiais.toFixed(2)),
    custo_mao_de_obra: Number(custo_mao_de_obra.toFixed(2)),
    subtotal: Number((custo_materiais + custo_mao_de_obra).toFixed(2))
  };
}

/**
 * Calculates the cost of the baffles.
 */
export function calcular_custos_baffles(
  dimensoes: BoxDimensions,
  n_baffles: number,
  espessura_baffle_mm: number
): BaffleCostsResult {
  const H = dimensoes.height_mm;
  const L = dimensoes.depth_mm;
  
  if (n_baffles <= 0) {
    return { area_chapa_06: 0, area_la: 0, custo_materiais: 0, custo_mao_de_obra: 0, subtotal: 0 };
  }

  // 1. Wool Area (Lã Mineral)
  // Baffles have 2 faces of wool.
  // Area = 2 * H * L * N
  const area_la_raw = (2 * H * L * n_baffles) / 1000000;
  const area_la = area_la_raw * 1.05; // 5% waste

  // 2. Frame Area (Chapa 0.6mm)
  // Frame around the baffle (Top/Bottom/Front/Back/Internal reinforcements)
  // Approximation: Perimeter * Thickness? 
  // Let's assume a frame factor relative to surface area or calculating perimeter.
  // Perimeter of one baffle side view = 2*(H+L). Depth is L, Height is H. Thickness T.
  // Frame usually covers the thickness T along the perimeter 2(H+L).
  // Area Frame = N * (2*H + 2*L) * (T + overlap)
  // Let's assume overlap/flange of 50mm total.
  const perimeter_mm = 2 * (H + L);
  const frame_width_mm = espessura_baffle_mm + 40; // 20mm flange each side
  const area_frame_raw = (n_baffles * perimeter_mm * frame_width_mm) / 1000000;
  const area_chapa_06 = area_frame_raw * PRICING_DB.factors.waste_chapa;

  // Costs
  const cost_la = area_la * PRICING_DB.materials.la_mineral;
  const cost_chapa = area_chapa_06 * PRICING_DB.materials.chapa_06_mm;

  const custo_materiais = cost_la + cost_chapa;

  // Labor
  const custo_mao_de_obra = area_la_raw * PRICING_DB.labor.baffle_m2;

  return {
    area_chapa_06: Number(area_chapa_06.toFixed(3)),
    area_la: Number(area_la.toFixed(3)),
    custo_materiais: Number(custo_materiais.toFixed(2)),
    custo_mao_de_obra: Number(custo_mao_de_obra.toFixed(2)),
    subtotal: Number((custo_materiais + custo_mao_de_obra).toFixed(2))
  };
}

/**
 * Calculates the final price including indirect costs and profit.
 */
export function calcular_preco_final(
  dimensoes: BoxDimensions,
  n_baffles: number,
  espessura_baffle_mm: number
): FinalPriceResult {
  
  const custos_caixa = calcular_custos_caixa(dimensoes, n_baffles);
  const custos_baffles = calcular_custos_baffles(dimensoes, n_baffles, espessura_baffle_mm);

  const subtotal_direto = custos_caixa.subtotal + custos_baffles.subtotal;

  // Indirect Costs
  const custos_indiretos_valor = subtotal_direto * PRICING_DB.factors.indirect_costs;
  
  // Base for Profit calculation (Direct + Indirect)
  const base_lucro = subtotal_direto + custos_indiretos_valor;
  
  // Profit
  const margem_lucro_valor = base_lucro * PRICING_DB.factors.profit_margin;

  // Final Price
  const preco_final = base_lucro + margem_lucro_valor;

  return {
    custo_caixa: custos_caixa,
    custo_baffles: custos_baffles,
    subtotal_direto: Number(subtotal_direto.toFixed(2)),
    custos_indiretos_valor: Number(custos_indiretos_valor.toFixed(2)),
    margem_lucro_valor: Number(margem_lucro_valor.toFixed(2)),
    preco_final: Number(preco_final.toFixed(2))
  };
}

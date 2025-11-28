
export interface DownstreamNoiseResult {
  bandas: Record<string, {
    L_up: number;        // Upstream Noise
    D_est: number;       // Attenuation
    L_after_att: number; // Upstream - Attenuation
    L_reg: number;       // Regenerated Noise
    L_down: number;      // Combined Downstream Noise
  }>;
  L_down_global: number;
}

export const calcularRuidoJusante = (
  ruido_montante: Record<string, number>,
  atenuacao_bandas: Record<string, { d_est: number }>,
  ruido_regenerado_bandas: Record<string, { L_w_okt: number; L_w_A_band: number }>,
  mode: 'LW' | 'LWA'
): DownstreamNoiseResult | null => {
  const FREQUENCIES = ["63", "125", "250", "500", "1000", "2000", "4000", "8000"];
  
  // Check if we have any upstream noise input (non-zero)
  const hasInput = FREQUENCIES.some(f => ruido_montante[f] !== undefined && !isNaN(ruido_montante[f]) && ruido_montante[f] !== 0);
  
  // According to instructions: "Se não houver L_up(f), este bloco não aparece"
  if (!hasInput) return null;

  const result: DownstreamNoiseResult = {
    bandas: {},
    L_down_global: 0
  };

  let sum_energy_down = 0;

  FREQUENCIES.forEach(f => {
    const L_up = ruido_montante[f] || 0;
    const D_est = atenuacao_bandas[f]?.d_est || 0;
    
    // Select correct regenerated noise value based on mode
    const L_reg = mode === 'LW' 
      ? (ruido_regenerado_bandas[f]?.L_w_okt || 0)
      : (ruido_regenerado_bandas[f]?.L_w_A_band || 0);

    // 1. Calculate Attenuated Noise: L_after_att = L_up - D_est
    // If L_up is 0 (no input), L_after_att is essentially -Infinity (silent source). 
    // We'll handle the "no source" case in the summation.
    const L_after_att = L_up - D_est;

    // 2. Energetic Summation with Regenerated Noise
    // L_down = 10 * log10( 10^(L_after_att/10) + 10^(L_reg/10) )
    
    const energy_reg = Math.pow(10, L_reg / 10);
    
    let energy_after_att = 0;
    // Only include attenuated source noise if there was a source input
    if (ruido_montante[f] !== undefined && !isNaN(ruido_montante[f])) {
       energy_after_att = Math.pow(10, L_after_att / 10);
    }

    const total_energy = energy_after_att + energy_reg;
    const L_down = 10 * Math.log10(total_energy);

    result.bandas[f] = {
      L_up: Number(L_up.toFixed(1)),
      D_est: Number(D_est.toFixed(1)),
      L_after_att: Number(L_after_att.toFixed(1)),
      L_reg: Number(L_reg.toFixed(1)),
      L_down: Number(L_down.toFixed(1))
    };

    sum_energy_down += total_energy;
  });

  result.L_down_global = Number((10 * Math.log10(sum_energy_down)).toFixed(1));

  return result;
};

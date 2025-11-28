
export interface RegeneratedNoiseResult {
  L_w: number; // Global Sound Power Level of flow noise
  bandas: Record<string, {
    delta_L_w_okt: number; // Octave correction
    L_w_okt: number; // Sound Power Level per band (Linear)
    L_w_A_band: number; // A-weighted Sound Power Level per band
  }>;
  L_w_A_global: number; // Global A-weighted Sound Power Level
}

const A_WEIGHTING: Record<string, number> = {
  "63": -26.2,
  "125": -16.1,
  "250": -8.6,
  "500": -3.2,
  "1000": 0,
  "2000": 1.2,
  "4000": 1.0,
  "8000": -1.1
};

const FREQUENCIES = ["63", "125", "250", "500", "1000", "2000", "4000", "8000"];

export const calcularRuidoRegenerado = (
  caudal_m3_h: number,
  largura_mm: number,
  altura_mm: number,
  numero_baffles: number,
  espessura_baffles_mm: number
): RegeneratedNoiseResult => {
  // 1. Basic Parameters
  const v_s = calculateGapVelocity(caudal_m3_h, largura_mm, altura_mm, numero_baffles, espessura_baffles_mm);
  const S = (largura_mm / 1000) * (altura_mm / 1000); // Face area (m2)
  const d_h = calculateHydraulicDiameter(largura_mm, altura_mm, numero_baffles, espessura_baffles_mm);

  // Reference values
  const v_ref = 1.0; // m/s
  const S_ref = 1.0; // m2

  if (v_s <= 0 || S <= 0) {
    return { L_w: 0, bandas: {}, L_w_A_global: 0 };
  }

  // 2. Calculate Global Sound Power Level L_w (Eq 65)
  // L_w = 57.4 * log10(v_s / v_ref) + 10 * log10(S / S_ref) - 2.5
  // Note: log10(x) is Math.log10(x)
  // Using Math.max(v_s, 0.1) to avoid log(0) or negative
  const L_w = 57.4 * Math.log10(Math.max(v_s, 0.1) / v_ref) + 10 * Math.log10(S / S_ref) - 2.5;

  // 3. Calculate Correction Factor K (Eq 67)
  // K = -14.8 * log10(v_s / v_ref) + 7.4
  const K = -14.8 * Math.log10(Math.max(v_s, 0.1) / v_ref) + 7.4;

  const result: RegeneratedNoiseResult = {
    L_w: Number(L_w.toFixed(1)),
    bandas: {},
    L_w_A_global: 0
  };

  let sum_energy_A = 0;
  const delta_L_w_okt_values: number[] = [];

  // 4. Calculate Octave Corrections (Eq 66)
  FREQUENCIES.forEach(freqStr => {
    const f_m = parseInt(freqStr);
    
    // Strouhal Number St = f_m * d_h / v_s
    const St = (f_m * d_h) / Math.max(v_s, 0.1);
    
    // log10(St)
    const lgSt = Math.log10(Math.max(St, 1e-10));

    // ΔL_w_okt = 7.4 - 14.9*lg(St) - 1.8*(lg St)^2 + 2.4*(lg St)^3 - 0.5*(lg St)^4 + K
    const delta_L_w_okt_raw = 7.4 
      - 14.9 * lgSt 
      - 1.8 * Math.pow(lgSt, 2) 
      + 2.4 * Math.pow(lgSt, 3) 
      - 0.5 * Math.pow(lgSt, 4) 
      + K;

    delta_L_w_okt_values.push(delta_L_w_okt_raw);
  });

  // 5. Calculate Total Correction ΔL_w_okt_Gesamt (Eq 68)
  // ΔL_w_okt_Gesamt = 10 * log10( sum( 10^(0.1 * ΔL_w_okt) ) )
  const sum_energy_corrections = delta_L_w_okt_values.reduce((acc, val) => acc + Math.pow(10, 0.1 * val), 0);
  const delta_L_w_okt_Gesamt = 10 * Math.log10(sum_energy_corrections);

  // 6. Calculate Final Band Levels (Eq 69)
  // L_w_okt = L_w + ΔL_w_okt - ΔL_w_okt_Gesamt
  FREQUENCIES.forEach((freqStr, index) => {
    const delta_L_w_okt = delta_L_w_okt_values[index];
    
    const L_w_okt = L_w + delta_L_w_okt - delta_L_w_okt_Gesamt;
    
    // A-weighting
    const A_val = A_WEIGHTING[freqStr] || 0;
    const L_w_A_band = L_w_okt + A_val;

    // Accumulate for Global A-weighted sum
    sum_energy_A += Math.pow(10, 0.1 * L_w_A_band);

    result.bandas[freqStr] = {
      delta_L_w_okt: Number(delta_L_w_okt.toFixed(1)),
      L_w_okt: Number(L_w_okt.toFixed(1)),
      L_w_A_band: Number(L_w_A_band.toFixed(1))
    };
  });

  // 7. Calculate Global A-weighted Level
  result.L_w_A_global = Number((10 * Math.log10(sum_energy_A)).toFixed(1));

  return result;
};

// Helpers (reused logic to ensure consistency)
function calculateGapVelocity(
  caudal_m3_h: number, 
  largura_mm: number, 
  altura_mm: number, 
  n_baffles: number, 
  espessura_mm: number
): number {
  const W = largura_mm / 1000;
  const H = altura_mm / 1000;
  const d_k = espessura_mm / 1000;
  
  // Gap width s
  const s = n_baffles > 0 ? (W - (n_baffles * d_k)) / n_baffles : 0;
  
  // Free Area
  const area_livre = n_baffles * s * H;
  
  return area_livre > 0 ? (caudal_m3_h / 3600) / area_livre : 0;
}

function calculateHydraulicDiameter(
  largura_mm: number, 
  altura_mm: number, 
  n_baffles: number, 
  espessura_mm: number
): number {
  const W = largura_mm / 1000;
  const H = altura_mm / 1000;
  const d_k = espessura_mm / 1000;
  
  const s = n_baffles > 0 ? (W - (n_baffles * d_k)) / n_baffles : 0;
  const s_h = H;

  if (s <= 0 || s_h <= 0) return 0;
  
  // dh = (2 * s * sh) / (s + sh)
  return (2 * s * s_h) / (s + s_h);
}

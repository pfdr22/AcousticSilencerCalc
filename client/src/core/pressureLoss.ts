import { mockConstantesVdi } from '../db/mock_db';

export interface PressureLossResult {
  zeta: number;
  delta_p_Pa: number;
}

export const calcularPerdaCarga = (
  espessura_mm: number,
  numero_baffles: number,
  largura_mm: number,
  altura_mm: number,
  profundidade_mm: number,
  caudal_m3_h: number
): PressureLossResult => {
  // Convert dimensions to meters
  const d_k = espessura_mm / 1000; // Baffle thickness (m)
  const L = profundidade_mm / 1000; // Length (m)
  const W = largura_mm / 1000; // Width (m)
  const H = altura_mm / 1000; // Height (m)

  // Calculate Gap Width (s)
  // W = n * d_k + n * s  (assuming n baffles and n gaps? Or n+1 gaps?)
  // Usually standard splitters: n baffles.
  // If inserted in duct W:
  //   gap_width = (W - n * d_k) / n (if n gaps correspond to n baffles, typically n air passages for n baffles in some configs, or n+1?)
  //   Reusing formula from Step 2: gap_m = (largura_m - numero_baffles * espessura_m) / numero_baffles
  const s = numero_baffles > 0 ? (W - (numero_baffles * d_k)) / numero_baffles : 0;
  const s_h = H; // Gap height is silencer height

  if (s <= 0 || s_h <= 0) {
    return { zeta: 0, delta_p_Pa: 0 };
  }

  // Hydraulic Diameter of baffle gap (dh)
  // dh = (2 * s * sh) / (s + sh)
  const d_h = (2 * s * s_h) / (s + s_h);

  // Get Constants for Thickness
  const constants = mockConstantesVdi.find(c => c.espessura_mm === espessura_mm);
  
  if (!constants) {
    // Fallback or error if thickness not standard
    return { zeta: 0, delta_p_Pa: 0 };
  }

  const { a1, a2, b1, b2 } = constants;

  // Calculate Zeta (ζ) - VDI 2081 Eq (59)
  // ζ = a1 * [s / (s + dk)]^b1 + a2 * [s / (s + dk)]^b2 * L / dh
  
  // Term: s / (s + d_k)
  const ratio = s / (s + d_k);
  
  const term1 = a1 * Math.pow(ratio, b1);
  const term2 = a2 * Math.pow(ratio, b2) * (L / d_h);
  
  const zeta = term1 + term2;

  // Calculate Velocity inside gaps (v)
  // Area Livre = N * s * s_h
  const area_livre = numero_baffles * s * s_h;
  const velocity = area_livre > 0 ? (caudal_m3_h / 3600) / area_livre : 0;

  // Calculate Delta P (Δp)
  // Δp = 0.5 * rho * v^2 * ζ
  const rho = 1.2; // Air density kg/m3
  const delta_p_Pa = 0.5 * rho * Math.pow(velocity, 2) * zeta;

  return {
    zeta: Number(zeta.toFixed(2)),
    delta_p_Pa: Math.round(delta_p_Pa) // Integer Pascal usually
  };
};

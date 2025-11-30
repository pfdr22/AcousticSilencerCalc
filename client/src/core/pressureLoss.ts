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
  caudal_m3_h: number,
  aerodynamic_factor: number = 0.5 // Default to 0.5 if not provided
): PressureLossResult => {
  // 1. Convert dimensions to meters
  const d_k = espessura_mm / 1000; // Baffle thickness (m)
  const L = profundidade_mm / 1000; // Length (m)
  const W = largura_mm / 1000; // Width (m)
  const H = altura_mm / 1000; // Height (m)

  // 2. Calculate Gap Width (s)
  // VDI 2081 implies s is the clear width between baffles.
  // Assuming uniform distribution: W = n * d_k + n * s (for n baffles, n gaps)
  // s = (W - n * d_k) / n
  const s = numero_baffles > 0 ? (W - (numero_baffles * d_k)) / numero_baffles : 0;
  const s_h = H; // Gap height

  if (s <= 0 || s_h <= 0) {
    return { zeta: 0, delta_p_Pa: 0 };
  }

  // 3. Hydraulic Diameter (dh)
  // d_h = (2 * s * s_h) / (s + s_h)
  const d_h = (2 * s * s_h) / (s + s_h);

  // 4. Get Constants (Table 17)
  const constants = mockConstantesVdi.find(c => c.espessura_mm === espessura_mm);
  
  if (!constants) {
    return { zeta: 0, delta_p_Pa: 0 };
  }

  const { a1, a2, b1, b2 } = constants;

  // 5. Calculate Zeta (ζ) - VDI 2081 (Modified Formula as requested)
  // ratio = (s + dh) / s
  // zeta = a1 * (ratio ** 2) + b1 * ratio
  const ratio = (s + d_h) / s;
  const zeta = a1 * Math.pow(ratio, 2) + b1 * ratio;

  // 6. Calculate Velocity (v)
  // v = Q / A_livre
  const area_livre = numero_baffles * s * s_h;
  const velocity = area_livre > 0 ? (caudal_m3_h / 3600) / area_livre : 0;

  // 7. Calculate Base Pressure Drop (Δp)
  // delta_p = zeta * 0.5 * rho * (v ** 2)
  const rho = 1.2; // Air density (kg/m3)
  const delta_p_base = zeta * 0.5 * rho * Math.pow(velocity, 2);

  // 8. Apply Aerodynamic Profile Correction
  // Apply factor at the end (default 0.5)
  const delta_p_final = delta_p_base * aerodynamic_factor;

  return {
    zeta: Number(zeta.toFixed(2)),
    delta_p_Pa: Math.round(delta_p_final)
  };
};

import { RefAtenuacao } from '../types/schema';
import { mockRefAtenuacao } from '../db/mock_db';

// Coefficients for ΔD_r polynomial calculation based on thickness
// Coefficients are for polynomial: a*x^4 + b*x^3 + c*x^2 + d*x
// where x = (r - 0.5)
// Based on the provided Excel image logic

type PolynomialCoeffs = {
  [key: string]: { // Frequency
    a?: number; // x^4
    b?: number; // x^3
    c: number; // x^2
    d: number; // x
  }
};

const COEFFS_100: PolynomialCoeffs = {
  "63":   { c: -0.8036, d: 0.7098 },
  "125":  { c: 0.3571, d: -1.8393 },
  "250":  { c: 1.9107, d: -7.3259 },
  "500":  { c: 8.0893, d: -22.4598 },
  "1000": { c: 6.1964, d: -23.683 },
  "2000": { c: 5.75, d: -29.9554 },
  "4000": { c: 7.9821, d: -31.7366 },
  "8000": { c: 14.8929, d: -33.3839 },
};

const COEFFS_200: PolynomialCoeffs = {
  "63":   { c: -0.1218, d: -2.3 }, // Using approx from image logic visualization
  "125":  { c: 3.0158, d: -7.251 },
  "250":  { c: 5.2872, d: -16.143 },
  "500":  { c: 16.071, d: -34.5978 },
  "1000": { c: 15.8194, d: -40.0386 },
  "2000": { a: -11.4974, b: 11.9951, c: 26.8754, d: -57.9855 }, // 4th degree from image
  "4000": { c: 16.068, d: -36.8284 },
  "8000": { a: 25.6734, b: -75.0144, c: 77.3008, d: -39.1424 }, // 4th degree from image
};

const COEFFS_300: PolynomialCoeffs = {
  "63":   { a: 28.3058, b: -50.6217, c: 22.4839, d: -2.0197 }, // 4th degree
  "125":  { a: 23.8514, b: -37.7475, c: 15.5151, d: -5.6454 },
  "250":  { a: -1.1672, b: 2.9277, c: 7.0134, d: -17.8556 },
  "500":  { a: -15.4007, b: 22.9673, c: 2.7267, d: -30.2921 },
  "1000": { a: -5.3642, b: 1.3338, c: 25.4208, d: -41.3978 },
  "2000": { a: -12.2478, b: 10.4128, c: 21.6397, d: -39.766 },
  "4000": { a: 9.6818, b: -11.612, c: 12.2798, d: -24.3045 },
  "8000": { a: -3.0933, b: 8.58, c: -2.8214, d: -11.7115 },
};

const getCoeffs = (thickness: number): PolynomialCoeffs => {
  if (thickness === 100) return COEFFS_100;
  if (thickness === 200) return COEFFS_200;
  if (thickness === 300) return COEFFS_300;
  return {};
};

export interface AtenuacaoResult {
  bandas: Record<string, {
    d_ref: number;
    delta_d_r: number;
    d_corr: number;
    d_est: number;
  }>;
  global_est: number;
}

export const calcularAtenuacao = (
  espessura_mm: number,
  numero_baffles: number,
  largura_mm: number,
  altura_mm: number,
  profundidade_mm: number
): AtenuacaoResult => {
  const espessura_m = espessura_mm / 1000;
  const largura_m = largura_mm / 1000;
  
  // Calculate gap_m and ratio r
  const gap_m = numero_baffles > 0 
      ? (largura_m - (numero_baffles * espessura_m)) / numero_baffles 
      : 0;
      
  const r = espessura_m > 0 ? gap_m / espessura_m : 0;
  const x = r - 0.5; // Variable for polynomial

  const coeffs = getCoeffs(espessura_mm);
  const refData = mockRefAtenuacao.filter(d => d.espessura_mm === espessura_mm);
  
  const result: AtenuacaoResult = {
    bandas: {},
    global_est: 0
  };

  const frequencies = ["63", "125", "250", "500", "1000", "2000", "4000", "8000"];
  const d_est_values: number[] = [];

  frequencies.forEach(freq => {
    const freqNum = parseInt(freq);
    const ref = refData.find(d => d.frequencia_hz === freqNum);
    const d_ref = ref ? ref.d_ref_db : 0;
    
    // Calculate ΔD_r using polynomial
    // Formula: a*x^4 + b*x^3 + c*x^2 + d*x
    const c = coeffs[freq];
    let delta_d_r = 0;
    
    if (c) {
      const termA = c.a ? c.a * Math.pow(x, 4) : 0;
      const termB = c.b ? c.b * Math.pow(x, 3) : 0;
      const termC = c.c ? c.c * Math.pow(x, 2) : 0;
      const termD = c.d ? c.d * x : 0;
      delta_d_r = termA + termB + termC + termD;
    }

    const d_corr = d_ref + delta_d_r;
    
    // D_est = D_corr * (L / 1000) if L is in mm? No, formula is D_est = D_corr * depth / 1000
    // Assuming depth factor is linear with length (standard acoustic attenuation behavior)
    // The image shows: =(B3+C3)*($B$13/1000). B13 is depth.
    const d_est = d_corr * (profundidade_mm / 1000);

    result.bandas[freq] = {
      d_ref,
      delta_d_r: Number(delta_d_r.toFixed(2)),
      d_corr: Number(d_corr.toFixed(2)),
      d_est: Number(d_est.toFixed(2))
    };
    
    if (d_est > 0) {
      d_est_values.push(d_est);
    }
  });

  // Global attenuation (logarithmic sum? usually attenuation is not summed log, but for insertion loss maybe?)
  // Requirement says: "Devolve: D_est por banda + valor global por soma logarítmica."
  // Summing attenuation logarithmically is unusual (usually we sum noise levels), 
  // but I will follow the instruction "valor global por soma logarítmica".
  // If it meant "Total Insertion Loss", usually it's done by applying spectrum to source. 
  // But here, just "Global Value". I'll assume it means log sum of the attenuation values themselves 
  // OR applying to a pink noise source? 
  // "Soma logarítmica" usually implies 10*log10(sum(10^(val/10))).
  
  result.global_est = d_est_values.length > 0 
    ? Math.round(10 * Math.log10(d_est_values.reduce((acc, val) => acc + Math.pow(10, val / 10), 0)) * 10) / 10
    : 0;

  return result;
};

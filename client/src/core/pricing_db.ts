
export const PRICING_DB = {
  materials: {
    chapa_08_mm: 7.5,      // €/m2
    chapa_06_mm: 5.5,      // €/m2
    la_mineral: 6.5,       // €/m2
    la_mineral_pelicula: 4.0, // €/m2 (Extra? Or standalone?) Assuming standalone base price or delta. Image says "Lã Knauf s/ pelicula" 4. Let's assume 6.5 is with? Or standard.
    perfil_p30: 1.3,       // €/m
    cantos: 0.15,          // €/un
    rebites: 0.02,         // €/un
    palete_embalagem: 4.5, // €/un
  },
  labor: {
    caixa_m2: 4.5,         // €/m2 of box surface
    baffle_m2: 5.0,        // €/m2 of baffle surface (estimated)
  },
  factors: {
    waste_chapa: 1.2,      // 20% waste
    indirect_costs: 0.35,  // 35%
    profit_margin: 0.15    // 15%
  }
};

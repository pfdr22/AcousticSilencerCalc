import { useState, useEffect, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext"; // Import useData
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth for admin check
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Calculator as CalcIcon, BarChart3, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import silencerDimsImage from "@assets/image_1764355007570.png";
import logoImage from "@assets/FRANCE_AIR_AIRVANCE_Logo_Preto100_4cores_(1)_1764843216985.jpg";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularPerdaCarga, PressureLossResult } from "@/core/pressureLoss";
import { calcularAtenuacao, AtenuacaoResult } from "@/core/attenuation";
import { calcularRuidoRegenerado, RegeneratedNoiseResult } from "@/core/regeneratedNoise";
import { calcularRuidoJusante, DownstreamNoiseResult } from "@/core/downstreamNoise";
import { calcular_preco_final, FinalPriceResult } from "@/core/pricing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// @ts-ignore
import html2pdf from 'html2pdf.js';

import { APP_CONFIG } from "@/core/config";

// Types
type Thickness = 100 | 200 | 300;
type NoiseMode = 'LW' | 'LWA';

interface CalculatorState {
  referencia: string;
  largura_mm: number;
  altura_mm: number;
  profundidade_mm: number;
  espessura_baffles_mm: Thickness;
  numero_baffles: number;
  caudal_m3_h: number;
  ruido_montante: Record<string, number>; 
  noiseMode: NoiseMode;
}

const FREQUENCIES = ["63", "125", "250", "500", "1000", "2000", "4000", "8000"];

const A_WEIGHTING: Record<string, number> = {
  "63": -26.2, "125": -16.1, "250": -8.6, "500": -3.2, "1000": 0, "2000": 1.2, "4000": 1.0, "8000": -1.1
};

const calculateLogSum = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + Math.pow(10, val / 10), 0);
  return Math.round(10 * Math.log10(sum) * 10) / 10;
};

const getThicknessLetter = (t: Thickness): string => {
  const map: Record<number, string> = { 100: 'X', 200: 'Y', 300: 'Z' };
  return map[t] || '?';
};

const getBaffleCountLetter = (n: number): string => {
  if (n < 1) return '?';
  if (n <= 26) return String.fromCharCode(64 + n);
  return '?'; 
};

export default function Calculator() {
  const { data } = useData(); // Get global data
  const { admin } = useAuth(); // Get admin status
  const [formState, setFormState] = useState<CalculatorState>({
    referencia: "",
    largura_mm: APP_CONFIG.DEFAULT_DIMENSIONS.WIDTH,
    altura_mm: APP_CONFIG.DEFAULT_DIMENSIONS.HEIGHT,
    profundidade_mm: APP_CONFIG.DEFAULT_DIMENSIONS.DEPTH,
    espessura_baffles_mm: APP_CONFIG.DEFAULT_DIMENSIONS.BAFFLE_THICKNESS as Thickness,
    numero_baffles: APP_CONFIG.DEFAULT_DIMENSIONS.BAFFLE_COUNT,
    caudal_m3_h: 5000,
    ruido_montante: {},
    noiseMode: 'LW'
  });

  const [showResults, setShowResults] = useState(false);
  const [attenuationResult, setAttenuationResult] = useState<AtenuacaoResult | null>(null);
  const [pressureLossResult, setPressureLossResult] = useState<PressureLossResult | null>(null);
  const [regeneratedNoiseResult, setRegeneratedNoiseResult] = useState<RegeneratedNoiseResult | null>(null);
  const [downstreamNoiseResult, setDownstreamNoiseResult] = useState<DownstreamNoiseResult | null>(null);
  const [finalPriceResult, setFinalPriceResult] = useState<FinalPriceResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = (withPrice: boolean = true) => {
    const element = resultsRef.current;
    if (!element) return;

    // Add monochrome class for B&W export
    element.classList.add('print-monochrome');
    
    // Hide price if requested
    if (!withPrice) {
      element.classList.add('print-no-price');
    }

    const opt = {
      margin: 10,
      filename: `Relatório_Silenciador_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 } as any,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      // Remove classes after export
      element.classList.remove('print-monochrome');
      element.classList.remove('print-no-price');
    }).catch((err: any) => {
      console.error("PDF Export Error:", err);
      element.classList.remove('print-monochrome');
      element.classList.remove('print-no-price');
    });
  };

  const calculations = useMemo(() => {
    const { largura_mm, altura_mm, espessura_baffles_mm, numero_baffles, caudal_m3_h, profundidade_mm } = formState;
    const largura_m = largura_mm / 1000;
    const altura_m = altura_mm / 1000;
    const espessura_m = espessura_baffles_mm / 1000;
    
    const gap_m = numero_baffles > 0 ? (largura_m - (numero_baffles * espessura_m)) / numero_baffles : 0;
    const area_livre_m2 = (largura_m - (numero_baffles * espessura_m)) * altura_m;
    const velocidade_ms = area_livre_m2 > 0 ? (caudal_m3_h / 3600) / area_livre_m2 : 0;

    const isValidVelocity = velocidade_ms <= APP_CONFIG.LIMITS.MAX_VELOCITY;
    const hasError = !isValidVelocity || area_livre_m2 <= 0;

    const thicknessCode = getThicknessLetter(espessura_baffles_mm);
    const countCode = getBaffleCountLetter(numero_baffles);
    const modelName = `SRC ${thicknessCode}${countCode} ${largura_mm}X${altura_mm}X${profundidade_mm}`;

    const noiseValues = Object.values(formState.ruido_montante).filter(v => !isNaN(v));
    const globalNoise = calculateLogSum(noiseValues);

    return {
      gap_mm: Math.round(gap_m * 1000),
      area_livre_m2: area_livre_m2.toFixed(3),
      velocidade_ms: velocidade_ms.toFixed(2),
      isValidVelocity,
      hasError,
      modelName,
      globalNoise
    };
  }, [formState]);

  const handleCalculate = () => {
    const attResult = calcularAtenuacao(
      formState.espessura_baffles_mm,
      formState.numero_baffles,
      formState.largura_mm,
      formState.altura_mm,
      formState.profundidade_mm
    );
    
    const pressResult = calcularPerdaCarga(
      formState.espessura_baffles_mm,
      formState.numero_baffles,
      formState.largura_mm,
      formState.altura_mm,
      formState.profundidade_mm,
      formState.caudal_m3_h,
      data.constants.pressure_loss.aerodynamic_factor // Pass configured factor
    );

    const regenNoise = calcularRuidoRegenerado(
      formState.caudal_m3_h,
      formState.largura_mm,
      formState.altura_mm,
      formState.numero_baffles,
      formState.espessura_baffles_mm
    );

    const downNoise = calcularRuidoJusante(
      formState.ruido_montante,
      attResult.bandas,
      regenNoise.bandas,
      formState.noiseMode
    );

    const priceResult = calcular_preco_final(
      {
        width_mm: formState.largura_mm,
        height_mm: formState.altura_mm,
        depth_mm: formState.profundidade_mm
      },
      formState.numero_baffles,
      formState.espessura_baffles_mm,
      data.pricing // Pass the full pricing data from context
    );

    setAttenuationResult(attResult);
    setPressureLossResult(pressResult);
    setRegeneratedNoiseResult(regenNoise);
    setDownstreamNoiseResult(downNoise);
    setFinalPriceResult(priceResult);
    setShowResults(true);
  };

  const handleInputChange = (field: keyof CalculatorState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setShowResults(false);
  };

  const handleNoiseChange = (hz: string, val: string) => {
    const numVal = parseFloat(val);
    setFormState(prev => ({
      ...prev,
      ruido_montante: { ...prev.ruido_montante, [hz]: isNaN(numVal) ? 0 : numVal }
    }));
  };

  const handleModeChange = (newMode: string) => {
    if (newMode === formState.noiseMode) return;
    const currentValues = formState.ruido_montante;
    const newValues: Record<string, number> = {};
    FREQUENCIES.forEach(freq => {
      const val = currentValues[freq];
      if (val !== undefined && !isNaN(val)) {
        const weight = A_WEIGHTING[freq] || 0;
        newValues[freq] = newMode === 'LWA' ? Number((val + weight).toFixed(1)) : Number((val - weight).toFixed(1));
      }
    });
    setFormState(prev => ({ ...prev, noiseMode: newMode as NoiseMode, ruido_montante: newValues }));
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!downstreamNoiseResult) return [];
    return FREQUENCIES.map(f => ({
      name: f,
      Upstream: downstreamNoiseResult.bandas[f]?.L_up || 0,
      Downstream: downstreamNoiseResult.bandas[f]?.L_down || 0,
      Regenerated: downstreamNoiseResult.bandas[f]?.L_reg || 0
    }));
  }, [downstreamNoiseResult]);

  if (showResults && attenuationResult) {
    return (
      <Layout>
        <div className="space-y-8 pb-20">
           <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>← Voltar</Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              Resultados de Atenuação
            </h1>
            <p className="text-muted-foreground mt-2 ml-12">
              Modelo: <span className="font-mono font-bold text-foreground">{calculations.modelName}</span>
            </p>
          </div>

          <div ref={resultsRef}>
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <CardTitle>Relatório de Cálculo</CardTitle>
                    <CardDescription>Data: {new Date().toLocaleDateString('pt-PT')} {new Date().toLocaleTimeString('pt-PT')}</CardDescription>
                    {formState.referencia && (
                      <p className="text-sm mt-1 text-primary font-bold">
                        Referência: {formState.referencia}
                      </p>
                    )}
                    <p className="text-sm mt-1">
                      Modelo: <span className="font-mono font-bold text-foreground">{calculations.modelName}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <img src={logoImage} alt="France Air Logo" className="h-12 object-contain pdf-logo hidden" />
                    {admin && <div className="text-sm text-muted-foreground">Utilizador: Admin</div>}
                  </div>
                </div>

                {/* INPUT PARAMETERS SECTION FOR PDF */}
                <Card className="mb-8 border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900/50 break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dados de Entrada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Dimensões (L x A x P)</span>
                        <span className="font-mono font-medium">
                          {formState.largura_mm} x {formState.altura_mm} x {formState.profundidade_mm} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Baffles</span>
                        <span className="font-mono font-medium">
                          {formState.numero_baffles} un. @ {formState.espessura_baffles_mm} mm
                        </span>
                      </div>
                       <div>
                        <span className="text-muted-foreground block mb-1">Caudal de Ar</span>
                        <span className="font-mono font-medium">
                          {formState.caudal_m3_h} m³/h
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">Velocidade de Face</span>
                        <span className="font-mono font-medium">
                          {calculations.velocidade_ms} m/s
                        </span>
                      </div>
                       <div>
                        <span className="text-muted-foreground block mb-1">Área Livre</span>
                        <span className="font-mono font-medium">
                          {calculations.area_livre_m2} m²
                        </span>
                      </div>
                      <div>
                         <span className="text-muted-foreground block mb-1">Gap entre Baffles</span>
                        <span className="font-mono font-medium">
                          {calculations.gap_mm} mm
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CardTitle>Atenuação Estimada por Banda (dB)</CardTitle>
                <CardDescription>Cálculo baseado na geometria e espessura dos baffles.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Frequência (Hz)</TableHead>
                      {FREQUENCIES.map(f => <TableHead key={f} className="text-center">{f}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">D_est (dB)</TableCell>
                      {FREQUENCIES.map(f => (
                        <TableCell key={f} className="text-center font-bold text-primary">
                          {attenuationResult.bandas[f]?.d_est?.toFixed(1) || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>

                <Card className="mt-8 border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Ruído Regenerado (Flow Noise)</CardTitle>
                    <CardDescription>Potência sonora gerada pelo escoamento (VDI 2081).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Frequência (Hz)</TableHead>
                          {FREQUENCIES.map(f => <TableHead key={f} className="text-center h-8">{f}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium py-2">LwA (dB)</TableCell>
                          {FREQUENCIES.map(f => (
                            <TableCell key={f} className="text-center font-mono text-sm py-2">
                              {regeneratedNoiseResult?.bandas[f]?.L_w_A_band?.toFixed(1) || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-medium text-muted-foreground py-2 text-xs">Lw Linear (dB)</TableCell>
                          {FREQUENCIES.map(f => (
                            <TableCell key={f} className="text-center text-xs text-muted-foreground py-2">
                              {regeneratedNoiseResult?.bandas[f]?.L_w_okt?.toFixed(1) || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="mt-4 flex justify-end">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block mb-1">LwA Global</span>
                        <span className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
                          {regeneratedNoiseResult?.L_w_A_global} <span className="text-sm font-sans font-normal text-muted-foreground">dB(A)</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NEW DOWNSTREAM NOISE SECTION */}
                {downstreamNoiseResult && (
                   <Card className="mt-8 border-blue-200 dark:border-blue-800 shadow-md break-inside-avoid">
                     <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 pb-4">
                       <CardTitle className="text-blue-700 dark:text-blue-400">Ruído a Jusante (L_down)</CardTitle>
                       <CardDescription>Nível sonoro final após silenciador, considerando atenuação e ruído regenerado.</CardDescription>
                     </CardHeader>
                     <CardContent className="pt-6">
                       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                         <div className="xl:col-span-2">
                           <Table>
                             <TableHeader>
                               <TableRow>
                                 <TableHead className="w-[100px]">Frequência (Hz)</TableHead>
                                 {FREQUENCIES.map(f => <TableHead key={f} className="text-center text-xs">{f}</TableHead>)}
                               </TableRow>
                             </TableHeader>
                             <TableBody>
                               <TableRow>
                                 <TableCell className="font-medium text-xs text-muted-foreground">L_up (Entrada)</TableCell>
                                 {FREQUENCIES.map(f => (
                                   <TableCell key={f} className="text-center text-xs text-muted-foreground">
                                     {downstreamNoiseResult.bandas[f]?.L_up.toFixed(1)}
                                   </TableCell>
                                 ))}
                               </TableRow>
                               <TableRow>
                                 <TableCell className="font-medium text-xs text-muted-foreground">D_est (Atenuação)</TableCell>
                                 {FREQUENCIES.map(f => (
                                   <TableCell key={f} className="text-center text-xs text-muted-foreground">
                                     -{downstreamNoiseResult.bandas[f]?.D_est.toFixed(1)}
                                   </TableCell>
                                 ))}
                               </TableRow>
                               <TableRow>
                                 <TableCell className="font-medium text-xs text-muted-foreground">L_reg (Regenerado)</TableCell>
                                 {FREQUENCIES.map(f => (
                                   <TableCell key={f} className="text-center text-xs text-muted-foreground">
                                     {downstreamNoiseResult.bandas[f]?.L_reg.toFixed(1)}
                                   </TableCell>
                                 ))}
                               </TableRow>
                               <TableRow className="bg-blue-50/50 dark:bg-blue-900/20 border-t-2 border-blue-100 dark:border-blue-800">
                                 <TableCell className="font-bold text-blue-700 dark:text-blue-400">L_down (Saída)</TableCell>
                                 {FREQUENCIES.map(f => (
                                   <TableCell key={f} className="text-center font-bold text-blue-700 dark:text-blue-400">
                                     {downstreamNoiseResult.bandas[f]?.L_down.toFixed(1)}
                                   </TableCell>
                                 ))}
                               </TableRow>
                             </TableBody>
                           </Table>
                         </div>
                         
                         <div className="h-[250px] w-full bg-white dark:bg-slate-950/50 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                           <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                               <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                               <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                               <Tooltip 
                                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                 labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                               />
                               <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                               <Line type="monotone" dataKey="Upstream" stroke="#94a3b8" strokeWidth={2} dot={{r: 3}} name="Entrada" />
                               <Line type="monotone" dataKey="Downstream" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Saída" />
                               <Line type="monotone" dataKey="Regenerated" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Regenerado" />
                             </LineChart>
                           </ResponsiveContainer>
                         </div>
                       </div>

                       <div className="mt-6 flex justify-end items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block mb-1">L_down Global</span>
                            <span className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                              {downstreamNoiseResult.L_down_global} <span className="text-lg font-sans font-normal text-muted-foreground">dB{formState.noiseMode === 'LWA' ? '(A)' : ''}</span>
                            </span>
                          </div>
                       </div>
                     </CardContent>
                   </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 break-inside-avoid">
                  {/* Atenuação Global */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-primary">Atenuação Global</h3>
                      <p className="text-sm text-muted-foreground">Soma logarítmica</p>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {attenuationResult.global_est} <span className="text-xl font-normal text-muted-foreground">dB</span>
                    </div>
                  </div>

                  {/* Perda de Carga */}
                  {pressureLossResult && (
                    <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/20 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-orange-600 dark:text-orange-400">Perda de Carga (Δp)</h3>
                        <p className="text-sm text-muted-foreground">Coeficiente ζ: {pressureLossResult.zeta}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Fator Aero: {data.constants.pressure_loss.aerodynamic_factor}
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                        {pressureLossResult.delta_p_Pa} <span className="text-xl font-normal text-muted-foreground">Pa</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PREÇO FINAL - Moved up for PDF layout */}
                {finalPriceResult && (
                  <div className="mt-4 break-inside-avoid price-section">
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm flex flex-col justify-center">
                        <span className="text-sm text-muted-foreground block mb-1"><strong>Preço de Tabela:</strong></span>
                        <span className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                          <strong>{(() => {
                            const coefCusto = parseFloat(localStorage.getItem('coefCusto') || '1.05');
                            const coefVenda = parseFloat(localStorage.getItem('coefVenda') || '2.353');
                            const precoCusto = finalPriceResult.preco_final * coefCusto;
                            return (precoCusto * coefVenda).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
                          })()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Cost details hidden in PDF, visible only for Admin in UI */}
                    {admin && (
                      <div className="pdf-hidden">
                        <Accordion type="single" collapsible className="w-full mt-4">
                          <AccordionItem value="detalhes-preco" className="border rounded-lg px-4 bg-white dark:bg-card">
                            <AccordionTrigger className="hover:no-underline py-3">
                              <span className="text-sm font-semibold text-muted-foreground">Ver detalhe de custos (Admin)</span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                <div className="space-y-2">
                                  <h4 className="font-bold text-foreground border-b pb-1 mb-2">Custos Diretos</h4>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Caixa (Materiais + MO):</span>
                                    <span className="font-mono font-bold">{finalPriceResult.custo_caixa.subtotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Baffles (Materiais + MO):</span>
                                    <span className="font-mono font-bold">{finalPriceResult.custo_baffles.subtotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                  <div className="flex justify-between font-bold pt-1 border-t text-orange-600">
                                    <span>Subtotal Direto:</span>
                                    <span className="font-mono">{finalPriceResult.subtotal_direto.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-bold text-foreground border-b pb-1 mb-2">Custos Indiretos & Margem</h4>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custos Indiretos:</span>
                                    <span className="font-mono font-bold">{finalPriceResult.custos_indiretos_valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Margem de Lucro:</span>
                                    <span className="font-mono font-bold">{finalPriceResult.margem_lucro_valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                  <div className="flex justify-between font-bold pt-1 border-t text-green-600">
                                    <span>Total Adicional:</span>
                                    <span className="font-mono">{(finalPriceResult.custos_indiretos_valor + finalPriceResult.margem_lucro_valor).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-8 gap-4">
            <Button onClick={() => handleExportPDF(false)} variant="outline" className="gap-2" size="lg">
              <Download className="h-4 w-4" />
              Exportar PDF (sem preços)
            </Button>
            <Button onClick={() => handleExportPDF(true)} className="gap-2" size="lg">
              <Download className="h-4 w-4" />
              Exportar PDF (com preços)
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalcIcon className="h-6 w-6 text-primary" />
            </div>
            Calculadora de Silenciadores
          </h1>
          <p className="text-muted-foreground mt-2 ml-12">
            Dimensionamento e validação de modelos SRC.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados de Entrada</CardTitle>
                <CardDescription>Dimensões do silenciador e condições de operação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center bg-muted/30 p-4 rounded-lg border border-border/50">
                   <img 
                     src={silencerDimsImage} 
                     alt="Esquema de dimensões do silenciador" 
                     className="max-h-48 object-contain mix-blend-multiply dark:mix-blend-normal dark:opacity-90"
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referência</Label>
                    <Input 
                      id="referencia" 
                      placeholder="Ex: Obra XPTO - Piso 1" 
                      value={formState.referencia} 
                      onChange={(e) => handleInputChange('referencia', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="largura">Largura (mm) <span className="text-destructive">*</span></Label>
                    <Input id="largura" type="number" value={formState.largura_mm} onChange={(e) => handleInputChange('largura_mm', Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altura">Altura (mm) <span className="text-destructive">*</span></Label>
                    <Input id="altura" type="number" value={formState.altura_mm} onChange={(e) => handleInputChange('altura_mm', Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profundidade">Profundidade (mm) <span className="text-destructive">*</span></Label>
                    <Input id="profundidade" type="number" value={formState.profundidade_mm} onChange={(e) => handleInputChange('profundidade_mm', Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caudal">Caudal (m³/h) <span className="text-destructive">*</span></Label>
                    <Input id="caudal" type="number" value={formState.caudal_m3_h} onChange={(e) => handleInputChange('caudal_m3_h', Number(e.target.value))} className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="espessura">Espessura Baffles (mm) <span className="text-destructive">*</span></Label>
                    <Select value={formState.espessura_baffles_mm.toString()} onValueChange={(val) => handleInputChange('espessura_baffles_mm', Number(val))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 mm</SelectItem>
                        <SelectItem value="200">200 mm</SelectItem>
                        <SelectItem value="300">300 mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="n_baffles">Nº de Baffles <span className="text-destructive">*</span></Label>
                    <Input id="n_baffles" type="number" min={1} value={formState.numero_baffles} onChange={(e) => handleInputChange('numero_baffles', Number(e.target.value))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Ruído a Montante</CardTitle>
                    <CardDescription>Espectro sonoro na entrada (opcional).</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Tabs value={formState.noiseMode} onValueChange={handleModeChange} className="h-8">
                      <TabsList className="h-8">
                        <TabsTrigger value="LW" className="text-xs px-3 h-6">LW (Linear)</TabsTrigger>
                        <TabsTrigger value="LWA" className="text-xs px-3 h-6">LWA (Ponderado A)</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="text-right min-w-[100px]">
                      <span className="text-xs font-medium uppercase text-muted-foreground block">Nível Global</span>
                      <span className="text-2xl font-bold font-mono text-primary">
                        {calculations.globalNoise} <span className="text-sm font-sans text-muted-foreground">dB{formState.noiseMode === 'LWA' ? '(A)' : ''}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {FREQUENCIES.map((freq) => (
                    <div key={freq} className="space-y-1">
                      <Label htmlFor={`f-${freq}`} className="text-xs text-muted-foreground text-center block">{freq}</Label>
                      <Input 
                        id={`f-${freq}`} placeholder="dB" value={formState.ruido_montante[freq] || ''} 
                        className="h-8 text-sm text-center px-1" onChange={(e) => handleNoiseChange(freq, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-primary shadow-lg">
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Cálculo em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5 p-4 bg-muted rounded-md border border-border">
                  <Label className="text-xs font-medium text-muted-foreground uppercase">Modelo SRC</Label>
                  <div className="font-mono text-lg font-bold tracking-tight break-all text-primary">
                    {calculations.modelName}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Velocidade (m/s)</Label>
                    <div className={`text-2xl font-bold ${calculations.isValidVelocity ? 'text-foreground' : 'text-destructive'}`}>
                      {calculations.velocidade_ms}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Área Livre (m²)</Label>
                    <div className="text-2xl font-bold text-foreground">{calculations.area_livre_m2}</div>
                  </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gap Calculado (mm)</Label>
                    <div className="text-lg font-medium text-foreground">{calculations.gap_mm}</div>
                </div>
                {!calculations.isValidVelocity && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Velocidade Excessiva</AlertTitle>
                    <AlertDescription>A velocidade ultrapassa o limite de 20 m/s. Por favor ajuste as dimensões ou baffles.</AlertDescription>
                  </Alert>
                )}
                {Number(calculations.area_livre_m2) <= 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro Geométrico</AlertTitle>
                    <AlertDescription>A área livre é inválida. Verifique o número e espessura dos baffles em relação à largura.</AlertDescription>
                  </Alert>
                )}
                <Button className="w-full mt-4" size="lg" disabled={calculations.hasError} onClick={handleCalculate}>
                  Seguinte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
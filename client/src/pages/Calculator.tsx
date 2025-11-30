import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext"; // Import useData
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Calculator as CalcIcon, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import silencerDimsImage from "@assets/image_1764355007570.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularPerdaCarga, PressureLossResult } from "@/core/pressureLoss";
import { calcularAtenuacao, AtenuacaoResult } from "@/core/attenuation";
import { calcularRuidoRegenerado, RegeneratedNoiseResult } from "@/core/regeneratedNoise";
import { calcularRuidoJusante, DownstreamNoiseResult } from "@/core/downstreamNoise";
import { calcular_preco_total, FinalPriceResult } from "@/core/pricing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Types
type Thickness = 100 | 200 | 300;
type NoiseMode = 'LW' | 'LWA';

interface CalculatorState {
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
  const [formState, setFormState] = useState<CalculatorState>({
    largura_mm: 1200,
    altura_mm: 800,
    profundidade_mm: 1000,
    espessura_baffles_mm: 200,
    numero_baffles: 4,
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

  const calculations = useMemo(() => {
    const { largura_mm, altura_mm, espessura_baffles_mm, numero_baffles, caudal_m3_h, profundidade_mm } = formState;
    const largura_m = largura_mm / 1000;
    const altura_m = altura_mm / 1000;
    const espessura_m = espessura_baffles_mm / 1000;
    
    const gap_m = numero_baffles > 0 ? (largura_m - (numero_baffles * espessura_m)) / numero_baffles : 0;
    const area_livre_m2 = (largura_m - (numero_baffles * espessura_m)) * altura_m;
    const velocidade_ms = area_livre_m2 > 0 ? (caudal_m3_h / 3600) / area_livre_m2 : 0;

    const isValidVelocity = velocidade_ms <= 20;
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

    const priceResult = calcular_preco_total(
      {
        width_mm: formState.largura_mm,
        height_mm: formState.altura_mm,
        depth_mm: formState.profundidade_mm
      },
      formState.numero_baffles,
      formState.espessura_baffles_mm,
      data.pricing_caixa,
      data.pricing_baffle
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

          <Card>
            <CardHeader>
              <CardTitle>Atenuação Estimada por Banda (dB)</CardTitle>
              <CardDescription>Cálculo baseado na geometria e espessura dos baffles.</CardDescription>
            </CardHeader>
            <CardContent>
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

              <Card className="mt-8 border-slate-200 dark:border-slate-800 shadow-sm">
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
                 <Card className="mt-8 border-blue-200 dark:border-blue-800 shadow-md">
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
                               <TableHead className="w-[100px]">Frequência</TableHead>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
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

              {/* PREÇO FINAL */}
              {finalPriceResult && (
                <div className="mt-8">
                   <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-xl text-green-700 dark:text-green-400">Preço Final Estimado</h3>
                      <p className="text-sm text-muted-foreground">Cálculo detalhado por componentes (Caixa + Baffles)</p>
                    </div>
                    <div className="text-5xl font-bold text-green-700 dark:text-green-400">
                      {finalPriceResult.preco_total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="detalhes-preco" className="border rounded-lg px-4 bg-white dark:bg-card">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium text-muted-foreground">Ver detalhe de custos (Estrutura Excel)</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2">
                        <div className="grid grid-cols-1 gap-6 text-sm">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Caixa */}
                            <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                              <h4 className="font-semibold text-foreground mb-2">1. Caixa (C14)</h4>
                              <div className="space-y-1 text-xs text-muted-foreground mb-2">
                                <div className="flex justify-between"><span>Materiais:</span> <span>{finalPriceResult.preco_caixa.custo_materiais.toFixed(2)} €</span></div>
                                <div className="flex justify-between"><span>Mão de Obra:</span> <span>{finalPriceResult.preco_caixa.custo_mao_de_obra.toFixed(2)} €</span></div>
                                <div className="flex justify-between border-t pt-1 mt-1"><span>Subtotal:</span> <span>{finalPriceResult.preco_caixa.subtotal.toFixed(2)} €</span></div>
                              </div>
                              <div className="flex justify-between font-bold text-green-700 pt-2 border-t border-green-200">
                                <span>Preço Caixa:</span>
                                <span>{finalPriceResult.preco_caixa.preco_final.toFixed(2)} €</span>
                              </div>
                            </div>

                            {/* Atenuador Baffles */}
                            <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                              <h4 className="font-semibold text-foreground mb-2">2. Atenuador Baffles (C15)</h4>
                              <div className="space-y-1 text-xs text-muted-foreground mb-2">
                                <div className="flex justify-between"><span>Materiais:</span> <span>{finalPriceResult.preco_atenuador_baffle.custo_materiais.toFixed(2)} €</span></div>
                                <div className="flex justify-between"><span>Mão de Obra:</span> <span>{finalPriceResult.preco_atenuador_baffle.custo_mao_de_obra.toFixed(2)} €</span></div>
                                <div className="flex justify-between border-t pt-1 mt-1"><span>Subtotal:</span> <span>{finalPriceResult.preco_atenuador_baffle.subtotal.toFixed(2)} €</span></div>
                              </div>
                              <div className="flex justify-between font-bold text-green-700 pt-2 border-t border-green-200">
                                <span>Preço Baffles:</span>
                                <span>{finalPriceResult.preco_atenuador_baffle.preco_final.toFixed(2)} €</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-green-50 border border-green-100 rounded-md text-center">
                            <span className="text-green-800 font-medium text-sm">
                              Fórmula: Caixa ({finalPriceResult.preco_caixa.preco_final.toFixed(2)}) + 
                              Baffles ({finalPriceResult.preco_atenuador_baffle.preco_final.toFixed(2)}) = 
                              <span className="font-bold ml-1">{finalPriceResult.preco_total.toFixed(2)} €</span>
                            </span>
                          </div>
                          
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
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
                <CardDescription>Definição geométrica e caudal de ar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largura (mm)</Label>
                    <Input 
                      id="width" 
                      type="number" 
                      min="100" 
                      value={formState.largura_mm} 
                      onChange={(e) => handleInputChange('largura_mm', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (mm)</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      min="100" 
                      value={formState.altura_mm} 
                      onChange={(e) => handleInputChange('altura_mm', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Profundidade (mm)</Label>
                    <Input 
                      id="depth" 
                      type="number" 
                      min="100" 
                      value={formState.profundidade_mm} 
                      onChange={(e) => handleInputChange('profundidade_mm', Number(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Espessura das Células</Label>
                    <Select 
                      value={formState.espessura_baffles_mm.toString()} 
                      onValueChange={(v) => handleInputChange('espessura_baffles_mm', Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a espessura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 mm</SelectItem>
                        <SelectItem value="200">200 mm</SelectItem>
                        <SelectItem value="300">300 mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baffles">Número de Células</Label>
                    <Input 
                      id="baffles" 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={formState.numero_baffles} 
                      onChange={(e) => handleInputChange('numero_baffles', Number(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="flow" className="text-base">Caudal de Ar (m³/h)</Label>
                  <div className="flex gap-4 items-center">
                    <Input 
                      id="flow" 
                      type="number" 
                      min="0" 
                      className="text-lg font-mono"
                      value={formState.caudal_m3_h} 
                      onChange={(e) => handleInputChange('caudal_m3_h', Number(e.target.value))}
                    />
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      Velocidade: <span className={calculations.isValidVelocity ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{calculations.velocidade_ms} m/s</span>
                    </div>
                  </div>
                  {!calculations.isValidVelocity && (
                    <p className="text-xs text-red-500 font-medium mt-1">Atenção: Velocidade excessiva ({'>'} 20 m/s)</p>
                  )}
                </div>

                <Button 
                  className="w-full h-12 text-lg gap-2 mt-4" 
                  onClick={handleCalculate}
                  disabled={calculations.hasError}
                >
                  <CalcIcon className="w-5 h-5" />
                  Calcular Resultados
                </Button>
              </CardContent>
            </Card>
            
            {/* Initial Guidance / Empty State */}
            <div className="bg-muted/30 rounded-lg p-6 border border-dashed flex flex-col items-center justify-center text-center h-[200px]">
              <div className="p-3 bg-background rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-foreground">Resultados detalhados</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Preencha os dados geométricos e clique em "Calcular" para ver a atenuação, perda de carga e preço.
              </p>
            </div>
          </div>

          <div className="space-y-6">
             {/* RUÍDO DE ENTRADA */}
             <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ruído a Montante (L_up)</CardTitle>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                    <button 
                      onClick={() => handleModeChange('LW')}
                      className={`text-xs px-2 py-1 rounded-sm transition-colors ${formState.noiseMode === 'LW' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Lw
                    </button>
                    <button 
                      onClick={() => handleModeChange('LWA')}
                      className={`text-xs px-2 py-1 rounded-sm transition-colors ${formState.noiseMode === 'LWA' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Lw(A)
                    </button>
                  </div>
                </div>
                <CardDescription>Espectro sonoro na entrada do silenciador.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FREQUENCIES.map((hz) => (
                    <div key={hz} className="grid grid-cols-4 items-center gap-2">
                      <Label htmlFor={`noise-${hz}`} className="text-xs text-muted-foreground text-right col-span-1">{hz} Hz</Label>
                      <Input 
                        id={`noise-${hz}`}
                        type="number" 
                        className="h-8 text-right font-mono col-span-2"
                        placeholder="0"
                        value={formState.ruido_montante[hz] || ''}
                        onChange={(e) => handleNoiseChange(hz, e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground col-span-1">dB</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center px-2">
                    <span className="font-semibold text-sm">Total Global</span>
                    <span className="font-mono font-bold text-primary">{calculations.globalNoise} dB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
               <div className="aspect-square w-full bg-white p-6 flex items-center justify-center">
                  <img 
                    src={silencerDimsImage} 
                    alt="Esquema Silenciador" 
                    className="max-w-full max-h-full object-contain opacity-90"
                  />
               </div>
               <div className="bg-muted/50 p-4 text-xs text-muted-foreground border-t">
                 <div className="grid grid-cols-2 gap-2">
                   <div><span className="font-bold">L:</span> Largura</div>
                   <div><span className="font-bold">H:</span> Altura</div>
                   <div><span className="font-bold">P:</span> Profundidade</div>
                   <div><span className="font-bold">S:</span> Espessura Baffle</div>
                 </div>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Calculator as CalcIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Types
type Thickness = 100 | 200 | 300;

interface CalculatorState {
  largura_mm: number;
  altura_mm: number;
  profundidade_mm: number;
  espessura_baffles_mm: Thickness;
  numero_baffles: number;
  caudal_m3_h: number;
  ruido_montante: Record<string, number>; // Hz -> dB
}

const FREQUENCIES = ["63", "125", "250", "500", "1000", "2000", "4000", "8000"];

// Helper for Logarithmic Sum
const calculateLogSum = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + Math.pow(10, val / 10), 0);
  return Math.round(10 * Math.log10(sum) * 10) / 10;
};

// Helper for Model Code Generation
const getThicknessLetter = (t: Thickness): string => {
  const map: Record<number, string> = { 100: 'X', 200: 'Y', 300: 'Z' };
  return map[t] || '?';
};

const getBaffleCountLetter = (n: number): string => {
  if (n < 1) return '?';
  // A=1, B=2... Z=26. After that AA, AB? Usually these tables stop around Z. 
  // Assuming simplified A-Z for now as per requirement "Letra nº baffles: A=1...".
  // ASCII 'A' is 65.
  if (n <= 26) return String.fromCharCode(64 + n);
  return '?'; // Out of range for simple letter code
};

export default function Calculator() {
  // Form State
  const [formState, setFormState] = useState<CalculatorState>({
    largura_mm: 1200,
    altura_mm: 800,
    profundidade_mm: 1000,
    espessura_baffles_mm: 200,
    numero_baffles: 4,
    caudal_m3_h: 5000,
    ruido_montante: {}
  });

  // Derived Calculations
  const calculations = useMemo(() => {
    const { 
      largura_mm, 
      altura_mm, 
      espessura_baffles_mm, 
      numero_baffles, 
      caudal_m3_h,
      ruido_montante 
    } = formState;

    const largura_m = largura_mm / 1000;
    const altura_m = altura_mm / 1000;
    const espessura_m = espessura_baffles_mm / 1000;
    
    // User formula: gap_m = (largura_m - numero_baffles * espessura_m) / numero_baffles
    const gap_m = numero_baffles > 0 
      ? (largura_m - (numero_baffles * espessura_m)) / numero_baffles 
      : 0;

    // User formula: area_livre_m2 = (largura_m - numero_baffles * espessura_m) * altura_m
    const area_livre_m2 = (largura_m - (numero_baffles * espessura_m)) * altura_m;

    // User formula: velocidade_ms = (caudal_m3_h/3600) / area_livre_m2
    const velocidade_ms = area_livre_m2 > 0 
      ? (caudal_m3_h / 3600) / area_livre_m2 
      : 0;

    const isValidVelocity = velocidade_ms <= 20;
    const hasError = !isValidVelocity || area_livre_m2 <= 0;

    // Model Name Generation
    const thicknessCode = getThicknessLetter(espessura_baffles_mm);
    const countCode = getBaffleCountLetter(numero_baffles);
    const modelName = `SRC ${thicknessCode}${countCode} ${largura_mm}X${altura_mm}X${formState.profundidade_mm}`;

    // Logarithmic Sum of Noise
    const noiseValues = Object.values(ruido_montante).filter(v => !isNaN(v));
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

  const handleInputChange = (field: keyof CalculatorState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleNoiseChange = (hz: string, val: string) => {
    const numVal = parseFloat(val);
    setFormState(prev => ({
      ...prev,
      ruido_montante: {
        ...prev.ruido_montante,
        [hz]: isNaN(numVal) ? 0 : numVal
      }
    }));
  };

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
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Geometria e Caudal */}
            <Card>
              <CardHeader>
                <CardTitle>Dados de Entrada</CardTitle>
                <CardDescription>Dimensões do silenciador e condições de operação.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="largura">Largura (mm) <span className="text-destructive">*</span></Label>
                  <Input 
                    id="largura" 
                    type="number" 
                    value={formState.largura_mm} 
                    onChange={(e) => handleInputChange('largura_mm', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (mm) <span className="text-destructive">*</span></Label>
                  <Input 
                    id="altura" 
                    type="number" 
                    value={formState.altura_mm} 
                    onChange={(e) => handleInputChange('altura_mm', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profundidade">Profundidade (mm) <span className="text-destructive">*</span></Label>
                  <Input 
                    id="profundidade" 
                    type="number" 
                    value={formState.profundidade_mm} 
                    onChange={(e) => handleInputChange('profundidade_mm', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caudal">Caudal (m³/h) <span className="text-destructive">*</span></Label>
                  <Input 
                    id="caudal" 
                    type="number" 
                    value={formState.caudal_m3_h} 
                    onChange={(e) => handleInputChange('caudal_m3_h', Number(e.target.value))}
                    className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="espessura">Espessura Baffles (mm) <span className="text-destructive">*</span></Label>
                  <Select 
                    value={formState.espessura_baffles_mm.toString()} 
                    onValueChange={(val) => handleInputChange('espessura_baffles_mm', Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 mm</SelectItem>
                      <SelectItem value="200">200 mm</SelectItem>
                      <SelectItem value="300">300 mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="n_baffles">Nº de Baffles <span className="text-destructive">*</span></Label>
                  <Input 
                    id="n_baffles" 
                    type="number" 
                    min={1}
                    value={formState.numero_baffles} 
                    onChange={(e) => handleInputChange('numero_baffles', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ruído a Montante (Opcional) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Ruído a Montante</CardTitle>
                    <CardDescription>Espectro sonoro na entrada (opcional).</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium uppercase text-muted-foreground block">Nível Global</span>
                    <span className="text-2xl font-bold font-mono text-primary">{calculations.globalNoise} <span className="text-sm font-sans text-muted-foreground">dB</span></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {FREQUENCIES.map((freq) => (
                    <div key={freq} className="space-y-1">
                      <Label htmlFor={`f-${freq}`} className="text-xs text-muted-foreground text-center block">{freq}</Label>
                      <Input 
                        id={`f-${freq}`}
                        placeholder="dB" 
                        className="h-8 text-sm text-center px-1"
                        onChange={(e) => handleNoiseChange(freq, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Results & Summary */}
          <div className="space-y-6">
            <Card className="border-l-4 border-l-primary shadow-lg">
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Cálculo em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Model Name Display */}
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
                    <div className="text-2xl font-bold text-foreground">
                      {calculations.area_livre_m2}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gap Calculado (mm)</Label>
                    <div className="text-lg font-medium text-foreground">
                      {calculations.gap_mm}
                    </div>
                </div>

                {/* Validation Alert */}
                {!calculations.isValidVelocity && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Velocidade Excessiva</AlertTitle>
                    <AlertDescription>
                      A velocidade ultrapassa o limite de 20 m/s. Por favor ajuste as dimensões ou baffles.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error State for Geometry */}
                {Number(calculations.area_livre_m2) <= 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro Geométrico</AlertTitle>
                    <AlertDescription>
                      A área livre é inválida. Verifique o número e espessura dos baffles em relação à largura.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  disabled={calculations.hasError}
                >
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

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Save, Settings2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data, updatePricing, updateAttenuation, updateConstant, resetData } = useData();

  if (!user || user.role !== 'admin') {
    setLocation('/admin/login');
    return null;
  }

  // Helper to format key labels
  const formatLabel = (key: string) => {
    const labels: Record<string, string> = {
      'chapa_08_mm_m2': 'Chapa 0.8mm (m²)',
      'chapa_06_mm_m2': 'Chapa 0.6mm (m²)',
      'la_knauf_m2': 'Lã Knauf (m²)',
      'la_knauf_sem_pelicula_m2': 'Lã Knauf s/ película (m²)',
      'perfil_p30_ml': 'Perfil P30 (m.l)',
      'cantos_metalicos_un': 'Cantos metálicos (un)',
      'rebites_un': 'Rebites (un)',
      'palete_embalagem_un': 'Palete + Embalagem (un)',
      'mao_obra_caixa_m2': 'Mão de obra caixa (€/m²)',
      'mao_obra_baffles_m2': 'Mão de obra baffles (€/m²)',
      'custos_indiretos': 'Custos indiretos (%)',
      'lucro': 'Lucro (%)'
    };
    return labels[key] || key.replace(/_/g, ' ');
  };

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
            <p className="text-muted-foreground mt-2">Gestão de preços e parâmetros de cálculo.</p>
          </div>
          <Button variant="outline" onClick={resetData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Repor Valores de Fábrica
          </Button>
        </div>

        <Tabs defaultValue="precos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="precos">Preços Unitários</TabsTrigger>
            <TabsTrigger value="atenuacao">Atenuação (Ref)</TabsTrigger>
            <TabsTrigger value="constantes">Constantes de Cálculo</TabsTrigger>
          </TabsList>

          <TabsContent value="precos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materiais</CardTitle>
                  <CardDescription>Preços por unidade de medida (€).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-[120px]">Valor (€)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.pricing.materials).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{formatLabel(key)}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={value} 
                              onChange={(e) => updatePricing('materials', key, Number(e.target.value))}
                              className="h-8 w-24 text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mão de Obra</CardTitle>
                    <CardDescription>Custo por m² ou unidade.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-[120px]">Valor (€)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(data.pricing.labor).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{formatLabel(key)}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={value} 
                                onChange={(e) => updatePricing('labor', key, Number(e.target.value))}
                                className="h-8 w-24 text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fatores e Margens</CardTitle>
                    <CardDescription>Percentagens aplicadas ao cálculo (Ex: 0.15 = 15%).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fator</TableHead>
                          <TableHead className="w-[120px]">Valor (Dec)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(data.pricing.factors).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{formatLabel(key)}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={value} 
                                onChange={(e) => updatePricing('factors', key, Number(e.target.value))}
                                className="h-8 w-24 text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="atenuacao">
             <Card>
                <CardHeader>
                  <CardTitle>Tabela de Atenuação de Referência (D_ref)</CardTitle>
                  <CardDescription>Base de dados de ensaios (editável).</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Espessura (mm)</TableHead>
                          <TableHead>Frequência (Hz)</TableHead>
                          <TableHead className="text-right">Atenuação (dB)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.attenuation.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.id}</TableCell>
                            <TableCell>{row.espessura_mm}</TableCell>
                            <TableCell>{row.frequencia_hz}</TableCell>
                            <TableCell className="text-right">
                               <Input 
                                type="number" 
                                value={row.d_ref_db} 
                                onChange={(e) => updateAttenuation(row.id, Number(e.target.value))}
                                className="h-8 w-24 ml-auto text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="constantes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Parâmetros de Perda de Carga
                </CardTitle>
                <CardDescription>Ajuste de coeficientes aerodinâmicos e constantes de cálculo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Fator Aerodinâmico (Baffles)</Label>
                    <p className="text-sm text-muted-foreground">
                      Coeficiente aplicado à perda de carga total para compensar o perfil aerodinâmico das células.
                      <br/>
                      <span className="text-xs opacity-70">Valor padrão: 0.5 (Reduz a perda de carga em 50%)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      step="0.05"
                      min="0.1"
                      max="2.0"
                      className="w-24 text-right font-mono"
                      value={data.constants.pressure_loss.aerodynamic_factor}
                      onChange={(e) => updateConstant('pressure_loss', 'aerodynamic_factor', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

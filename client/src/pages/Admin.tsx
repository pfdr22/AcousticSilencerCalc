import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Save, Settings2, Box, Layers } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data, updatePrecoCaixa, updateAttenuation, updateConstant, resetData } = useData();

  if (!user || user.role !== 'admin') {
    setLocation('/admin/login');
    return null;
  }

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

        <Tabs defaultValue="precos_caixa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="precos_caixa" className="gap-2"><Box className="w-4 h-4"/> Preços Unitários</TabsTrigger>
            <TabsTrigger value="atenuacao">Atenuação (Ref)</TabsTrigger>
            <TabsTrigger value="constantes">Constantes de Cálculo</TabsTrigger>
          </TabsList>

          <TabsContent value="precos_caixa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preços Unitários (Caixa e Baffles)</CardTitle>
                <CardDescription>Materiais, serviços e fatores para o cálculo de preço.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[150px] text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pricing_caixa.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell className="text-muted-foreground text-sm capitalize">{item.tipo}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input 
                              type="number" 
                              step={item.tipo === 'fator' ? "1" : "0.01"}
                              value={item.valor} 
                              onChange={(e) => updatePrecoCaixa(item.id, Number(e.target.value))}
                              className="h-8 w-24 text-right"
                            />
                            <span className="text-sm text-muted-foreground w-4">
                              {item.tipo === 'fator' ? '%' : '€'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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

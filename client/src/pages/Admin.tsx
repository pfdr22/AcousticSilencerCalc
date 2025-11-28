import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Save } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data, updatePricing, updateAttenuation, resetData } = useData();

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

        <Tabs defaultValue="precos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="precos">Preços Unitários</TabsTrigger>
            <TabsTrigger value="atenuacao">Atenuação (Ref)</TabsTrigger>
            {/* <TabsTrigger value="constantes">Constantes VDI</TabsTrigger> */}
          </TabsList>

          <TabsContent value="precos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materiais (Caixa e Baffles)</CardTitle>
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
                          <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
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
                    <CardDescription>Custo por m².</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-[120px]">Valor (€/m²)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(data.pricing.labor).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
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
                    <CardDescription>Percentagens aplicadas ao cálculo.</CardDescription>
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
                            <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
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
        </Tabs>
      </div>
    </Layout>
  );
}

import Layout from "@/components/Layout";
import { api } from "@/api/mockApi";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { data: users } = useQuery({ 
    queryKey: ['users'], 
    queryFn: api.users.list 
  });

  const { data: refAtenuacao } = useQuery({ 
    queryKey: ['refAtenuacao'], 
    queryFn: api.data.getRefAtenuacao 
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground mt-2">Gestão de dados e utilizadores.</p>
        </div>

        <Tabs defaultValue="db" className="space-y-4">
          <TabsList>
            <TabsTrigger value="db">Base de Dados</TabsTrigger>
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
          </TabsList>

          <TabsContent value="db" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tabelas de Referência</CardTitle>
                <CardDescription>Visualização dos dados mockados (ref_atenuacao).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Espessura (mm)</TableHead>
                      <TableHead>Frequência (Hz)</TableHead>
                      <TableHead className="text-right">Atenuação (dB)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refAtenuacao?.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.id}</TableCell>
                        <TableCell>{row.espessura_mm}</TableCell>
                        <TableCell>{row.frequencia_hz}</TableCell>
                        <TableCell className="text-right">{row.d_ref_db}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Utilizadores</CardTitle>
                <CardDescription>Lista de utilizadores registados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

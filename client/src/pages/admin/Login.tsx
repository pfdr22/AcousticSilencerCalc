import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import logoImage from "@assets/FRANCE_AIR_AIRVANCE_Logo_Preto100_4cores_(1)_1764843216985.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginAdmin, admin } = useAuth();
  const [_, setLocation] = useLocation();

  // If already logged in as admin, redirect to Admin Panel
  if (admin) {
    setLocation('/admin'); 
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await loginAdmin(email, password);
    if (success) {
      setLocation('/admin'); // Redirect to Admin Panel
    } else {
      setError("Email ou password incorretos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-lg h-20 w-auto flex items-center justify-center overflow-hidden">
              <img src={logoImage} alt="France Air" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Administração</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Acesso reservado a administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@france-air.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-red-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-red-500/50"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Entrar no Painel
            </Button>
            
            <div className="pt-4 text-center">
              <Button 
                variant="link" 
                className="text-slate-500 hover:text-slate-400 text-sm"
                onClick={() => setLocation('/')}
                type="button"
              >
                ← Voltar ao Site
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

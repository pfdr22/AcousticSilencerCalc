import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Building2 } from "lucide-react";
import logoImage from "@assets/FRANCE_AIR_AIRVANCE_Logo_Preto100_4cores_(1)_1764843216985.jpg";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser, user } = useAuth();
  const [_, setLocation] = useLocation();

  // If already logged in as user, redirect to Dashboard
  if (user) {
    setLocation('/'); 
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await loginUser(email, password);
    if (success) {
      setLocation('/'); 
    } else {
      setError("Email ou password incorretos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-auto px-4 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100 overflow-hidden">
               <img src={logoImage} alt="France Air" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold text-slate-800">Bem-vindo</CardTitle>
          <CardDescription className="text-center text-slate-500">
            Inicie sessão para aceder à Calculadora SRC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="utilizador@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700">
              Iniciar Sessão
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/admin/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              Área reservada
            </Link>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            © France Air - Calculadora Acústica
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

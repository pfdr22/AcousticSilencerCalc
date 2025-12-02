import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Login from "@/pages/admin/Login";
import UserLogin from "@/pages/UserLogin"; // New User Login
import Calculator from "@/pages/Calculator";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { Loader2 } from "lucide-react";

// Protected Route Wrapper for Admin
function RequireAdmin({ component: Component }: { component: React.ComponentType }) {
  const { admin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) {
    setTimeout(() => setLocation('/admin/login'), 0);
    return null;
  }

  return <Component />;
}

// Protected Route Wrapper for Normal Users
function RequireUser({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setTimeout(() => setLocation('/login'), 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public/Login Routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/login" component={UserLogin} />
      
      {/* Protected User Routes */}
      <Route path="/">
        <RequireUser component={Home} />
      </Route>
      <Route path="/calculator">
        <RequireUser component={Calculator} />
      </Route>
      
      {/* Protected Admin Route */}
      <Route path="/admin">
        <RequireAdmin component={Admin} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Router />
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


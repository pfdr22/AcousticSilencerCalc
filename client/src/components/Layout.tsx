import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calculator, 
  Settings, 
  Users, 
  Menu, 
  X, 
  Activity,
  Database
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../api/mockApi";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/image_1764364708706.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    api.health()
      .then(() => setHealthStatus("ok"))
      .catch(() => setHealthStatus("error"));
  }, []);

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/calculator", icon: Calculator, label: "Calculadora" }, 
    { href: "/admin", icon: Settings, label: "Administração" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`
          fixed z-50 top-0 left-0 h-full w-[260px] shrink-0
          bg-sidebar border-r border-sidebar-border 
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 w-full">
            <img 
              src={logoImage} 
              alt="France Air Logo" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <button 
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                    ${isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@france-air.com</p>
            </div>
            <div title={`System Status: ${healthStatus}`}>
              <Activity className={`h-4 w-4 ${healthStatus === 'ok' ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden lg:ml-[260px]">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden -ml-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Mobile Logo */}
            <img 
              src={logoImage} 
              alt="France Air" 
              className="h-8 w-auto lg:hidden" 
            />
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
             {/* Desktop Logo (Secondary) */}
             <img 
               src={logoImage} 
               alt="France Air" 
               className="hidden lg:block h-8 w-auto opacity-80 mr-4" 
             />
             <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
               v1.0.0-mockup
             </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

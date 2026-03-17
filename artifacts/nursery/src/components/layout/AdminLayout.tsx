import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Leaf, 
  ShoppingCart, 
  Tags, 
  BarChart3, 
  LogOut,
  Settings
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/plants", icon: Leaf, label: "Plants" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/categories", icon: Tags, label: "Categories" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const [location, setLocation] = useLocation();
  const { lang, setLang } = useI18n();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border/50 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl">Admin Panel</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between px-2">
             <ThemeToggle />
             <button 
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
             >
               {lang === 'en' ? 'AR' : 'EN'}
             </button>
          </div>
          <button 
            onClick={() => { logout(); setLocation('/'); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-card border-b border-border/50 flex items-center justify-between px-4 sticky top-0 z-10">
          <span className="font-bold">Admin Panel</span>
          <button onClick={() => setLocation('/')} className="text-sm text-primary font-medium">Exit</button>
        </header>
        
        <div className="p-6 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

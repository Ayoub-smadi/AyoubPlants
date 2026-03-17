import { Link, useLocation } from "wouter";
import { Leaf, Menu, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";
import { CartDrawer } from "./CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuthStore();
  const isRtl = lang === 'ar';

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');
  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const NavLinks = () => (
    <>
      <Link href="/" className={`font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-foreground/80'}`}>
        {t('home')}
      </Link>
      <Link href="/plants" className={`font-medium transition-colors hover:text-primary ${location === '/plants' ? 'text-primary' : 'text-foreground/80'}`}>
        {t('plants')}
      </Link>
      <Link href="/quotes" className={`font-medium transition-colors hover:text-primary ${location === '/quotes' ? 'text-primary' : 'text-foreground/80'}`}>
        {t('priceQuotes')}
      </Link>
      {user && (
        <Link href="/orders" className={`font-medium transition-colors hover:text-primary ${location === '/orders' ? 'text-primary' : 'text-foreground/80'}`}>
          {t('myOrders')}
        </Link>
      )}
      {user?.role === 'admin' && (
        <Link href="/admin" className={`font-medium text-accent hover:text-accent/80 transition-colors`}>
          {t('dashboard')}
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col gap-6 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              {lang === 'ar' ? 'روضة النباتات' : 'Al Rawdah'}
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLang}
            className="font-bold"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </Button>
          
          <ThemeToggle />
          <CartDrawer />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/orders')} className="cursor-pointer">
                  {t('myOrders')}
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setLocation('/admin')} className="cursor-pointer text-accent">
                    {t('adminDashboard')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setLocation('/login')} variant="default" size="sm" className="ml-2 rounded-xl">
              {t('login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

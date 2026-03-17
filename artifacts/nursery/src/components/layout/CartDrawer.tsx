import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Link, useLocation } from "wouter";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const { t, lang } = useI18n();
  const [_, setLocation] = useLocation();

  const isRtl = lang === 'ar';
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-foreground">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={isRtl ? "left" : "right"} className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">{t('cart')}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <ShoppingBag className="h-16 w-16 opacity-20" />
              <p className="text-lg">{t('emptyCart')}</p>
              <Button onClick={() => setLocation('/plants')} variant="outline">
                {t('shopNow')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.plant.id} className="flex gap-4 items-center bg-card p-3 rounded-xl border border-border/50">
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={item.plant.imageUrl || "https://images.unsplash.com/photo-1416879598555-220b301b46a9?w=400&h=400&fit=crop"} 
                      alt={lang === 'ar' ? item.plant.nameAr : item.plant.nameEn}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {lang === 'ar' ? item.plant.nameAr : item.plant.nameEn}
                    </h4>
                    <p className="text-primary font-bold mt-1">${item.plant.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center rounded-md border border-border/50 bg-background">
                        <button 
                          onClick={() => updateQuantity(item.plant.id, item.quantity - 1)}
                          className="p-1 hover:bg-muted rounded-l-md transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.plant.id, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded-r-md transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.plant.id)}
                        className="text-destructive/70 hover:text-destructive p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {item.plant.category?.nameEn === "Trees" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        {lang === 'ar' ? '🌳 الحد الأدنى للطلب: 10 أشجار' : '🌳 Min. order: 10 trees'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4 bg-background">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t('total')}</span>
              <span className="text-primary">${getTotal().toFixed(2)}</span>
            </div>
            <Button 
              className="w-full text-lg h-12 rounded-xl" 
              onClick={() => setLocation('/order')}
            >
              {t('checkout')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

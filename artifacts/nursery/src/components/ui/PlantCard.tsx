import { Plant } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/lib/store";
import { Link } from "wouter";
import { ShoppingCart, Eye } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";

export function PlantCard({ plant }: { plant: Plant }) {
  const { lang, t } = useI18n();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const name = lang === 'ar' ? plant.nameAr : plant.nameEn;
  const description = lang === 'ar' ? plant.descriptionAr : plant.descriptionEn;
  const inStock = plant.stockQuantity > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (inStock) {
      addItem(plant, 1);
      toast({
        title: "Added to Cart",
        description: `${name} has been added to your cart.`,
        duration: 3000,
      });
    }
  };

  return (
    <Link href={`/plants/${plant.id}`} className="block h-full outline-none group">
      <div className="bg-card h-full rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <img 
            src={plant.imageUrl || "https://images.unsplash.com/photo-1416879598555-220b301b46a9?w=500&h=500&fit=crop"} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlays */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!inStock && (
              <Badge variant="destructive" className="shadow-md">
                {t('outOfStock')}
              </Badge>
            )}
            {plant.featured && inStock && (
              <Badge className="bg-accent text-accent-foreground border-none shadow-md">
                {lang === 'ar' ? 'مميز' : 'Featured'}
              </Badge>
            )}
          </div>
          
          {/* Quick Actions Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 hover:bg-primary hover:text-white transition-colors delay-75 transform translate-y-4 group-hover:translate-y-0">
              <Eye className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              onClick={handleAdd}
              disabled={!inStock}
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 text-white shadow-lg delay-100 transform translate-y-4 group-hover:translate-y-0 disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
            <span className="font-bold text-primary text-lg">${plant.price.toFixed(2)}</span>
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
            {plant.category && (
              <Badge variant="secondary" className="font-normal bg-secondary/50">
                {lang === 'ar' ? plant.category.nameAr : plant.category.nameEn}
              </Badge>
            )}
            {plant.height && (
              <span className="text-xs">{plant.height} cm</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mt-auto mb-4">
            {description}
          </p>

          <Button 
            className="w-full rounded-xl font-semibold" 
            variant={inStock ? "default" : "secondary"}
            disabled={!inStock}
            onClick={handleAdd}
          >
            {inStock ? t('addToCart') : t('outOfStock')}
          </Button>
        </div>
      </div>
    </Link>
  );
}

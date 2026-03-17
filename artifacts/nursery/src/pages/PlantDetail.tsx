import { MainLayout } from "@/components/layout/MainLayout";
import { useGetPlant } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Ruler, Info, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: plant, isLoading, isError } = useGetPlant(Number(id));
  const { t, lang } = useI18n();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const isRtl = lang === 'ar';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          <Skeleton className="w-full md:w-1/2 aspect-square rounded-3xl" />
          <div className="w-full md:w-1/2 space-y-6 pt-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !plant) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h2 className="text-3xl font-bold text-destructive mb-4">Plant not found</h2>
          <p className="text-muted-foreground">The plant you are looking for does not exist or has been removed.</p>
        </div>
      </MainLayout>
    );
  }

  const name = lang === 'ar' ? plant.nameAr : plant.nameEn;
  const description = lang === 'ar' ? plant.descriptionAr : plant.descriptionEn;
  const inStock = plant.stockQuantity > 0;
  
  const allImages = plant.imageUrl ? [plant.imageUrl, ...(plant.images || [])] : (plant.images?.length ? plant.images : ["https://images.unsplash.com/photo-1416879598555-220b301b46a9?w=800&h=800&fit=crop"]);

  const handleAdd = () => {
    if (inStock) {
      addItem(plant, quantity);
      toast({
        title: "Added to Cart",
        description: `${quantity} x ${name} added.`,
        duration: 3000,
      });
    }
  };

  return (
    <MainLayout>
      <div className="bg-secondary/10 pb-20 pt-8 border-b border-border/30">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-8 text-muted-foreground hover:text-foreground">
            {isRtl ? <ArrowRight className="ml-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
            {lang === 'ar' ? 'العودة' : 'Back'}
          </Button>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
            {/* Image Gallery */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm group">
                <img 
                  src={allImages[activeImage]} 
                  alt={name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {!inStock && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="text-sm px-3 py-1 shadow-lg">
                      {t('outOfStock')}
                    </Badge>
                  </div>
                )}
              </div>
              
              {allImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20 ring-offset-1 ring-offset-background' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 flex flex-col pt-4">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {plant.category && (
                    <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-3 text-sm">
                      {lang === 'ar' ? plant.category.nameAr : plant.category.nameEn}
                    </Badge>
                  )}
                  <span className="flex items-center text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {inStock ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> {plant.stockQuantity} {t('inStock')}</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1.5 text-red-500" /> {t('outOfStock')}</>
                    )}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{name}</h1>
                <p className="text-3xl text-primary font-extrabold">${plant.price.toFixed(2)}</p>
              </div>

              <div className="h-px w-full bg-border/60 my-6"></div>

              <div className="prose dark:prose-invert max-w-none mb-8 text-muted-foreground text-lg leading-relaxed">
                <p>{description || (lang === 'ar' ? 'لا يوجد وصف متاح.' : 'No description available.')}</p>
              </div>

              {plant.height && (
                <div className="flex items-center gap-3 bg-background p-4 rounded-xl border border-border/50 mb-8 inline-flex w-fit">
                  <Ruler className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('height')}</p>
                    <p className="font-bold text-lg">{plant.height} cm</p>
                  </div>
                </div>
              )}

              <div className="mt-auto bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center border-2 border-border/60 rounded-xl bg-background h-14">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 h-full hover:bg-muted/50 rounded-l-xl transition-colors disabled:opacity-50"
                      disabled={!inStock}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-5 h-full hover:bg-muted/50 rounded-r-xl transition-colors disabled:opacity-50"
                      disabled={!inStock || quantity >= plant.stockQuantity}
                    >
                      +
                    </button>
                  </div>
                  <Button 
                    className="flex-1 h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all" 
                    size="lg"
                    disabled={!inStock}
                    onClick={handleAdd}
                  >
                    <ShoppingCart className={`h-5 w-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('addToCart')}
                  </Button>
                </div>
                {!inStock && (
                  <p className="text-destructive text-sm mt-3 text-center font-medium">This item is currently unavailable.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

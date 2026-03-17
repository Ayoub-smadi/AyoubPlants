import { MainLayout } from "@/components/layout/MainLayout";
import { useI18n } from "@/lib/i18n";
import { useGetPlants } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/ui/PlantCard";
import { Link, useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Truck, ShieldCheck, Sprout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { t, lang } = useI18n();
  const [_, setLocation] = useLocation();
  const isRtl = lang === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const { data: plants, isLoading } = useGetPlants({ available: true });
  
  const featuredPlants = plants?.filter(p => p.featured).slice(0, 4) || [];
  const newArrivals = plants?.slice(0, 4) || [];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Beautiful lush greenhouse" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent dark:from-background/95 dark:via-background/90 dark:to-background/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 animate-fade-in">
              🌿 {lang === 'ar' ? 'مشتل استثنائي' : 'Premium Nursery'}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 text-balance">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1" onClick={() => setLocation('/plants')}>
                {t('shopNow')} <Arrow className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-bold bg-background/50 backdrop-blur-sm border-2">
                {t('viewDetails')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border/50 rtl:divide-x-reverse">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}</h3>
              <p className="text-muted-foreground">{lang === 'ar' ? 'توصيل آمن إلى باب منزلك' : 'Safe and secure delivery to your door'}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{lang === 'ar' ? 'جودة مضمونة' : 'Quality Guaranteed'}</h3>
              <p className="text-muted-foreground">{lang === 'ar' ? 'نباتات صحية ومفحوصة بعناية' : 'Healthy plants inspected carefully'}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{lang === 'ar' ? 'نصائح للعناية' : 'Care Instructions'}</h3>
              <p className="text-muted-foreground">{lang === 'ar' ? 'دليل شامل للعناية بكل نبتة' : 'Comprehensive care guide for each plant'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plants */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('featuredPlants')}</h2>
            <div className="h-1 w-20 bg-primary rounded-full"></div>
          </div>
          <Link href="/plants">
            <Button variant="ghost" className="font-semibold hidden sm:flex group">
              {t('viewDetails')} <Arrow className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-2xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPlants.map(plant => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" className="w-full" onClick={() => setLocation('/plants')}>
            {t('viewDetails')}
          </Button>
        </div>
      </section>
      
      {/* Newsletter/CTA */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
           <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="" className="w-96 h-96 object-contain" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{lang === 'ar' ? 'انضم إلى مجتمعنا الأخضر' : 'Join Our Green Community'}</h2>
          <p className="text-primary-foreground/80 text-lg mb-10">
            {lang === 'ar' ? 'اشترك في النشرة الإخبارية للحصول على نصائح للعناية بالنباتات وعروض حصرية.' : 'Subscribe to our newsletter for plant care tips and exclusive offers.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} 
              className="px-6 py-4 rounded-xl text-foreground w-full focus:outline-none focus:ring-4 focus:ring-accent/50 transition-shadow"
            />
            <Button size="lg" variant="secondary" className="h-auto py-4 px-8 rounded-xl font-bold text-lg">
              {lang === 'ar' ? 'اشتراك' : 'Subscribe'}
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

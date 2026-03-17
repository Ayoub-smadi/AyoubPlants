import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useI18n } from "@/lib/i18n";
import { useGetPlants, useGetCategories } from "@workspace/api-client-react";
import { PlantCard } from "@/components/ui/PlantCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Plants() {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [inStockOnly, setInStockOnly] = useState(false);

  // Debounce search for actual API call, but we'll just pass it directly for simplicity here
  // or filter client-side if API doesn't support complex full-text
  const { data: plants, isLoading } = useGetPlants({ 
    search: search || undefined,
    categoryId: selectedCategory,
    available: inStockOnly || undefined
  });

  const { data: categories } = useGetCategories();

  const isRtl = lang === 'ar';

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-lg mb-4">{t('categories')}</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox 
              id="cat-all" 
              checked={selectedCategory === undefined}
              onCheckedChange={() => setSelectedCategory(undefined)}
            />
            <Label htmlFor="cat-all" className="cursor-pointer font-medium">
              {lang === 'ar' ? 'الكل' : 'All Plants'}
            </Label>
          </div>
          {categories?.map(cat => (
            <div key={cat.id} className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox 
                id={`cat-${cat.id}`} 
                checked={selectedCategory === cat.id}
                onCheckedChange={() => setSelectedCategory(cat.id)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">
                {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <h3 className="font-bold text-lg mb-4">{t('status')}</h3>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="in-stock" 
            checked={inStockOnly}
            onCheckedChange={(c) => setInStockOnly(c as boolean)}
          />
          <Label htmlFor="in-stock" className="cursor-pointer">
            {t('inStock')}
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="bg-secondary/20 border-b border-border/50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('plants')}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {lang === 'ar' ? 'تصفح مجموعتنا الواسعة من النباتات وابحث عن الإضافة المثالية لمساحتك.' : 'Browse our extensive collection of plants and find the perfect addition to your space.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Filter className="h-5 w-5" />
              <h2 className="font-bold text-xl">Filters</h2>
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search & Mobile Filter Bar */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-auto rtl:right-4" />
              <Input 
                type="text" 
                placeholder={t('search')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 rtl:pl-4 rtl:pr-12 h-14 rounded-xl text-lg bg-card shadow-sm border-border/50 focus-visible:ring-primary/20"
              />
            </div>
            
            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl md:hidden shrink-0 border-border/50 bg-card shadow-sm">
                  <SlidersHorizontal className="h-5 w-5 text-foreground/80" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? "right" : "left"}>
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl font-bold">Filters</SheetTitle>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Plant Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-2xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : plants?.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-2xl border border-border/50 border-dashed">
              <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{lang === 'ar' ? 'لا يوجد نتائج' : 'No plants found'}</h3>
              <p className="text-muted-foreground">{lang === 'ar' ? 'حاول تغيير كلمات البحث أو الفلاتر' : 'Try adjusting your search or filters'}</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setSelectedCategory(undefined); setInStockOnly(false); }}>
                {lang === 'ar' ? 'مسح الفلاتر' : 'Clear all filters'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {plants?.map(plant => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

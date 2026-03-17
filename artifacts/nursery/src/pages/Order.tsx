import { MainLayout } from "@/components/layout/MainLayout";
import { useCartStore, useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useCreateOrder } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ShoppingBag, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  customerName: z.string().min(2, "Name is too short"),
  customerPhone: z.string().min(5, "Valid phone number required"),
  customerAddress: z.string().min(10, "Full delivery address required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function OrderPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);

  const isRtl = lang === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerPhone: user?.phone || "",
      customerAddress: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (items.length === 0) return;

    createOrder.mutate({
      data: {
        ...values,
        items: items.map(i => ({ plantId: i.plant.id, quantity: i.quantity }))
      }
    }, {
      onSuccess: () => {
        clearCart();
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        toast({
          title: "Error placing order",
          description: error.message || "Please try again later.",
          variant: "destructive"
        });
      }
    });
  };

  if (isSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('orderSuccess')}</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-md">
            {t('orderSuccessDesc')}
          </p>
          <Button size="lg" className="rounded-xl px-8" onClick={() => setLocation('/')}>
            {t('home')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <ShoppingBag className="w-24 h-24 text-muted/50 mb-8" />
          <h1 className="text-3xl font-bold mb-4">{t('emptyCart')}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {lang === 'ar' ? 'أضف بعض النباتات الجميلة لسلتك أولاً.' : 'Add some beautiful plants to your cart first.'}
          </p>
          <Button size="lg" className="rounded-xl px-8" onClick={() => setLocation('/plants')}>
            {t('shopNow')} <Arrow className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-secondary/20 border-b border-border/50 py-8 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">{t('checkout')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Order Summary */}
          <div className="w-full lg:w-1/3 order-2 lg:order-2">
            <div className="bg-card border border-border shadow-sm rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                {t('cart')} ({items.length})
              </h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.plant.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/50">
                        <img src={item.plant.imageUrl || "https://images.unsplash.com/photo-1416879598555-220b301b46a9?w=100&h=100&fit=crop"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{lang === 'ar' ? item.plant.nameAr : item.plant.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x ${item.plant.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="font-bold">${(item.quantity * item.plant.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('subtotal')}</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{lang === 'ar' ? 'التوصيل' : 'Delivery'}</span>
                  <span>{lang === 'ar' ? 'مجاني' : 'Free'}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">{t('total')}</span>
                  <span className="font-extrabold text-2xl text-primary">${getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="w-full lg:w-2/3 order-1 lg:order-1">
            <div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-8">{t('customerInfo')}</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">{t('fullName')}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="h-12 rounded-xl bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">{t('phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder="+971..." className="h-12 rounded-xl bg-background" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('address')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Villa 12, Street 5, Dubai..." 
                            className="min-h-[100px] resize-none rounded-xl bg-background" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t('notes')} <span className="text-muted-foreground font-normal text-sm">({lang === 'ar' ? 'اختياري' : 'Optional'})</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={lang === 'ar' ? 'أي تعليمات خاصة بالتوصيل؟' : 'Any special delivery instructions?'}
                            className="resize-none rounded-xl bg-background" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all font-bold"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? "Processing..." : t('placeOrder')}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

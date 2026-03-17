import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetPlants } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Minus, Trash2, Send, Search, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface QuoteItem {
  plantId: number;
  nameAr: string;
  nameEn: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

export default function QuotesPage() {
  const { lang, t } = useI18n();
  const isRtl = lang === "ar";
  const { toast } = useToast();
  const { token } = useAuthStore();

  const { data: plants, isLoading } = useGetPlants({});
  const [search, setSearch] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredPlants = (plants || []).filter((p) => {
    const q = search.toLowerCase();
    return (
      !search ||
      p.nameAr.includes(search) ||
      p.nameEn.toLowerCase().includes(q)
    );
  });

  const addToQuote = (plant: any) => {
    setQuoteItems((prev) => {
      const existing = prev.find((i) => i.plantId === plant.id);
      if (existing) {
        return prev.map((i) =>
          i.plantId === plant.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          plantId: plant.id,
          nameAr: plant.nameAr,
          nameEn: plant.nameEn,
          imageUrl: plant.imageUrl,
          unitPrice: plant.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (plantId: number, delta: number) => {
    setQuoteItems((prev) =>
      prev
        .map((i) =>
          i.plantId === plantId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        )
    );
  };

  const setQty = (plantId: number, val: number) => {
    setQuoteItems((prev) =>
      prev.map((i) =>
        i.plantId === plantId ? { ...i, quantity: Math.max(1, val) } : i
      )
    );
  };

  const removeItem = (plantId: number) => {
    setQuoteItems((prev) => prev.filter((i) => i.plantId !== plantId));
  };

  const total = quoteItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: lang === "ar" ? "يرجى إدخال الاسم ورقم الهاتف" : "Please enter name and phone", variant: "destructive" });
      return;
    }
    if (quoteItems.length === 0) {
      toast({ title: lang === "ar" ? "يرجى إضافة نباتات للعرض" : "Please add plants to the quote", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          items: quoteItems.map((i) => ({ plantId: i.plantId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setQuoteItems([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch {
      toast({ title: lang === "ar" ? "فشل إرسال الطلب" : "Failed to send quote request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center gap-6">
          <div className="bg-primary/10 rounded-full p-6">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">
            {lang === "ar" ? "تم إرسال طلب عرض السعر!" : "Quote Request Sent!"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            {lang === "ar"
              ? "سيتواصل معك فريقنا على رقم هاتفك في أقرب وقت ممكن مع عرض السعر المفصل."
              : "Our team will contact you on your phone number as soon as possible with a detailed price quote."}
          </p>
          <Button onClick={() => setSubmitted(false)} size="lg" className="rounded-xl mt-2">
            {lang === "ar" ? "طلب عرض سعر جديد" : "Request Another Quote"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              {lang === "ar" ? "طلب عرض سعر" : "Request a Price Quote"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "اختر النباتات التي تريدها وسنرسل لك عرض سعر مفصل على هاتفك."
              : "Select the plants you want and we'll send you a detailed price quote to your phone."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plant Catalog */}
          <div className="lg:col-span-2 space-y-5">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang === "ar" ? "ابحث عن نبتة..." : "Search plants..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPlants.map((plant) => {
                  const inQuote = quoteItems.find((i) => i.plantId === plant.id);
                  return (
                    <Card
                      key={plant.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                        inQuote ? "border-primary/60 bg-primary/5" : "border-border/50"
                      }`}
                      onClick={() => addToQuote(plant)}
                    >
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {plant.imageUrl ? (
                          <img src={plant.imageUrl} alt={plant.nameEn} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl">🌿</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{lang === "ar" ? plant.nameAr : plant.nameEn}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {lang === "ar" ? plant.nameEn : plant.nameAr}
                        </p>
                        <p className="text-primary font-bold mt-1">
                          {plant.price.toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}
                        </p>
                      </div>
                      {inQuote ? (
                        <Badge className="bg-primary text-primary-foreground text-xs px-2">
                          ✓ {inQuote.quantity}
                        </Badge>
                      ) : (
                        <div className="bg-primary/10 rounded-lg p-1.5">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </Card>
                  );
                })}
                {filteredPlants.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    {lang === "ar" ? "لا توجد نباتات مطابقة" : "No plants found"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quote Summary & Form */}
          <div className="space-y-5">
            {/* Quote Items */}
            <Card className="p-5 rounded-2xl border-border/50 shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {lang === "ar" ? "عرض السعر" : "Your Quote"}
                {quoteItems.length > 0 && (
                  <Badge variant="secondary" className="ms-auto">{quoteItems.length}</Badge>
                )}
              </h2>

              {quoteItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {lang === "ar" ? "انقر على نبتة لإضافتها" : "Click a plant to add it"}
                </div>
              ) : (
                <div className="space-y-3">
                  {quoteItems.map((item) => (
                    <div key={item.plantId} className="flex items-center gap-3 pb-3 border-b border-border/40 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lang === "ar" ? item.nameAr : item.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.unitPrice.toFixed(2)} × {item.quantity} = {(item.unitPrice * item.quantity).toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.plantId, -1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setQty(item.plantId, parseInt(e.target.value) || 1)}
                          className="w-12 h-6 text-center text-xs p-0 rounded-md"
                          min={1}
                        />
                        <button onClick={() => updateQty(item.plantId, 1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeItem(item.plantId)} className="h-6 w-6 rounded-md text-destructive hover:bg-destructive/10 flex items-center justify-center ms-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 font-bold text-primary">
                    <span>{lang === "ar" ? "الإجمالي التقديري:" : "Estimated Total:"}</span>
                    <span>{total.toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Contact Info */}
            <Card className="p-5 rounded-2xl border-border/50 shadow-sm space-y-4">
              <h2 className="font-bold text-lg">
                {lang === "ar" ? "معلومات التواصل" : "Contact Information"}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "أدخل اسمك" : "Enter your name"}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {lang === "ar" ? "رقم الهاتف *" : "Phone Number *"}
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "05XXXXXXXX" : "05XXXXXXXX"}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-xl"
                    type="tel"
                    dir="ltr"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || quoteItems.length === 0}
                className="w-full rounded-xl gap-2"
                size="lg"
              >
                <Send className="h-4 w-4" />
                {submitting
                  ? lang === "ar" ? "جارٍ الإرسال..." : "Sending..."
                  : lang === "ar" ? "إرسال طلب عرض السعر" : "Send Quote Request"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

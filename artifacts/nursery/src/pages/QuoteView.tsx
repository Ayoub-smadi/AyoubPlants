import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Leaf, Printer, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface QuoteItem {
  id: number;
  plantId: number;
  plantNameAr: string;
  plantNameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

interface Quote {
  id: number;
  customerName: string;
  customerPhone: string;
  status: "pending" | "reviewed" | "sent";
  totalAmount: number;
  createdAt: string;
  items: QuoteItem[];
}

export default function QuoteView() {
  const [, params] = useRoute("/quotes/:id");
  const [, setLocation] = useLocation();
  const { lang } = useI18n();

  const quoteId = params?.id;

  const { data: quote, isLoading, isError } = useQuery<Quote>({
    queryKey: ["public-quote", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/public/${quoteId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!quoteId,
  });

  const total = (quote?.items ?? []).reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const statusLabel = (s: string) =>
    s === "pending"
      ? lang === "ar" ? "قيد المراجعة" : "Under Review"
      : s === "reviewed"
      ? lang === "ar" ? "تمت المراجعة" : "Reviewed"
      : lang === "ar" ? "تم الإرسال" : "Sent";

  const statusColor = (s: string) =>
    s === "sent"
      ? "bg-green-100 text-green-800"
      : s === "reviewed"
      ? "bg-blue-100 text-blue-800"
      : "bg-yellow-100 text-yellow-800";

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !quote) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center gap-4">
          <p className="text-muted-foreground text-lg">
            {lang === "ar" ? "لم يتم العثور على عرض السعر." : "Quote not found."}
          </p>
          <Button onClick={() => setLocation("/quotes")} className="rounded-xl gap-2">
            <ArrowRight className="h-4 w-4" />
            {lang === "ar" ? "طلب عرض جديد" : "New Quote Request"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl" dir="rtl">
        {/* Action bar */}
        <div className="print:hidden mb-6 flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl gap-2" onClick={() => setLocation("/quotes")}>
            <ArrowRight className="h-4 w-4" />
            {lang === "ar" ? "طلب عرض جديد" : "New Quote"}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {lang === "ar" ? "طباعة / PDF" : "Print / PDF"}
          </Button>
        </div>

        {/* Quote Document */}
        <div className="bg-white dark:bg-card rounded-3xl shadow-xl border border-border/30 overflow-hidden">
          {/* Customer Info */}
          <div className="px-8 py-6 bg-green-50/50 dark:bg-green-950/10 border-b border-border/30">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">مُقدَّم إلى</p>
                <p className="font-bold text-xl">{quote.customerName}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">رقم الهاتف</p>
                <p className="font-bold text-xl" dir="ltr">{quote.customerPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/20">
              <span className="text-xs text-muted-foreground">
                #{String(quote.id).padStart(5, "0")} ·{" "}
                {new Date(quote.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(quote.status)}`}>
                {statusLabel(quote.status)}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-8 print:px-6">
            <h2 className="font-bold text-lg mb-5 text-green-800 dark:text-green-300">تفاصيل العرض</h2>
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="px-4 py-3 text-right font-semibold w-8">#</th>
                    <th className="px-4 py-3 text-right font-semibold">اسم النبتة</th>
                    <th className="px-4 py-3 text-right font-semibold hidden sm:table-cell">الوصف</th>
                    <th className="px-4 py-3 text-center font-semibold">الكمية</th>
                    <th className="px-4 py-3 text-center font-semibold">سعر الوحدة</th>
                    <th className="px-4 py-3 text-center font-semibold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border/30 ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground text-center font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img src={item.imageUrl} alt={item.plantNameEn} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{item.plantNameAr}</p>
                            <p className="text-xs text-muted-foreground">{item.plantNameEn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm max-w-[180px] hidden sm:table-cell">
                        {item.descriptionAr || item.descriptionEn || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">{item.unitPrice.toFixed(2)} ر.س</td>
                      <td className="px-4 py-3 text-center font-bold text-green-700 dark:text-green-400">
                        {(item.unitPrice * item.quantity).toFixed(2)} ر.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-start mt-6">
              <div className="bg-green-700 text-white rounded-2xl px-8 py-5 text-right min-w-[220px]">
                <p className="text-green-200 text-sm mb-1">الإجمالي الكلي</p>
                <p className="text-3xl font-black">
                  {total.toFixed(2)} <span className="text-lg font-medium">ر.س</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-muted/20 border-t border-border/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              هذا العرض صالح لمدة 30 يوماً من تاريخ الإصدار.
            </p>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Leaf className="h-4 w-4" />
              <span className="text-xs font-semibold">روضة النباتات</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

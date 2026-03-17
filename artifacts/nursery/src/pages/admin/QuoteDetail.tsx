import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Printer, ArrowLeft, Save, CheckCircle, Send, Leaf, Plus, Trash2, Minus } from "lucide-react";

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
}

interface Quote {
  id: number;
  customerName: string;
  customerPhone: string;
  status: "pending" | "reviewed" | "sent";
  totalAmount: number;
  adminNotes: string | null;
  createdAt: string;
  items: QuoteItem[];
}

export default function QuoteDetail() {
  const [, params] = useRoute("/admin/quotes/:id");
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();
  const { lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const quoteId = params?.id;

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ["admin-quote", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token && !!quoteId,
  });

  const [editedItems, setEditedItems] = useState<QuoteItem[] | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [notesInitialized, setNotesInitialized] = useState(false);

  if (quote && !notesInitialized) {
    setAdminNotes(quote.adminNotes || "");
    setNotesInitialized(true);
  }

  const items = editedItems ?? quote?.items ?? [];
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const updateItemQty = (idx: number, delta: number) => {
    const base = editedItems ?? quote!.items;
    const updated = base.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta), totalPrice: item.unitPrice * Math.max(1, item.quantity + delta) } : item
    );
    setEditedItems(updated);
  };

  const setItemQty = (idx: number, val: number) => {
    const base = editedItems ?? quote!.items;
    const qty = Math.max(1, val);
    const updated = base.map((item, i) =>
      i === idx ? { ...item, quantity: qty, totalPrice: item.unitPrice * qty } : item
    );
    setEditedItems(updated);
  };

  const setItemPrice = (idx: number, val: number) => {
    const base = editedItems ?? quote!.items;
    const updated = base.map((item, i) =>
      i === idx ? { ...item, unitPrice: val, totalPrice: val * item.quantity } : item
    );
    setEditedItems(updated);
  };

  const removeItem = (idx: number) => {
    const base = editedItems ?? quote!.items;
    setEditedItems(base.filter((_, i) => i !== idx));
  };

  const saveMutation = useMutation({
    mutationFn: async (status?: string) => {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: status || quote?.status,
          adminNotes,
          items: items.map((i) => ({
            plantId: i.plantId,
            plantNameAr: i.plantNameAr,
            plantNameEn: i.plantNameEn,
            descriptionAr: i.descriptionAr,
            descriptionEn: i.descriptionEn,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-quote", quoteId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      setEditedItems(null);
      toast({ title: lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully" });
    },
    onError: () => {
      toast({ title: lang === "ar" ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const statusLabel = (s: string) =>
    s === "pending" ? (lang === "ar" ? "قيد الانتظار" : "Pending") :
    s === "reviewed" ? (lang === "ar" ? "تمت المراجعة" : "Reviewed") :
    lang === "ar" ? "تم الإرسال" : "Sent";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!quote) return null;

  return (
    <AdminLayout>
      {/* Action Bar — hidden on print */}
      <div className="print:hidden mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" className="rounded-xl gap-2" onClick={() => setLocation("/admin/quotes")}>
          <ArrowLeft className="h-4 w-4" />
          {lang === "ar" ? "رجوع" : "Back"}
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => saveMutation.mutate("reviewed")}
          disabled={saveMutation.isPending}
        >
          <CheckCircle className="h-4 w-4" />
          {lang === "ar" ? "تحديد كـ مراجَع" : "Mark as Reviewed"}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl gap-2 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
          onClick={() => saveMutation.mutate("sent")}
          disabled={saveMutation.isPending}
        >
          <Send className="h-4 w-4" />
          {lang === "ar" ? "تحديد كـ مُرسَل" : "Mark as Sent"}
        </Button>
        <Button className="rounded-xl gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" />
          {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
        </Button>
        <Button variant="outline" className="rounded-xl gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          {lang === "ar" ? "طباعة / PDF" : "Print / PDF"}
        </Button>
      </div>

      {/* Admin Notes — hidden on print */}
      <Card className="print:hidden p-5 rounded-2xl border-border/50 mb-6 space-y-3">
        <h2 className="font-semibold">{lang === "ar" ? "ملاحظات الإدارة" : "Admin Notes"}</h2>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder={lang === "ar" ? "أضف ملاحظات أو شروط..." : "Add notes or terms..."}
          rows={3}
          className="w-full border border-border/50 rounded-xl px-3 py-2 text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Card>

      {/* ─── PRINTABLE QUOTE DOCUMENT ─── */}
      <div ref={printRef} className="bg-white dark:bg-card rounded-3xl shadow-xl border border-border/30 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 text-white px-10 py-8 print:px-8 print:py-6">
          <div className="flex items-start justify-between gap-6">
            {/* Company Info */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-3 backdrop-blur">
                <Leaf className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">روضة النباتات</h1>
                <p className="text-green-200 text-sm font-medium">Al Rawdah Nursery</p>
                <p className="text-green-300 text-xs mt-1">📍 الرياض، المملكة العربية السعودية</p>
                <p className="text-green-300 text-xs">🌐 alrawdah.com · 📞 0500000000</p>
              </div>
            </div>
            {/* Quote Meta */}
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">عرض سعر</p>
              <p className="text-3xl font-black">#{String(quote.id).padStart(5, "0")}</p>
              <p className="text-green-200 text-sm mt-2">
                {new Date(quote.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${
                quote.status === "sent" ? "bg-green-400/30 text-green-100" :
                quote.status === "reviewed" ? "bg-blue-400/30 text-blue-100" :
                "bg-yellow-400/30 text-yellow-100"
              }`}>
                {statusLabel(quote.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-10 py-6 print:px-8 print:py-5 bg-green-50/50 dark:bg-green-950/10 border-b border-border/30">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">مُقدَّم إلى</p>
              <p className="font-bold text-xl">{quote.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">رقم الهاتف</p>
              <p className="font-bold text-xl" dir="ltr">{quote.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-10 py-8 print:px-8">
          <h2 className="font-bold text-lg mb-5 text-green-800 dark:text-green-300">تفاصيل العرض</h2>
          <div className="overflow-x-auto rounded-2xl border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="px-5 py-3 text-right font-semibold w-8">#</th>
                  <th className="px-5 py-3 text-right font-semibold">اسم النبتة</th>
                  <th className="px-5 py-3 text-right font-semibold">الوصف</th>
                  <th className="px-5 py-3 text-center font-semibold">الكمية</th>
                  <th className="px-5 py-3 text-center font-semibold">سعر الوحدة</th>
                  <th className="px-5 py-3 text-center font-semibold">الإجمالي</th>
                  <th className="px-5 py-3 print:hidden w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={`border-b border-border/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <td className="px-5 py-3 text-muted-foreground text-center font-mono">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{item.plantNameAr}</p>
                      <p className="text-xs text-muted-foreground">{item.plantNameEn}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm max-w-[200px]">
                      {item.descriptionAr || item.descriptionEn || "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="print:hidden flex items-center justify-center gap-1">
                        <button onClick={() => updateItemQty(idx, -1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setItemQty(idx, parseInt(e.target.value) || 1)}
                          className="w-14 h-6 text-center text-xs p-0 rounded-md"
                          min={1}
                        />
                        <button onClick={() => updateItemQty(idx, 1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="hidden print:block font-semibold">{item.quantity}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="print:hidden">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => setItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 h-7 text-center text-xs p-0 rounded-md mx-auto"
                          step="0.01"
                          min={0}
                        />
                      </div>
                      <span className="hidden print:block font-semibold">{item.unitPrice.toFixed(2)} ر.س</span>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-green-700 dark:text-green-400">
                      {(item.unitPrice * item.quantity).toFixed(2)} ر.س
                    </td>
                    <td className="px-5 py-3 print:hidden">
                      <button onClick={() => removeItem(idx)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-6">
            <div className="bg-green-700 text-white rounded-2xl px-8 py-5 text-right min-w-[240px]">
              <p className="text-green-200 text-sm mb-1">الإجمالي الكلي</p>
              <p className="text-3xl font-black">{total.toFixed(2)} <span className="text-lg font-medium">ر.س</span></p>
            </div>
          </div>

          {/* Notes */}
          {adminNotes && (
            <div className="mt-6 p-5 bg-muted/40 rounded-2xl border border-border/30">
              <p className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">ملاحظات وشروط</p>
              <p className="text-sm whitespace-pre-line">{adminNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-5 print:px-8 bg-muted/20 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            هذا العرض صالح لمدة 30 يوماً من تاريخ الإصدار.
          </p>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Leaf className="h-4 w-4" />
            <span className="text-xs font-semibold">روضة النباتات</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

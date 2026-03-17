import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Trash2, Clock, CheckCircle, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

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

function statusBadge(status: string, lang: string) {
  const map: Record<string, { label: string; labelAr: string; className: string }> = {
    pending: { label: "Pending", labelAr: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    reviewed: { label: "Reviewed", labelAr: "تمت المراجعة", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    sent: { label: "Sent", labelAr: "تم الإرسال", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{lang === "ar" ? s.labelAr : s.label}</span>;
}

export default function AdminQuotes() {
  const { token } = useAuthStore();
  const { lang } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast({ title: lang === "ar" ? "تم الحذف" : "Quote deleted" });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          {lang === "ar" ? "عروض الأسعار" : "Price Quotes"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar" ? "إدارة طلبات عروض الأسعار الواردة من العملاء." : "Manage incoming price quote requests from customers."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : !quotes || quotes.length === 0 ? (
        <Card className="p-16 rounded-2xl border-border/50 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {lang === "ar" ? "لا توجد طلبات عروض أسعار" : "No quote requests yet"}
          </h3>
          <p className="text-muted-foreground">
            {lang === "ar" ? "ستظهر الطلبات هنا عندما يرسلها العملاء." : "Requests will appear here when customers submit them."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="p-5 rounded-2xl border-border/50 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{quote.customerName}</h3>
                    {statusBadge(quote.status, lang)}
                    <span className="text-xs text-muted-foreground ms-auto">
                      #{quote.id} · {new Date(quote.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm flex items-center gap-2">
                    📞 {quote.customerPhone}
                    <span className="text-border">·</span>
                    {quote.items.length} {lang === "ar" ? "عناصر" : "items"}
                    <span className="text-border">·</span>
                    <span className="font-semibold text-primary">
                      {quote.totalAmount.toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={() => setLocation(`/admin/quotes/${quote.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    {lang === "ar" ? "عرض" : "View"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => deleteMutation.mutate(quote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

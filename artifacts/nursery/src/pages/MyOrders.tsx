import { MainLayout } from "@/components/layout/MainLayout";
import { useGetOrders } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ShoppingBag, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  shipped:    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  delivered:  "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled:  "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabelsAr: Record<string, string> = {
  pending:    "قيد الانتظار",
  confirmed:  "مؤكد",
  processing: "جاري التجهيز",
  shipped:    "تم الشحن",
  delivered:  "تم التوصيل",
  cancelled:  "ملغي",
};

export default function MyOrders() {
  const { user } = useAuthStore();
  const { lang } = useI18n();
  const [, setLocation] = useLocation();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const isRtl = lang === "ar";

  const { data: orders, isLoading, error } = useGetOrders();

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mb-6" />
          <h2 className="text-2xl font-bold mb-3">
            {isRtl ? "يجب تسجيل الدخول أولاً" : "Please log in first"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isRtl ? "سجّل دخولك لعرض طلباتك" : "Log in to view your orders"}
          </p>
          <Button onClick={() => setLocation("/login")}>
            {isRtl ? "تسجيل الدخول" : "Log In"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">
            {isRtl ? "طلباتي" : "My Orders"}
          </h1>
          <p className="text-muted-foreground">
            {isRtl ? "تتبع جميع طلباتك" : "Track all your orders"}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-destructive">
            {isRtl ? "حدث خطأ في تحميل الطلبات" : "Failed to load orders"}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-20 h-20 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-bold mb-3">
              {isRtl ? "لا توجد طلبات بعد" : "No orders yet"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRtl ? "تصفّح النباتات وأضف طلبك الأول!" : "Browse our plants and place your first order!"}
            </p>
            <Button onClick={() => setLocation("/plants")}>
              {isRtl ? "تصفح النباتات" : "Browse Plants"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div
                  key={order.id}
                  className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden"
                >
                  <button
                    className="w-full text-start p-5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {isRtl ? `طلب رقم #${order.id}` : `Order #${order.id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "dd MMM yyyy - hh:mm a")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-end">
                        <p className="font-bold text-primary">
                          {order.totalAmount.toFixed(2)} {isRtl ? "ر.س" : "SAR"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} {isRtl ? "منتج" : "items"}
                        </p>
                      </div>
                      <Badge className={`text-xs font-semibold border ${statusColors[order.status] ?? ""}`}>
                        {isRtl ? (statusLabelsAr[order.status] ?? order.status) : order.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/40 px-5 pb-5 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">{isRtl ? "العنوان" : "Address"}</p>
                          <p className="font-medium">{order.customerAddress}</p>
                        </div>
                        {order.notes && (
                          <div>
                            <p className="text-muted-foreground mb-1">{isRtl ? "ملاحظات" : "Notes"}</p>
                            <p className="font-medium">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {isRtl ? "المنتجات" : "Items"}
                        </p>
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                          >
                            {item.plant?.imageUrl && (
                              <img
                                src={item.plant.imageUrl}
                                alt={isRtl ? item.plant.nameAr : item.plant.nameEn}
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {isRtl ? item.plant?.nameAr : item.plant?.nameEn}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} × {item.unitPrice?.toFixed(2)} {isRtl ? "ر.س" : "SAR"}
                              </p>
                            </div>
                            <p className="font-bold text-primary shrink-0">
                              {item.totalPrice?.toFixed(2)} {isRtl ? "ر.س" : "SAR"}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center">
                        <span className="font-semibold">{isRtl ? "المجموع الكلي" : "Total"}</span>
                        <span className="text-xl font-bold text-primary">
                          {order.totalAmount.toFixed(2)} {isRtl ? "ر.س" : "SAR"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

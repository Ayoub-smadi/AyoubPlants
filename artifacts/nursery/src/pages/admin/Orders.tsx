import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const statusColors: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  shipped:    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  delivered:  "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled:  "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function AdminOrders() {
  const { data: orders, isLoading } = useGetOrders();
  const updateMut = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const handleStatusChange = (id: number, status: any) => {
    updateMut.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        toast({ title: "Order status updated" });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-muted-foreground">View and update customer orders.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-8"></TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : orders?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">No orders found.</TableCell></TableRow>
            ) : (
              orders?.map((order) => {
                const isExpanded = expandedOrder === order.id;
                return (
                  <>
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <TableCell>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="text-sm">
                        <p>{format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'hh:mm a')}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.items?.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="relative w-9 h-9 rounded-lg overflow-hidden border border-border/50 bg-muted shrink-0"
                              title={`${item.plant?.nameAr} × ${item.quantity}`}
                            >
                              {item.plant?.imageUrl ? (
                                <img
                                  src={item.plant.imageUrl}
                                  alt={item.plant.nameEn}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-0.5 leading-tight rounded-tl">
                                ×{item.quantity}
                              </span>
                            </div>
                          ))}
                          {(order.items?.length ?? 0) > 3 && (
                            <span className="text-xs text-muted-foreground font-medium ml-1">
                              +{order.items!.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-primary">
                        {order.totalAmount.toFixed(2)} ر.س
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          defaultValue={order.status}
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-xs font-semibold border ${statusColors[order.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${order.id}-expanded`} className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={7} className="py-4 px-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Address: </span>
                              <span className="font-medium">{order.customerAddress}</span>
                            </div>
                            {order.notes && (
                              <div>
                                <span className="text-muted-foreground">Notes: </span>
                                <span className="font-medium">{order.notes}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40"
                              >
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                  {item.plant?.imageUrl ? (
                                    <img
                                      src={item.plant.imageUrl}
                                      alt={item.plant.nameEn}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold">{item.plant?.nameAr}</p>
                                  <p className="text-xs text-muted-foreground">{item.plant?.nameEn}</p>
                                </div>
                                <div className="text-sm text-muted-foreground shrink-0 text-right">
                                  <p>{item.quantity} × {item.unitPrice?.toFixed(2)} ر.س</p>
                                </div>
                                <div className="font-bold text-primary shrink-0 min-w-[90px] text-right">
                                  {item.totalPrice?.toFixed(2)} ر.س
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t border-border/40">
                            <span className="text-sm text-muted-foreground">Total:</span>
                            <span className="text-xl font-bold text-primary">
                              {order.totalAmount.toFixed(2)} ر.س
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}

import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetReportSummary, useGetDailySales } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Leaf, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

function StatCard({ title, value, icon: Icon, description, alert = false }: any) {
  return (
    <Card className={`p-6 rounded-2xl border-border/50 shadow-sm ${alert ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground font-medium mb-1">{title}</p>
          <h3 className={`text-3xl font-bold ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-4">{description}</p>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: dailySales, isLoading: salesLoading } = useGetDailySales();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={`$${summary.totalRevenue.toFixed(2)}`} 
            icon={DollarSign} 
            description={`$${summary.monthRevenue.toFixed(2)} this month`}
          />
          <StatCard 
            title="Total Orders" 
            value={summary.totalOrders} 
            icon={ShoppingCart} 
            description={`${summary.todayOrders} new today`}
          />
          <StatCard 
            title="Total Plants" 
            value={summary.totalPlants} 
            icon={Leaf} 
            description="Active in catalog"
          />
          <StatCard 
            title="Low Stock Alerts" 
            value={summary.lowStockPlants} 
            icon={AlertTriangle} 
            alert={summary.lowStockPlants > 0}
            description="Items need restock"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="p-6 rounded-2xl border-border/50 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-xl font-bold mb-6">Revenue Over Time (Last 30 Days)</h3>
          <div className="h-[300px] w-full">
            {salesLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

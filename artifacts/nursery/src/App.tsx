import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Plants from "./pages/Plants";
import PlantDetail from "./pages/PlantDetail";
import OrderPage from "./pages/Order";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlants from "./pages/admin/Plants";
import AdminOrders from "./pages/admin/Orders";
import AdminCategories from "./pages/admin/Categories";
import AdminQuotes from "./pages/admin/Quotes";
import QuoteDetail from "./pages/admin/QuoteDetail";

// Customer Pages
import QuotesPage from "./pages/Quotes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/plants" component={Plants} />
      <Route path="/plants/:id" component={PlantDetail} />
      <Route path="/order" component={OrderPage} />
      <Route path="/quotes" component={QuotesPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Customer Routes (can share UI with public, or have specific views) */}
      {/* <Route path="/orders" component={MyOrders} /> */}
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/plants" component={AdminPlants} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/quotes" component={AdminQuotes} />
      <Route path="/admin/quotes/:id" component={QuoteDetail} />
      <Route path="/admin/:rest*" component={AdminDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

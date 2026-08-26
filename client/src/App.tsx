import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const NotFound = lazy(() => import("./pages/NotFound"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CommerceAdmin = lazy(() => import("./pages/CommerceAdmin"));
const DeveloperSurface = lazy(() => import("./pages/DeveloperSurface"));
const MerchantMediaTools = lazy(() => import("./components/MerchantMediaTools"));
const MerchantCatalogSignals = lazy(() => import("./components/MerchantCatalogSignals"));
const MerchantCommercialTools = lazy(() => import("./components/MerchantCommercialTools"));
const MerchantCatalogTransferTools = lazy(() => import("./components/MerchantCatalogTransferTools"));
const MerchantWorkspaceQueryState = lazy(() => import("./components/MerchantWorkspaceQueryState"));
const MerchantOperationsMonitor = lazy(() => import("./components/MerchantOperationsMonitor"));
const MerchantOrderOperations = lazy(() => import("./components/MerchantOrderOperations"));
const MerchantWorkspace = lazy(() => import("./pages/MerchantWorkspace"));
const PublicMerchantStore = lazy(() => import("./pages/PublicMerchantStore"));
const ClientReview = lazy(() => import("./pages/ClientReview"));
const PlatformHome = lazy(() => import("./pages/PlatformHome"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Storefront = lazy(() => import("./pages/Storefront"));

function RouteLoadingFallback() {
  return <main className="route-loading" aria-live="polite">Loading commerce workspace…</main>;
}

function MerchantWorkspaceRoute() {
  return <><MerchantWorkspace /><MerchantWorkspaceQueryState /><MerchantMediaTools /><MerchantCatalogSignals /><MerchantCatalogTransferTools /><MerchantCommercialTools /><MerchantOrderOperations /><MerchantOperationsMonitor /></>;
}

function Router() {
  return <Switch>
    <Route path="/" component={PlatformHome} />
    <Route path="/store" component={Storefront} />
    <Route path="/store/products/:handle" component={ProductDetail} />
    <Route path="/cart" component={CartPage} />
    <Route path="/account" component={CustomerAccount} />
    <Route path="/checkout" component={CheckoutPage} />
    <Route path="/admin" component={CommerceAdmin} />
    <Route path="/docs" component={DeveloperSurface} />
    <Route path="/workspace" component={MerchantWorkspaceRoute} />
    <Route path="/s/:handle" component={PublicMerchantStore} />
    <Route path="/review/:token" component={ClientReview} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><CartProvider><Toaster richColors /><Suspense fallback={<RouteLoadingFallback />}><Router /></Suspense></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

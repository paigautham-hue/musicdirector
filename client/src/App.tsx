import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewAlbum from "./pages/NewAlbum";
import AlbumWorkspace from "./pages/AlbumWorkspace";
import MyLibrary from "./pages/MyLibrary";
import KnowledgeHub from "./pages/KnowledgeHub";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminUserQuotas from "./pages/AdminUserQuotas";
import AdminAnalytics from "./pages/AdminAnalytics";
import Gallery from "./pages/Gallery";
import ImpactStories from "./pages/ImpactStories";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentHistory from "./pages/PaymentHistory";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={NewAlbum} />
      <Route path="/album/:id" component={AlbumWorkspace} />
      <Route path="/library" component={MyLibrary} />
      <Route path="/knowledge" component={KnowledgeHub} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/quotas" component={AdminUserQuotas} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/impact-stories" component={ImpactStories} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/history" component={PaymentHistory} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

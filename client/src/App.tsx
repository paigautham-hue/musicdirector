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
import MyPrompts from "./pages/MyPrompts";
import Explore from "./pages/Explore";
import AlbumDetail from "./pages/AlbumDetail";
import UserProfile from "./pages/UserProfile";
import CommunityPrompts from "./pages/CommunityPrompts";
import Profile from "./pages/Profile";
import MyPlaylists from "./pages/MyPlaylists";
import PlaylistDetail from "./pages/PlaylistDetail";
import PublicPlaylists from "./pages/PublicPlaylists";
import PlaylistStats from "./pages/PlaylistStats";

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
      <Route path="/prompts" component={MyPrompts} />
      <Route path="/explore" component={Explore} />
      <Route path="/album/:id" component={AlbumDetail} />
      <Route path="/profile/:id" component={UserProfile} />
      <Route path="/profile" component={Profile} />
      <Route path="/community-prompts" component={CommunityPrompts} />
      <Route path="/my-playlists" component={MyPlaylists} />
      <Route path="/playlists/:id" component={PlaylistDetail} />
      <Route path="/playlists" component={PublicPlaylists} />
      <Route path="/playlist-stats" component={PlaylistStats} />      <Route path="/404" component={NotFound} />
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

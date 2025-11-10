import { AppNav } from "@/components/AppNav";
import { DiscoveryPlaylists } from "@/components/DiscoveryPlaylists";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Sparkles } from "lucide-react";

export default function Discovery() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      <div className="container py-8 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Discovery", href: "/discovery" }
          ]}
        />

        {/* Page Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-500">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI-Curated Discovery
            </h1>
          </div>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            Explore exceptional music chosen by our AI curator. Each track is analyzed for lyrical quality, 
            emotional depth, universal appeal, and memorability.
          </p>
        </div>

        {/* Discovery Playlists */}
        <DiscoveryPlaylists variant="full" />
      </div>
    </div>
  );
}

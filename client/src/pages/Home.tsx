import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Sparkles, Zap, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: albums } = trpc.albums.list.useQuery({ limit: 1 }, { enabled: isAuthenticated });
  const hasAlbums = albums && albums.length > 0;

  const featuredThemes = [
    {
      title: "Lotus in the Noise",
      description: "Songs inspired by Osho's teachings - experiential, meditative, celebratory of awareness",
      icon: Sparkles,
      gradient: "from-amber-500/20 to-orange-500/20"
    },
    {
      title: "Lines in the Sand",
      description: "Social commentary on division vs unity - compassionate, human-first, no hate",
      icon: Star,
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "Love & Resilience",
      description: "Heartfelt songs about love, loss, and the strength to carry on",
      icon: Music,
      gradient: "from-pink-500/20 to-rose-500/20"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {APP_TITLE}
                </span>
              </a>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/library">
                    <a className="text-foreground/80 hover:text-foreground transition-colors">
                      My Library
                    </a>
                  </Link>
                  <Link href="/knowledge">
                    <a className="text-foreground/80 hover:text-foreground transition-colors">
                      Knowledge Hub
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a className="text-foreground/80 hover:text-foreground transition-colors">
                        Admin
                      </a>
                    </Link>
                  )}
                  <Link href="/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Create Album
                    </Button>
                  </Link>
                </>
              ) : (
                <Button asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Music Album Creation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Create Full Albums
              <br />
              <span className="text-foreground">with AI Magic</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Turn your themes and ideas into complete music albums with AI-generated lyrics, 
              prompts, artwork, and platform-optimized content for Suno, Udio, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/new">
                    <a className="flex items-center gap-2">
                      {hasAlbums ? "Create Another Album" : "Create Your First Album"}
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <a href={getLoginUrl()} className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/knowledge">
                  <a>Explore Platforms</a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">
              Professional album creation powered by cutting-edge AI
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Multi-Platform Support</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Generate optimized content for Suno, Udio, ElevenLabs, Mubert, and Stable Audio
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI Quality Scoring</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Get hit-potential scores with detailed breakdowns for every song
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Instant Artwork</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Beautiful album covers and track art generated automatically
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Themes */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Themes</h2>
            <p className="text-xl text-muted-foreground">
              Get inspired by these curated album concepts
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredThemes.map((theme, i) => (
              <Card key={i} className={`bg-gradient-to-br ${theme.gradient} backdrop-blur border-border/50 hover:border-primary/50 transition-all group`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <theme.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{theme.title}</CardTitle>
                  <CardDescription className="text-foreground/80">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Create?</h2>
            <p className="text-xl text-muted-foreground">
              Start building your first AI-powered music album in minutes
            </p>
            {isAuthenticated ? (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/new">
                  <a className="flex items-center gap-2">
                    Create Album Now
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <a href={getLoginUrl()} className="flex items-center gap-2">
                  Sign Up Free
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">
                © 2025 {APP_TITLE}. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6">
              <Link href="/knowledge">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Knowledge Hub
                </a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

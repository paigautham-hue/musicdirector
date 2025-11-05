import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Sparkles, Zap, Star, ArrowRight, Palette, Wand2, User, LogOut, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: albums } = trpc.albums.list.useQuery({ limit: 1 }, { enabled: isAuthenticated });
  const hasAlbums = albums && albums.length > 0;
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const featuredThemes = [
    {
      title: "Lotus in the Noise",
      description: "Songs inspired by Osho's teachings - experiential, meditative, celebratory of awareness",
      icon: Sparkles,
      gradient: "from-amber-500/20 to-orange-500/20",
      image: "/images/music-wave.jpg"
    },
    {
      title: "Lines in the Sand",
      description: "Social commentary on division vs unity - compassionate, human-first, no hate",
      icon: Star,
      gradient: "from-blue-500/20 to-purple-500/20",
      image: "/images/music-notes-wave.jpg"
    },
    {
      title: "Love & Resilience",
      description: "Heartfelt songs about love, loss, and the strength to carry on",
      icon: Music,
      gradient: "from-pink-500/20 to-rose-500/20",
      image: "/images/music-wave.jpg"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span className="bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
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
                  <Link href="/gallery">
                    <a className="text-foreground/80 hover:text-foreground transition-colors">
                      Gallery
                    </a>
                  </Link>
                  <Link href="/impact-stories">
                    <a className="text-foreground/80 hover:text-foreground transition-colors">
                      Impact Stories
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className="text-foreground/80 hover:text-foreground transition-colors">
                      Pricing
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
                    <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity">
                      Create Album
                    </Button>
                  </Link>
                  
                  {/* User Profile Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden md:inline">{user?.name || user?.email}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user?.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                          {user?.role === 'admin' && (
                            <p className="text-xs leading-none text-primary font-semibold mt-1">Admin</p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild className="bg-gradient-to-r from-primary to-accent">
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Visual Elements */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Decorative music illustrations */}
        <div className="absolute top-10 right-10 w-48 h-48 opacity-30 animate-bounce" style={{ animationDuration: '3s' }}>
          <img src="/images/music-instruments.jpg" alt="" className="w-full h-full object-contain rounded-full" />
        </div>
        <div className="absolute bottom-10 left-10 w-56 h-56 opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <img src="/images/music-doodle.jpg" alt="" className="w-full h-full object-contain rounded-lg rotate-12" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Main inspiring tagline - Most Prominent */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                Create music that unites people,
                <br />
                inspires change, and brings
                <br />
                positive impact to humanity
              </span>
            </h1>
            
            {/* Secondary tagline - Supporting text */}
            <div className="pt-6 space-y-3">
              <p className="text-2xl md:text-3xl font-semibold text-foreground/90">
                Create Full Albums with AI Magic
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-sm text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">AI-Powered Music Album Creation</span>
              </div>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto pt-4">
              Turn your themes and ideas into complete music albums with AI-generated lyrics, 
              prompts, artwork, and platform-optimized content for Suno, Udio, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/50">
                  <Link href="/new">
                    <a className="flex items-center gap-2">
                      {hasAlbums ? "Create Another Album" : "Create Your First Album"}
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/50">
                  <a href={getLoginUrl()} className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <Link href="/knowledge">
                  <a>Explore Platforms</a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Enhanced Visuals */}
      <section className="py-20 border-t border-border/50 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional album creation powered by cutting-edge AI
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent backdrop-blur border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Multi-Platform Support</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Generate optimized content for Suno, Udio, ElevenLabs, Mubert, and Stable Audio
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-br from-accent/5 to-transparent backdrop-blur border-border/50 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Wand2 className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">AI Quality Scoring</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Get hit-potential scores with detailed breakdowns for every song
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-transparent backdrop-blur border-border/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Palette className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Instant Artwork</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Beautiful album covers and track art generated automatically
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Themes with Images */}
      <section className="py-20 border-t border-border/50 relative">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
              Featured Themes
            </h2>
            <p className="text-xl text-muted-foreground">
              Get inspired by these curated album concepts
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredThemes.map((theme, i) => (
              <Card key={i} className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} backdrop-blur border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all group cursor-pointer`}>
                {/* Background image overlay */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src={theme.image} alt="" className="w-full h-full object-cover" />
                </div>
                <CardHeader className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-background/70 backdrop-blur flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg">
                    <theme.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{theme.title}</CardTitle>
                  <CardDescription className="text-foreground/80 text-base">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories Preview */}
      <section className="py-20 border-t border-border/50 relative bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Music That Changed the World
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Be inspired by songs that united communities, raised awareness, and brought hope to millions
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30 hover:border-red-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-xl">We Are the World</CardTitle>
                <CardDescription>USA for Africa • 1985</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Raised over $63 million for African famine relief, uniting 45 artists in history's most successful charity single.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-xl">Imagine</CardTitle>
                <CardDescription>John Lennon • 1971</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Global anthem for peace and unity, inspiring movements worldwide with its vision of a world without borders.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-xl">We Shall Overcome</CardTitle>
                <CardDescription>Various Artists • 1960</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Anthem of the Civil Rights Movement, giving voice to millions fighting for equality and justice.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Link href="/impact-stories">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Explore All Impact Stories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA with Visual Flair */}
      <section className="py-20 border-t border-border/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-blue-500/10 border border-primary/20 backdrop-blur">
            <Zap className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
              Ready to Create?
            </h2>
            <p className="text-xl text-muted-foreground">
              Start building your first AI-powered music album in minutes
            </p>
            {isAuthenticated ? (
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/30">
                <Link href="/new">
                  <a className="flex items-center gap-2">
                    Create Album Now
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/30">
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
      <footer className="border-t border-border/50 py-8 bg-background/50 backdrop-blur">
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
              <Link href="/impact-stories">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Impact Stories
                </a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

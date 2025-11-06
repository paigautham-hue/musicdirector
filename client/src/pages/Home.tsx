import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Zap, Star, ArrowRight, Palette, Wand2, User, LogOut, ChevronDown, Menu, X, Heart } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <span className="bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  The Collective Soul
                </span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link href="/library">
                    <a className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                      Library
                    </a>
                  </Link>
                  <Link href="/explore">
                    <a className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                      Explore
                    </a>
                  </Link>
                  <Link href="/community-prompts">
                    <a className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                      Prompts
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                      Pricing
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                        Admin
                      </a>
                    </Link>
                  )}
                  <Link href="/new">
                    <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                      Create
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <ChevronDown className="w-3 h-3" />
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
                <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent">
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Slide-in */}
        <div
          className={`fixed top-0 right-0 h-full w-[280px] bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: 60 }}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Menu Items */}
            <div className="flex-1 overflow-y-auto py-4" style={{ minHeight: 0, maxHeight: 'calc(100vh - 200px)' }}>
              {isAuthenticated ? (
                <div className="space-y-1 px-2">
                  <Link href="/library">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Library
                    </a>
                  </Link>
                  <Link href="/explore">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Explore
                    </a>
                  </Link>
                  <Link href="/community-prompts">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Community Prompts
                    </a>
                  </Link>
                  <Link href="/prompts">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Prompts
                    </a>
                  </Link>
                  <Link href="/knowledge">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Knowledge Hub
                    </a>
                  </Link>
                  <Link href="/impact-stories">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Impact Stories
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a
                      className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a
                        className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </a>
                    </Link>
                  )}
                  <div className="pt-4 px-2 space-y-2">
                    <Link href="/new">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create Album
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="px-4">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent" asChild>
                    <a href={getLoginUrl()}>Sign In</a>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Footer */}
            {isAuthenticated && (
              <div className="border-t border-border p-4 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logoutMutation.mutate();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Visual Elements */}
      <div className="relative">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-foreground">Create music that unites people,</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  inspires change, and brings
                </span>
                <span className="block text-muted-foreground">positive impact to</span>
                <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-primary bg-clip-text text-transparent">
                  humanity
                </span>
              </h1>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Create Full Albums with AI Magic
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">AI-Powered Music Album Creation</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Turn your themes and ideas into complete music albums with AI-generated lyrics, prompts, artwork, and platform-optimized content for Suno, Udio, and more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={hasAlbums ? "/new" : "/new"}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity group">
                    {hasAlbums ? "Create Another Album" : "Create Your First Album"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    Explore Platforms
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
                <img 
                  src="/images/music-doodle.jpg" 
                  alt="Music Creation" 
                  className="relative rounded-2xl shadow-2xl object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Everything You Need Section */}
      <div className="relative py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional album creation powered by cutting-edge AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Multi-Platform Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate optimized content for Suno, Udio, ElevenLabs, Mubert, and Stable Audio
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>AI Quality Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get AI-powered scores with detailed breakdowns for every song
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Instant Artwork</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Beautiful album covers and track art generated automatically
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Featured Themes */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Featured Themes
            </h2>
            <p className="text-lg text-muted-foreground">
              Get inspired by these curated album concepts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredThemes.map((theme, index) => (
              <Card key={index} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
                  <img 
                    src={theme.image} 
                    alt={theme.title}
                    className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <theme.icon className="w-16 h-16 text-primary" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{theme.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Music That Changed the World */}
      <div className="relative py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Music That Changed the World
            </h2>
            <p className="text-lg text-muted-foreground">
              Be inspired by songs that united communities, raised awareness, and brought hope to millions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle>We Are the World</CardTitle>
                <CardDescription>USA for Africa • 1985</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Raised over $63 million for African famine relief, uniting 45 artists in history's most successful charity single
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-300">
              <CardHeader>
                <CardTitle>Imagine</CardTitle>
                <CardDescription>John Lennon • 1971</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Global anthem for peace and unity, inspiring movements worldwide with its vision of a world without borders
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500/50 transition-all duration-300">
              <CardHeader>
                <CardTitle>We Shall Overcome</CardTitle>
                <CardDescription>Various Artists • 1960</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Anthem of the Civil Rights Movement, giving voice to millions fighting for equality and justice
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/impact-stories">
              <Button variant="outline" size="lg">
                Explore All Impact Stories
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Inspiration: A Promise for Peace */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_50%)]" />
            <CardContent className="relative p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Photo Side */}
                <div className="relative">
                  <div className="relative w-full aspect-square max-w-sm mx-auto">
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-blue-500/30 rounded-3xl blur-3xl animate-pulse" />
                    
                    {/* Photo container with elegant border */}
                    <div className="relative rounded-3xl overflow-hidden border-4 border-primary/30 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                      <img 
                        src="/promised-friend.jpg" 
                        alt="A Promise for Peace" 
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    
                    {/* Floating musical notes decoration */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
                      <Music className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                      <Heart className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                      A Promise for Peace
                    </h3>
                    <p className="text-lg text-muted-foreground italic">
                      "Music is the universal language that transcends borders and unites hearts"
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-foreground/90">
                    <p className="leading-relaxed">
                      Inspired by visionaries who believe in the transformative power of music, this platform is dedicated to creating songs that heal, unite, and bring positive change to humanity.
                    </p>
                    <p className="leading-relaxed">
                      Every album created here carries a promise—to spread love, foster understanding, and contribute to a more peaceful world through the universal language of music.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Peace Through Music
                    </Badge>
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Unity & Love
                    </Badge>
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                      <Music className="w-4 h-4 mr-2" />
                      Positive Impact
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-accent/5 to-blue-500/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <CardContent className="relative p-12 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Ready to Create?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Start building your first AI-powered music album in minutes
                </p>
                <Link href="/new">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                    Create Album Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music className="w-4 h-4" />
              <span>© 2025 AI Album Creator. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/knowledge">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Knowledge Hub</a>
              </Link>
              <Link href="/impact-stories">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Impact Stories</a>
              </Link>
              <Link href="/pricing">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

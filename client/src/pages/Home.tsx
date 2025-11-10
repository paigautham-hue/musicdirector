import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Zap, Star, ArrowRight, Palette, Wand2, Heart, Menu, X, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl, APP_TITLE } from "@/const";
import { PageTransition } from "@/components/PageTransition";
import { DiscoveryPlaylists } from "@/components/DiscoveryPlaylists";

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
    <PageTransition>
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav style={{ backgroundColor: '#0a0a0f', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with Built by GP and Soul Apps */}
            <div className="flex flex-col gap-1">
              <Link href="/">
                <a className="flex items-center gap-3 group">
                  {/* Custom AI-Generated Logo */}
                  <div className="relative transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                    <img 
                      src="/logo-custom.png" 
                      alt="AI Album Creator Logo" 
                      className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.8)] transition-all duration-300"
                    />
                  </div>
                  
                  {/* Premium Typography with Animated Gradients */}
                  <div className="flex flex-col leading-tight">
                    <span className="text-base sm:text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-yellow-400 bg-clip-text text-transparent animate-gradient-flow group-hover:scale-105 transition-transform duration-300">
                      The Collective
                    </span>
                    <span className="text-base sm:text-lg md:text-xl font-bold tracking-wider bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-flow-reverse">
                      Soul
                    </span>
                  </div>
                </a>
              </Link>
              {/* Built by GP and Soul Apps */}
              <div className="flex items-center gap-3 pl-1">
                <span className="text-xs text-muted-foreground/60">
                  Built by{' '}
                  <span className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    GP
                  </span>
                </span>
                <span className="text-muted-foreground/30">•</span>
                <a 
                  href="https://soulapps.manus.space" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
                  title="View more Soul Apps"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Soul Apps
                </a>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                       <Link href="/library"><a style={{ color: '#fff', fontSize: '14px' }}>My Music</a></Link>
                  <Link href="/explore"><a style={{ color: '#fff', fontSize: '14px' }}>Discover</a></Link>
                  <Link href="/prompts"><a style={{ color: '#fff', fontSize: '14px' }}>My Ideas</a></Link>
                  <Link href="/pricing"><a style={{ color: '#fff', fontSize: '14px' }}>Pricing</a></Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin"><a style={{ color: '#fff', fontSize: '14px' }}>Admin</a></Link>
                  )}
                  <Link href="/new">
                    <Button size="sm" style={{ background: 'linear-gradient(to right, #d4af37, #d4af37)', color: '#0a0a0f' }}>
                      Create
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()} style={{ color: '#fff' }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/explore"><a style={{ color: '#fff', fontSize: '14px' }}>Discover</a></Link>
                  <Link href="/pricing"><a style={{ color: '#fff', fontSize: '14px' }}>Pricing</a></Link>
                  <Button size="sm" asChild style={{ background: 'linear-gradient(to right, #d4af37, #d4af37)', color: '#0a0a0f' }}>
                    <a href={getLoginUrl()}>Get Started</a>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: '#fff' }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden"
        />
      )}

      {/* Mobile Menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '280px',
          backgroundColor: '#0a0a0f',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column'
        }}
        className="lg:hidden"
      >
        {/* Menu Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>Menu</span>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff' }}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px', minHeight: 0 }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/library">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Music
                </a>
              </Link>
              <Link href="/explore">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Discover
                </a>
              </Link>
              <Link href="/prompts">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Ideas
                </a>
              </Link>
              <Link href="/my-playlists">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Playlists
                </a>
              </Link>
              <Link href="/pricing">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <a
                    style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </a>
                </Link>
              )}
              <div style={{ paddingTop: '16px' }}>
                <Link href="/new">
                  <Button
                    style={{ width: '100%', background: 'linear-gradient(to right, #d4af37, #d4af37)', color: '#0a0a0f' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Album
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/explore">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textAlign: 'center', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Discover
                </a>
              </Link>
              <Link href="/pricing">
                <a
                  style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', color: '#ffffff', textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
              </Link>
              <div style={{ paddingTop: '16px' }}>
                <Button
                  style={{ width: '100%', background: 'linear-gradient(to right, #d4af37, #d4af37)', color: '#0a0a0f' }}
                  asChild
                >
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Footer */}
        {isAuthenticated && user && (
          <div style={{ flexShrink: 0, padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User className="w-5 h-5" style={{ color: '#0a0a0f' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || 'User'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
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

      {/* Hero Section with Visual Elements */}
      <div className="relative">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-foreground">Create music that unites people,</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  inspires change,
                </span>
                <span className="block text-foreground">and brings</span>
                <span className="block text-foreground">positive impact to</span>
                <span className="block bg-gradient-to-r from-blue-500 via-primary to-accent bg-clip-text text-transparent">
                  humanity
                </span>
              </h1>
              <p className="text-xl text-foreground/80 leading-relaxed">
                Create Full Albums with AI Magic
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>AI-Powered Music Album Creation</span>
              </div>
              <p className="text-lg text-foreground/70">
                Turn your themes and ideas into complete music albums with AI-generated lyrics, prompts, artwork, and platform-optimized content for Suno, Udio, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/new">
                      <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                        {hasAlbums ? 'Create Another Album' : 'Create Your First Album'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/explore?hasAudio=true">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all animate-pulse"
                        style={{
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite',
                          boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.2)'
                        }}
                      >
                        <Music className="mr-2 w-5 h-5" />
                        Play Community Music
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                      <a href={getLoginUrl()}>
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </a>
                    </Button>
                    <Link href="/explore?hasAudio=true">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all animate-pulse"
                        style={{
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite',
                          boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.2)'
                        }}
                      >
                        <Music className="mr-2 w-5 h-5" />
                        Play Community Music
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary/20 hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/music-instruments.jpg"
                  alt="Music Creation"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Everything You Need Section */}
      <div id="features" className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-foreground/70">Professional album creation powered by cutting-edge AI</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105 hover:border-primary/50">
              <CardHeader>
                <div className="w-24 h-24 mb-4 mx-auto">
                  <img src="/images/ai-creative-support.png" alt="AI Creative Support" className="w-full h-full object-cover rounded-lg" />
                </div>
                <CardTitle className="text-center">AI Creative Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Generate personalized content for Suno, Udio, ElevenLabs, Mubert, and Stable Audio
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105 hover:border-primary/50">
              <CardHeader>
                <div className="w-24 h-24 mb-4 mx-auto">
                  <img src="/images/quality-scoring.png" alt="Quality Scoring" className="w-full h-full object-cover rounded-lg" />
                </div>
                <CardTitle className="text-center">Quality Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Get AI-powered scores with detailed breakdowns for every song
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105 hover:border-primary/50">
              <CardHeader>
                <div className="w-24 h-24 mb-4 mx-auto">
                  <img src="/images/album-artwork-feature.png" alt="Album Artwork" className="w-full h-full object-cover rounded-lg" />
                </div>
                <CardTitle className="text-center">Album Artwork</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Beautiful album covers and track art generated automatically
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Featured Themes Section */}
      <div className="relative py-20 lg:py-32 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
              Featured Themes
            </h2>
            <p className="text-xl text-foreground/70">Get inspired by these curated album concepts</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredThemes.map((theme, index) => (
              <Card 
                key={index} 
                className="border-border/50 bg-card/50 backdrop-blur hover:shadow-2xl transition-all hover:scale-105 overflow-hidden group"
              >
                <div className={`h-48 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
                  <img 
                    src={theme.image} 
                    alt={theme.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <theme.icon className="w-16 h-16 text-primary animate-pulse" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{theme.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Curated Discovery Section */}
      <div className="relative py-20 lg:py-32 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <DiscoveryPlaylists variant="home" />
        </div>
      </div>

      {/* Music That Changed the World Section */}
      <div className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
              Music That Changed the World
            </h2>
            <p className="text-xl text-foreground/70">Be inspired by songs that united communities, raised awareness, and brought hope to millions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105">
              <CardHeader>
                <CardTitle>We Are the World</CardTitle>
                <Badge variant="secondary" className="w-fit">USA for Africa • 1985</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Raised over $63 million for African famine relief, uniting 45 artists in history's most successful charity single
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105">
              <CardHeader>
                <CardTitle>Imagine</CardTitle>
                <Badge variant="secondary" className="w-fit">John Lennon • 1971</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Global anthem for peace and unity, inspiring movements worldwide with its vision of a world without borders
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-xl transition-all hover:scale-105">
              <CardHeader>
                <CardTitle>We Shall Overcome</CardTitle>
                <Badge variant="secondary" className="w-fit">Various Artists • 1960s</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Anthem of the Civil Rights Movement, giving voice to millions fighting for equality and justice
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/impact-stories">
              <Button variant="outline" size="lg" className="border-primary/50 hover:bg-primary/10">
                Explore All Impact Stories
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* A Promise for Peace Section */}
      <div className="relative py-20 lg:py-32 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-accent/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary via-accent to-blue-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative">
                  <img
                    src="/images/promised-friend.png"
                    alt="PROMISED - A Promise for Peace"
                    className="w-full h-auto rounded-xl border-2 border-primary/30 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -top-4 -right-4 animate-bounce">
                    <Music className="w-8 h-8 text-primary drop-shadow-lg" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 animate-pulse">
                    <Heart className="w-8 h-8 text-accent drop-shadow-lg" />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="inline-block">
                  <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                    A Promise for Peace
                  </h2>
                </div>
                <p className="text-lg text-foreground/80 italic">
                  "Music is the universal language that transcends borders and unites hearts."
                </p>
                <div className="space-y-4 text-foreground/70">
                  <p>
                    Inspired by visionaries who believe in the transformative power of music, this platform exists to help you create art that brings people together.
                  </p>
                  <p>
                    Every album created here carries a promise—to spread love, foster understanding, and contribute to a more peaceful and unified world through the magic of music.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <Music className="w-4 h-4 mr-2" />
                    Peace Through Music
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Unity & Love
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Positive Impact
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-12 text-center space-y-8">
              <div className="w-32 h-32 mx-auto">
                <img src="/images/ready-to-create.png" alt="Ready to Create" className="w-full h-full object-cover rounded-lg" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                Ready to Create?
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Start building your first AI-powered music album in minutes
              </p>
              {isAuthenticated ? (
                <Link href="/new">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                    {hasAlbums ? 'Create Another Album' : 'Create Album Now'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                  <a href={getLoginUrl()}>
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  The Collective Soul
                </span>
              </div>
              <p className="text-sm text-foreground/60">
                AI-powered music album creation for the next generation of artists
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-foreground/60">

                <li><Link href="/pricing"><a className="hover:text-foreground transition-colors">Pricing</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/explore"><a className="hover:text-foreground transition-colors">Discover</a></Link></li>
                <li><Link href="/impact-stories"><a className="hover:text-foreground transition-colors">Impact Stories</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-foreground/60">
            <p>© 2025 AI Album Creator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}

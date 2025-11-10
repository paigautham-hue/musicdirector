import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Music, Menu, X, User, LogOut, ChevronDown, BarChart3, CreditCard, Image } from "lucide-react";
import { Link, useLocation } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppNav() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with Built by GP and Soul Apps */}
            <div className="flex flex-col gap-1">
              <Link href="/">
                <a className="flex items-center gap-3 group">
                  <div className="relative">
                    <img 
                      src="/logo-custom.png" 
                      alt="AI Album Creator" 
                      className="w-10 h-10 sm:w-12 sm:h-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-yellow-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base sm:text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-yellow-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] group-hover:animate-pulse">
                      The Collective
                    </span>
                    <span className="text-base sm:text-lg md:text-xl font-bold tracking-wider bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
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
                  <Link href="/library">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/library' 
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      Library
                    </a>
                  </Link>
                  <Link href="/explore">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/explore' 
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      Explore
                    </a>
                  </Link>
                  <Link href="/prompts">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/prompts' 
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      My Prompts
                    </a>
                  </Link>
                  <Link href="/community-prompts">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/community-prompts' 
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      Community
                    </a>
                  </Link>
                  <Link href="/playlists">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/playlists' || location === '/my-playlists' || location.startsWith('/playlist/')
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      Playlists
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className={`text-sm font-medium transition-colors ${
                      location === '/pricing' 
                        ? 'text-foreground border-b-2 border-primary pb-1' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}>
                      Pricing
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a className={`text-sm font-medium transition-colors ${
                        location.startsWith('/admin') 
                          ? 'text-foreground border-b-2 border-primary pb-1' 
                          : 'text-foreground/80 hover:text-foreground'
                      }`}>
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
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || 'Profile'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
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
                      <Link href="/profile">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/playlist-stats">
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Playlist Stats
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/payment/history">
                        <DropdownMenuItem>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payment History
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/gallery">
                        <DropdownMenuItem>
                          <Image className="w-4 h-4 mr-2" />
                          Gallery
                        </DropdownMenuItem>
                      </Link>
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
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slide-in */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 9999, backgroundColor: '#0a0a0f' }}
      >
          {/* Mobile Menu Container with proper overflow */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* Mobile Menu Header */}
            <div style={{ 
              flexShrink: 0,
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Menu Items - SCROLLABLE */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingTop: '1rem',
              paddingBottom: '1rem'
            }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.5rem' }}>
                  <Link href="/library">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      My Library
                    </a>
                  </Link>
                  <Link href="/explore">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Explore
                    </a>
                  </Link>
                  <Link href="/community-prompts">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Community Prompts
                    </a>
                  </Link>
                  <Link href="/prompts">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      My Prompts
                    </a>
                  </Link>
                  <Link href="/my-playlists">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      My Playlists
                    </a>
                  </Link>
                  <Link href="/playlists">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Discover Playlists
                    </a>
                  </Link>
                  <Link href="/playlist-stats">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Playlist Stats
                    </a>
                  </Link>
                  <Link href="/knowledge">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Knowledge Hub
                    </a>
                  </Link>
                  <Link href="/impact-stories">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Impact Stories
                    </a>
                  </Link>
                  <Link href="/payment/history">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Payment History
                    </a>
                  </Link>
                  <Link href="/gallery">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Gallery
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Pricing
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Admin
                      </a>
                    </Link>
                  )}
                  <div style={{ paddingTop: '1rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
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
                <div style={{ padding: '0 1rem' }}>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent" asChild>
                    <a href={getLoginUrl()}>Sign In</a>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Footer */}
            {isAuthenticated && (
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 500,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user?.name || 'User'}
                    </p>
                    <p style={{ 
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user?.email}
                    </p>
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
    </>
  );
}

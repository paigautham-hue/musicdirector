import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Music, Menu, X, User, LogOut, ChevronDown } from "lucide-react";
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
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <span className="bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  {APP_TITLE}
                </span>
              </a>
            </Link>

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
          className={`fixed top-0 right-0 h-full w-[280px] border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: 60, backgroundColor: '#0a0a0f' }}
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
            <div className="flex-1 overflow-y-auto py-4" style={{ maxHeight: 'calc(100vh - 60px - 140px)' }}>
              {isAuthenticated ? (
                <div className="space-y-1 px-2">
                  <Link href="/library">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Library
                    </a>
                  </Link>
                  <Link href="/explore">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Explore
                    </a>
                  </Link>
                  <Link href="/community-prompts">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Community Prompts
                    </a>
                  </Link>
                  <Link href="/prompts">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Prompts
                    </a>
                  </Link>
                  <Link href="/my-playlists">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Playlists
                    </a>
                  </Link>
                  <Link href="/playlists">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Discover Playlists
                    </a>
                  </Link>
                  <Link href="/knowledge">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Knowledge Hub
                    </a>
                  </Link>
                  <Link href="/impact-stories">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Impact Stories
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a
                      className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </a>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a
                        className="block px-4 py-3 rounded-lg text-white hover:bg-accent transition-colors"
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
    </>
  );
}

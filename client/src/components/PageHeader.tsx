import { ArrowLeft, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  showHome?: boolean;
  backTo?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  showBack = true, 
  showHome = false,
  backTo,
  children 
}: PageHeaderProps) {
  const [location] = useLocation();
  const isHome = location === "/";

  const handleBack = () => {
    if (backTo) {
      window.location.href = backTo;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showBack && !isHome && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              {showHome && !isHome && (
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          {children && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

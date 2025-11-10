import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`} aria-label="Breadcrumb">
      <Link href="/">
        <a className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </a>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {item.href && !isLast ? (
              <Link href={item.href}>
                <a className="hover:text-foreground transition-colors">
                  {item.label}
                </a>
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

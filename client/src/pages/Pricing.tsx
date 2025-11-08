import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";

// Credit packages (matches server/products.ts)
const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for trying out AI album creation',
    credits: 5,
    price: 999, // $9.99
    features: [
      '5 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
    ],
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    description: 'For serious music creators',
    credits: 15,
    price: 2499, // $24.99
    popular: true,
    features: [
      '15 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
      'Priority generation queue',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    description: 'For professional artists and producers',
    credits: 50,
    price: 7999, // $79.99
    features: [
      '50 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
      'Priority generation queue',
      'Dedicated support',
    ],
  },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getPricePerCredit(price: number, credits: number): string {
  const pricePerCredit = price / credits / 100;
  return `$${pricePerCredit.toFixed(2)}`;
}

export default function Pricing() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const createCheckout = trpc.payment.createCheckout.useMutation();

  const handlePurchase = async (productId: string) => {
    if (!isAuthenticated) {
      toast.info("Please log in to purchase credits");
      window.location.href = getLoginUrl();
      return;
    }

    try {
      toast.info("Redirecting to checkout...");
      const result = await createCheckout.mutateAsync({ productId });
      
      // Open checkout in new tab
      window.open(result.sessionUrl, '_blank');
    } catch (error: any) {
      toast.error(error.message || "Failed to create checkout session");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppNav />
      <PageHeader 
        title="Pricing" 
        description="Choose your credit package"
        showBack
        showHome
      />
      
      {/* Hero Section */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
            Choose Your Creative Power
          </h1>
          <p className="text-xl text-muted-foreground">
            Purchase credits to generate AI-powered music albums. No subscriptions, no hidden fees.
          </p>
          {isAuthenticated && user && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-accent/20 px-6 py-3 text-lg font-semibold">
              <span className="text-muted-foreground">Available Credits:</span>
              <span className="text-2xl font-bold text-accent">{user.musicGenerationQuota - user.musicGenerationsUsed}</span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${
                pkg.popular
                  ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'border-border'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                <CardDescription className="text-base">{pkg.description}</CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold">{formatPrice(pkg.price)}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {getPricePerCredit(pkg.price, pkg.credits)} per album
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 text-lg font-semibold text-accent">
                  {pkg.credits} Credits
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? "Processing..." : "Purchase Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container pb-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">What are credits?</h3>
              <p className="text-sm text-muted-foreground">
                Each credit allows you to generate one complete AI music album with multiple tracks, artwork, and all features.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">Do credits expire?</h3>
              <p className="text-sm text-muted-foreground">
                No! Your credits never expire. Use them whenever you're ready to create.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-sm text-muted-foreground">
                We offer refunds for unused credits within 30 days of purchase. Contact support for assistance.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, debit cards, and digital wallets through Stripe's secure payment processing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

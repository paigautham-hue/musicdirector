import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Refresh user data to get updated credit balance
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your credits have been added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <div className="rounded-lg bg-accent/20 p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
              <div className="text-3xl font-bold text-accent">
                {user.musicGenerationQuota - user.musicGenerationsUsed}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate("/create-album")}
            >
              Create Your First Album
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate("/library")}
            >
              Go to Library
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

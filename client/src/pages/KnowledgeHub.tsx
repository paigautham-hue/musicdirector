import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function KnowledgeHub() {
  const { data: platforms } = trpc.platforms.list.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span>{APP_TITLE}</span>
              </a>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">AI Music Platforms</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Compare features, constraints, and best practices for each platform
        </p>

        <div className="grid gap-8">
          {platforms?.map((platform) => (
            <Card key={platform.name}>
              <CardHeader>
                <CardTitle className="text-2xl">{platform.displayName}</CardTitle>
                <CardDescription>Platform constraints and best practices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Constraints</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(platform.constraints).map(([key, constraint]: [string, any]) => (
                      <p key={key}>
                        <span className="text-muted-foreground">{constraint.name}:</span>{" "}
                        {constraint.maxChars ? `${constraint.maxChars} chars max` : "No limit"}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {platform.bestPractices.map((practice: string, i: number) => (
                      <li key={i}>{practice}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

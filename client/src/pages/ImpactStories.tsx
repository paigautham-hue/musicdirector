import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Heart, Users, Globe, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { useState } from "react";

const impactStories = [
  {
    title: "We Are the World",
    artist: "USA for Africa",
    year: 1985,
    category: "Humanitarian Relief",
    impact: "Raised over $63 million for African famine relief. United 45 artists including Michael Jackson, Lionel Richie, Stevie Wonder, and Bruce Springsteen in one of history's most successful charity singles.",
    icon: Heart,
    color: "from-red-500/20 to-pink-500/20",
    borderColor: "border-red-500/50"
  },
  {
    title: "Imagine",
    artist: "John Lennon",
    year: 1971,
    category: "Unity & Peace",
    impact: "Became a global anthem for peace and unity. Its vision of a world without borders, religions, or possessions inspired peace movements worldwide and continues to unite people across cultures.",
    icon: Globe,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/50"
  },
  {
    title: "We Shall Overcome",
    artist: "Various Artists",
    year: 1960,
    category: "Social Justice",
    impact: "Served as the anthem of the American Civil Rights Movement. Sung at protests, marches, and rallies, it gave voice to millions fighting for equality and inspired similar movements globally.",
    icon: Users,
    color: "from-purple-500/20 to-indigo-500/20",
    borderColor: "border-purple-500/50"
  },
  {
    title: "The Concert for Bangladesh",
    artist: "George Harrison & Friends",
    year: 1971,
    category: "Humanitarian Relief",
    impact: "First major benefit concert in history. Raised global awareness for Bangladesh crisis and set the template for future charity concerts. As Ravi Shankar said: 'In one day, the whole world knew the name of Bangladesh.'",
    icon: Heart,
    color: "from-orange-500/20 to-amber-500/20",
    borderColor: "border-orange-500/50"
  },
  {
    title: "Strange Fruit",
    artist: "Billie Holiday",
    year: 1939,
    category: "Social Justice",
    impact: "Powerful protest against lynching and racial injustice in America. Brought uncomfortable truths to mainstream audiences and became one of the first songs to address racial violence directly.",
    icon: Users,
    color: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-500/50"
  },
  {
    title: "Blowin' in the Wind",
    artist: "Bob Dylan",
    year: 1963,
    category: "Peace & Social Change",
    impact: "Became an anthem for the anti-war and civil rights movements. Its profound questions about peace, war, and freedom resonated across generations and inspired countless activists.",
    icon: Sparkles,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/50"
  },
  {
    title: "Hope for Haiti Now",
    artist: "Various Artists",
    year: 2010,
    category: "Humanitarian Relief",
    impact: "Global telethon featuring Madonna, Coldplay, Shakira, and more raised $58 million for Haiti earthquake relief. Reached 83 million viewers worldwide, demonstrating music's power to mobilize global compassion.",
    icon: Heart,
    color: "from-rose-500/20 to-red-500/20",
    borderColor: "border-rose-500/50"
  },
  {
    title: "One Love",
    artist: "Bob Marley",
    year: 1977,
    category: "Unity & Peace",
    impact: "Universal message of unity and love transcended cultural and political boundaries. Became an anthem for peace in Jamaica and worldwide, promoting harmony across racial and social divides.",
    icon: Globe,
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/50"
  },
  {
    title: "I Am Woman",
    artist: "Helen Reddy",
    year: 1972,
    category: "Empowerment",
    impact: "Became the anthem of the women's liberation movement. Empowered millions of women to demand equality and recognition, fundamentally shifting cultural conversations about gender roles.",
    icon: Sparkles,
    color: "from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-500/50"
  },
  {
    title: "Sun City",
    artist: "Artists United Against Apartheid",
    year: 1985,
    category: "Social Justice",
    impact: "Protest song against apartheid in South Africa. United diverse artists in refusing to perform at Sun City resort, raising global awareness and contributing to international pressure that helped end apartheid.",
    icon: Users,
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/50"
  },
  {
    title: "Fight The Power",
    artist: "Public Enemy",
    year: 1989,
    category: "Social Justice",
    impact: "Powerful anthem against systemic racism and oppression. Energized the fight for racial justice and became a rallying cry for marginalized communities demanding change and equality.",
    icon: Users,
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/50"
  },
  {
    title: "People Have The Power",
    artist: "Patti Smith",
    year: 1988,
    category: "Empowerment",
    impact: "Optimistic declaration that ordinary people have the power to change the world. Inspired grassroots movements and reminded activists that collective action can overcome any obstacle.",
    icon: Sparkles,
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/50"
  }
];

const categories = [
  { name: "All", icon: Music },
  { name: "Humanitarian Relief", icon: Heart },
  { name: "Social Justice", icon: Users },
  { name: "Unity & Peace", icon: Globe },
  { name: "Empowerment", icon: Sparkles }
];

export default function ImpactStories() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredStories = selectedCategory === "All" 
    ? impactStories 
    : impactStories.filter(story => story.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span>The Collective Soul</span>
              </a>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Music That Changed the World
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                Impact Stories
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Throughout history, music has been a powerful force for positive change. These songs united communities, 
              raised awareness, inspired movements, and brought hope to millions around the world.
            </p>
            <div className="pt-4">
              <blockquote className="text-lg italic text-foreground/80 border-l-4 border-primary pl-4 max-w-2xl mx-auto text-left">
                "Music is a universal language that we all understand. By appealing to our emotions, 
                it has the ability to break down complex issues into things we can all relate to like love, 
                friendship, fear, or loss. In this way music expands our horizons and opens our minds to new ideas."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.name)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Stories Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, index) => {
              const Icon = story.icon;
              return (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden bg-gradient-to-br ${story.color} backdrop-blur border-2 ${story.borderColor} hover:shadow-xl transition-all group`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${story.color} border-2 ${story.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {story.year}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{story.title}</CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {story.artist}
                    </CardDescription>
                    <Badge variant="outline" className="w-fit mt-2 text-xs">
                      {story.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {story.impact}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 border-t border-border/50 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-blue-500/10 border border-primary/20 backdrop-blur">
            <Globe className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
              Create Your Impact
            </h2>
            <p className="text-lg text-muted-foreground">
              Music has the power to change the world. What story will your songs tell? 
              What positive impact will your music create?
            </p>
            <Link href="/new">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/30">
                Start Creating
              </Button>
            </Link>
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
                © 2025 The Collective Soul. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6">
              <Link href="/knowledge">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Knowledge Hub
                </a>
              </Link>
              <Link href="/gallery">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Gallery
                </a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

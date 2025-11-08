import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Music, ArrowLeft, ArrowRight, Loader2, X, Save, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function NewAlbum() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [theme, setTheme] = useState("");
  const [vibeInput, setVibeInput] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [audience, setAudience] = useState("");
  const [influenceInput, setInfluenceInput] = useState("");
  const [influences, setInfluences] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>("suno");
  const [trackCount, setTrackCount] = useState(10);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  
  // Parse URL parameters to pre-fill form from saved prompts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    const vibeParam = params.get('vibe');
    const platformParam = params.get('platform');
    const languageParam = params.get('language');
    const audienceParam = params.get('audience');
    const influencesParam = params.get('influences');
    const trackCountParam = params.get('trackCount');
    
    if (themeParam) setTheme(themeParam);
    if (vibeParam) {
      try {
        const parsedVibes = JSON.parse(vibeParam);
        if (Array.isArray(parsedVibes)) {
          setVibes(parsedVibes);
        }
      } catch {
        // If not JSON, treat as single vibe
        setVibes([vibeParam]);
      }
    }
    if (platformParam) setPlatform(platformParam);
    if (languageParam) setLanguage(languageParam);
    if (audienceParam) setAudience(audienceParam);
    if (influencesParam) {
      try {
        const parsedInfluences = JSON.parse(influencesParam);
        if (Array.isArray(parsedInfluences)) {
          setInfluences(parsedInfluences);
        }
      } catch {
        // Ignore invalid JSON
      }
    }
    if (trackCountParam) {
      const count = parseInt(trackCountParam, 10);
      if (!isNaN(count)) setTrackCount(count);
    }
  }, []);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    stage: string;
    progress: number;
    currentTrack?: number;
    totalTracks?: number;
    message: string;
  } | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [promptName, setPromptName] = useState("");

  const { data: savedPrompts } = trpc.promptTemplates.list.useQuery();
  const savePromptMutation = trpc.promptTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Prompt saved successfully!");
      setShowSaveDialog(false);
      setPromptName("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save prompt");
    },
  });

  const createAlbumMutation = trpc.albums.create.useMutation({
    onSuccess: (data) => {
      setJobId(data.jobId);
      // Start polling for progress
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create album");
      setIsGenerating(false);
    }
  });
  
  // Poll for progress
  const progressQuery = trpc.albums.getProgress.useQuery(
    { jobId: jobId! },
    {
      enabled: !!jobId,
      refetchInterval: 1000, // Poll every second
    }
  );
  
  // Handle progress updates
  useEffect(() => {
    if (progressQuery.data) {
      const data = progressQuery.data as any;
      setProgress(data);
      if (data.stage === "Complete" && data.albumId) {
        toast.success("Album created successfully!");
        setLocation(`/album/${data.albumId}`);
        setJobId(null);
      } else if (data.stage === "Error") {
        toast.error(data.message);
        setIsGenerating(false);
        setJobId(null);
      }
    }
  }, [progressQuery.data]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to create albums</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addVibe = () => {
    if (vibeInput.trim() && !vibes.includes(vibeInput.trim())) {
      setVibes([...vibes, vibeInput.trim()]);
      setVibeInput("");
    }
  };

  const removeVibe = (vibe: string) => {
    setVibes(vibes.filter(v => v !== vibe));
  };

  const addInfluence = () => {
    if (influenceInput.trim() && !influences.includes(influenceInput.trim())) {
      setInfluences([...influences, influenceInput.trim()]);
      setInfluenceInput("");
    }
  };

  const removeInfluence = (influence: string) => {
    setInfluences(influences.filter(i => i !== influence));
  };

  const handleSavePrompt = () => {
    if (!promptName.trim()) {
      toast.error("Please enter a name for this prompt");
      return;
    }
    savePromptMutation.mutate({
      name: promptName,
      theme,
      vibe: vibes,
      platform: platform as any,
      language,
      audience,
      influences,
      trackCount,
    });
  };

  const handleLoadPrompt = (template: any) => {
    setTheme(template.theme);
    setVibes(JSON.parse(template.vibe || "[]"));
    setPlatform(template.platform);
    setLanguage(template.language);
    setAudience(template.audience || "");
    setInfluences(JSON.parse(template.influences || "[]"));
    setTrackCount(template.trackCount);
    setShowLoadDialog(false);
    toast.success("Prompt loaded successfully!");
  };

  const handleSubmit = async () => {
    if (!theme || vibes.length === 0) {
      toast.error("Please fill in required fields");
      return;
    }

    // Prevent double submission
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    createAlbumMutation.mutate({
      theme,
      vibe: vibes,
      language,
      audience: audience || undefined,
      influences: influences.length > 0 ? influences : undefined,
      trackCount,
      platform: platform as any,
      visibility
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return theme.length > 0;
      case 2: return vibes.length > 0;
      case 3: return platform.length > 0;
      case 4: return trackCount > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  The Collective Soul
                </span>
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
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s === step ? 'bg-primary text-primary-foreground' :
                    s < step ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && <div className={`w-20 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {step === 1 && "Theme & Concept"}
                {step === 2 && "Style & Influences"}
                {step === 3 && "Platform Selection"}
                {step === 4 && "Track Count & Review"}
              </h2>
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-6">
                  {/* Load Saved Prompt Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowLoadDialog(true)}
                      className="gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Load Saved Prompt
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="theme" className="text-lg font-semibold">
                      What's your album about? *
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Describe the theme, concept, or message in one sentence
                    </p>
                    <Textarea
                      id="theme"
                      placeholder="e.g., Songs inspired by Osho's teachings about awareness and celebration"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      rows={4}
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="audience">Target Audience (Optional)</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Young adults seeking spiritual growth"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="vibe" className="text-lg font-semibold">
                      Vibe & Genres *
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add genres, moods, and vibes (press Enter to add)
                    </p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        id="vibe"
                        placeholder="e.g., ambient, meditative, uplifting"
                        value={vibeInput}
                        onChange={(e) => setVibeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVibe())}
                      />
                      <Button onClick={addVibe} type="button">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vibes.map((vibe) => (
                        <Badge key={vibe} variant="secondary" className="text-sm px-3 py-1">
                          {vibe}
                          <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeVibe(vibe)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="influence">Influences (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add artist styles or eras for inspiration (non-infringing descriptions only)
                    </p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        id="influence"
                        placeholder="e.g., 80s synthwave, acoustic folk style"
                        value={influenceInput}
                        onChange={(e) => setInfluenceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInfluence())}
                      />
                      <Button onClick={addInfluence} type="button">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {influences.map((influence) => (
                        <Badge key={influence} variant="outline" className="text-sm px-3 py-1">
                          {influence}
                          <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeInfluence(influence)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">
                      Music Generation Platform
                    </Label>
                    <Card className="border-primary bg-primary/10">
                      <CardHeader>
                        <CardTitle className="text-lg">Suno AI</CardTitle>
                        <CardDescription>
                          Professional AI music generator with lyrics support. Currently the only available platform.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    <p className="text-sm text-muted-foreground mt-4">
                      Additional platforms (Udio, ElevenLabs, Mubert, Stable Audio) will be enabled by admin when available.
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="trackCount" className="text-lg font-semibold">
                      Number of Tracks
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      How many songs should be in this album? (1-20)
                    </p>
                    <Input
                      id="trackCount"
                      type="number"
                      min="1"
                      max="20"
                      value={trackCount}
                      onChange={(e) => setTrackCount(parseInt(e.target.value) || 1)}
                      className="text-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="visibility" className="text-lg font-semibold">
                      Album Visibility
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose who can see your album
                    </p>
                    <Select value={visibility} onValueChange={(value: "public" | "private") => setVisibility(value)}>
                      <SelectTrigger id="visibility" className="text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private - Only you can see it</SelectItem>
                        <SelectItem value="public">Public - Anyone can discover it in the gallery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                    <h3 className="font-semibold text-lg">Review Your Album</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Theme:</span> {theme}</p>
                      <p><span className="text-muted-foreground">Vibes:</span> {vibes.join(", ")}</p>
                      <p><span className="text-muted-foreground">Platform:</span> {platform}</p>
                      <p><span className="text-muted-foreground">Tracks:</span> {trackCount}</p>
                      <p><span className="text-muted-foreground">Language:</span> {language}</p>
                      {audience && <p><span className="text-muted-foreground">Audience:</span> {audience}</p>}
                      {influences.length > 0 && <p><span className="text-muted-foreground">Influences:</span> {influences.join(", ")}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save/Load Prompt Buttons */}
          {step === 4 && !isGenerating && (
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowLoadDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Prompt
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || isGenerating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isGenerating || !canProceed()}
                className="min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {progress ? progress.message : "Generating Album..."}
                  </>
                ) : (
                  "Create Album"
                )}
              </Button>
            )}
          </div>
          
          {/* Progress Indicator - Music Themed */}
          {isGenerating && progress && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg text-foreground">{progress.stage}</span>
                <span className="text-sm text-muted-foreground">
                  {progress.currentTrack && progress.totalTracks
                    ? `Track ${progress.currentTrack}/${progress.totalTracks}`
                    : `${progress.progress}%`}
                </span>
              </div>
              
              {/* Animated Vinyl Record Progress */}
              <div className="relative flex items-center justify-center py-6">
                <div className="relative w-32 h-32">
                  {/* Spinning vinyl record */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-4 border-primary/30 animate-spin" style={{ animationDuration: '3s' }}>
                    {/* Vinyl grooves */}
                    <div className="absolute inset-4 rounded-full border-2 border-zinc-700/50" />
                    <div className="absolute inset-8 rounded-full border-2 border-zinc-700/30" />
                    <div className="absolute inset-12 rounded-full border-2 border-zinc-700/20" />
                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden relative">
                <div
                  className="bg-gradient-to-r from-primary via-accent to-primary h-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress.progress}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">{progress.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Prompt Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Save Prompt Template</DialogTitle>
            <DialogDescription>
              Save your current album settings to reuse later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="promptName">Template Name</Label>
              <Input
                id="promptName"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="e.g., My Favorite Theme"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrompt} disabled={savePromptMutation.isPending}>
              {savePromptMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Prompt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Prompt Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Prompt Template</DialogTitle>
            <DialogDescription>
              Choose a saved prompt to load its settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!savedPrompts || savedPrompts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved prompts yet. Create one by clicking "Save Prompt".
              </p>
            ) : (
              savedPrompts.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleLoadPrompt(template)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.theme}
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{template.platform}</Badge>
                      <Badge variant="secondary">{template.trackCount} tracks</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

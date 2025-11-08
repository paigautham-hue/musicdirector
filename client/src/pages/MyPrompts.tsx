import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2, Music, Loader2, Eye, EyeOff, Globe, Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";

export default function MyPrompts() {
  const [, setLocation] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    theme: "",
    vibe: [] as string[],
    platform: "suno" as "suno" | "udio" | "elevenlabs" | "mubert" | "stable_audio",
    language: "en",
    audience: "",
    influences: [] as string[],
    trackCount: 10,
  });

  const { data: templates, isLoading: loadingTemplates, refetch } = trpc.promptTemplates.list.useQuery();
  const { data: communityPrompts, isLoading: loadingCommunity } = trpc.social.getPublicPrompts.useQuery({ limit: 50 });
  
  const deleteMutation = trpc.promptTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Prompt deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete prompt");
    },
  });

  const updateMutation = trpc.promptTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Prompt updated successfully");
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update prompt");
    },
  });

  const updateVisibility = trpc.social.updatePromptVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  const incrementUsage = trpc.social.incrementPromptUsage.useMutation();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (template: any) => {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      theme: template.theme,
      vibe: JSON.parse(template.vibe || "[]"),
      platform: template.platform,
      language: template.language,
      audience: template.audience || "",
      influences: JSON.parse(template.influences || "[]"),
      trackCount: template.trackCount,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      ...editForm,
    });
  };

  const handleUsePrompt = (template: any) => {
    // Navigate to create album with this template's data
    const params = new URLSearchParams({
      theme: template.theme,
      vibe: template.vibe,
      platform: template.platform,
      language: template.language,
      audience: template.audience || "",
      influences: template.influences || "[]",
      trackCount: template.trackCount.toString(),
    });
    setLocation(`/new?${params.toString()}`);
  };

  const handleUseCommunityPrompt = (prompt: any) => {
    // Increment usage count
    incrementUsage.mutate({ promptId: prompt.id });

    // Parse vibe and influences
    const vibe = prompt.vibe ? JSON.parse(prompt.vibe) : [];
    const influences = prompt.influences ? JSON.parse(prompt.influences) : [];

    // Build URL with query parameters
    const params = new URLSearchParams({
      theme: prompt.theme || "",
      platform: prompt.platform || "suno",
      language: prompt.language || "en",
      trackCount: (prompt.trackCount || 10).toString(),
    });

    if (vibe.length > 0) {
      params.set("vibe", JSON.stringify(vibe));
    }
    if (prompt.audience) {
      params.set("audience", prompt.audience);
    }
    if (influences.length > 0) {
      params.set("influences", JSON.stringify(influences));
    }

    setLocation(`/new?${params.toString()}`);
    toast.success("Prompt loaded! Customize and create your album.");
  };

  const isLoading = loadingTemplates || loadingCommunity;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AppNav />
      <PageHeader 
        title="My Prompts" 
        description="Manage your saved album generation prompts"
        showBack
        showHome
      />
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Personal Prompts Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Music className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">My Personal Prompts</h2>
          </div>

          {!templates || templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <Music className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2">No Saved Prompts</h3>
              <p className="text-gray-400 mb-6">
                Save your album prompts to reuse them later
              </p>
              <Button onClick={() => setLocation("/new")}>
                Create Your First Album
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-gray-900 border-gray-800 p-6 hover:border-yellow-500/50 transition-colors"
                >
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-yellow-500">{template.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`visibility-${template.id}`}
                          checked={template.visibility === "public"}
                          onCheckedChange={(checked) => {
                            updateVisibility.mutate({
                              promptId: template.id,
                              visibility: checked ? "public" : "private"
                            });
                          }}
                        />
                        <Label htmlFor={`visibility-${template.id}`} className="text-sm cursor-pointer">
                          {template.visibility === "public" ? (
                            <Badge variant="default" className="bg-green-500">
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </Label>
                      </div>
                      {template.visibility === "public" && template.usageCount > 0 && (
                        <span className="text-xs text-gray-400">{template.usageCount} uses</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Theme</p>
                      <p className="text-sm line-clamp-2">{template.theme}</p>
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Platform</p>
                        <p className="text-sm capitalize">{template.platform}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Tracks</p>
                        <p className="text-sm">{template.trackCount}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400">Vibes</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(template.vibe || "[]").slice(0, 3).map((v: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUsePrompt(template)}
                  >
                    Use This Prompt
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Community Prompts Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Community Prompts</h2>
            <Badge variant="secondary" className="ml-auto">
              {communityPrompts?.length || 0} prompts
            </Badge>
          </div>

          {!communityPrompts || communityPrompts.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2">No Community Prompts</h3>
              <p className="text-gray-400">
                Be the first to share a prompt with the community!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityPrompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="bg-gray-900 border-gray-800 p-6 hover:border-purple-500/50 transition-colors"
                >
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-purple-400">{prompt.name}</h3>
                      <Badge variant="default" className="bg-green-500">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                    
                    {prompt.usageCount > 0 && (
                      <p className="text-xs text-gray-400">{prompt.usageCount} uses</p>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Theme</p>
                      <p className="text-sm line-clamp-2">{prompt.theme}</p>
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Platform</p>
                        <p className="text-sm capitalize">{prompt.platform}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Tracks</p>
                        <p className="text-sm">{prompt.trackCount}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400">Vibes</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(prompt.vibe || "[]").slice(0, 3).map((v: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleUseCommunityPrompt(prompt)}
                  >
                    Use This Prompt
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt Template</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your saved prompt template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Textarea
                id="theme"
                value={editForm.theme}
                onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={editForm.platform}
                  onChange={(e) => setEditForm({ ...editForm, platform: e.target.value as any })}
                  className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-2"
                >
                  <option value="suno">Suno</option>
                  <option value="udio">Udio</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="mubert">Mubert</option>
                  <option value="stable_audio">Stable Audio</option>
                </select>
              </div>

              <div>
                <Label htmlFor="trackCount">Track Count</Label>
                <Input
                  id="trackCount"
                  type="number"
                  min={1}
                  max={20}
                  value={editForm.trackCount}
                  onChange={(e) => setEditForm({ ...editForm, trackCount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

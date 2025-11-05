import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2, Music, Loader2 } from "lucide-react";
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

  const { data: templates, isLoading, refetch } = trpc.promptTemplates.list.useQuery();
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
    setLocation(`/create?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
              My Prompts
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {!templates || templates.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-bold mb-2">No Saved Prompts</h2>
            <p className="text-gray-400 mb-6">
              Save your album prompts to reuse them later
            </p>
            <Button onClick={() => setLocation("/create")}>
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
                <div className="flex items-start justify-between mb-4">
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

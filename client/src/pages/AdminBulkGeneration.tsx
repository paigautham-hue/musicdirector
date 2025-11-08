import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";
import { 
  Loader2, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Filter,
  Music,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function AdminBulkGeneration() {
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set());
  const [filterUsage, setFilterUsage] = useState<"all" | "unused" | "used">("unused");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [generatedAlbums, setGeneratedAlbums] = useState<any[]>([]);

  const { data: prompts, isLoading } = trpc.social.getPublicPrompts.useQuery({ limit: 100 });
  const bulkGenerateMutation = trpc.admin.bulkGenerateAlbums.useMutation();

  // Filter prompts based on usage
  const filteredPrompts = prompts?.filter(prompt => {
    if (filterUsage === "unused") return (prompt.usageCount || 0) === 0;
    if (filterUsage === "used") return (prompt.usageCount || 0) > 0;
    return true;
  }) || [];

  const handleSelectAll = () => {
    if (selectedPrompts.size === filteredPrompts.length) {
      setSelectedPrompts(new Set());
    } else {
      setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
    }
  };

  const handleTogglePrompt = (promptId: number) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId);
    } else {
      newSelected.add(promptId);
    }
    setSelectedPrompts(newSelected);
  };

  const handleBulkGenerate = async () => {
    if (selectedPrompts.size === 0) {
      toast.error("Please select at least one prompt");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedPrompts.size });
    setGeneratedAlbums([]);

    try {
      const result = await bulkGenerateMutation.mutateAsync({
        promptIds: Array.from(selectedPrompts)
      });

      setGeneratedAlbums(result.albums);
      toast.success(`Successfully generated ${result.albums.length} albums!`);
      setSelectedPrompts(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to generate albums");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <AppNav />
      <PageHeader 
        title="Bulk Album Generation" 
        description="Generate albums for multiple community prompts"
        showBack
        showHome
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredPrompts.length}</div>
              <div className="text-sm text-muted-foreground">Available Prompts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{selectedPrompts.size}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {prompts?.filter(p => (p.usageCount || 0) === 0).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Unused Prompts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{generatedAlbums.length}</div>
              <div className="text-sm text-muted-foreground">Generated</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterUsage} onValueChange={(v: any) => setFilterUsage(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prompts</SelectItem>
                      <SelectItem value="unused">Unused Only</SelectItem>
                      <SelectItem value="used">Used Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredPrompts.length === 0}
                >
                  {selectedPrompts.size === filteredPrompts.length ? (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={handleBulkGenerate}
                disabled={selectedPrompts.size === 0 || isGenerating}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating... ({generationProgress.current}/{generationProgress.total})
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {selectedPrompts.size} Album{selectedPrompts.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="mt-4">
                <Progress 
                  value={(generationProgress.current / generationProgress.total) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Generating albums... This may take several minutes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Albums Section */}
        {generatedAlbums.length > 0 && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">
                ✓ Successfully Generated {generatedAlbums.length} Albums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedAlbums.map((album) => (
                  <div key={album.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                    <Music className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium truncate">{album.title}</span>
                    <Badge variant="secondary" className="ml-auto">{album.trackCount} tracks</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prompts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No prompts found with the selected filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className={`transition-all cursor-pointer hover:shadow-lg ${
                  selectedPrompts.has(prompt.id) 
                    ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950' 
                    : ''
                }`}
                onClick={() => handleTogglePrompt(prompt.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedPrompts.has(prompt.id)}
                      onCheckedChange={() => handleTogglePrompt(prompt.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{prompt.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{prompt.theme}</p>
                        </div>
                        <Badge 
                          variant={(prompt.usageCount || 0) === 0 ? "destructive" : "secondary"}
                          className="ml-2"
                        >
                          {prompt.usageCount || 0} uses
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline">{prompt.platform}</Badge>
                        <Badge variant="outline">{prompt.trackCount} tracks</Badge>
                        {prompt.language && (
                          <Badge variant="outline">{prompt.language.toUpperCase()}</Badge>
                        )}
                      </div>

                      {prompt.vibe && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Vibes: </span>
                          {JSON.parse(prompt.vibe).slice(0, 3).map((v: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs mr-1">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

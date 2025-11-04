import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Music, Key } from "lucide-react";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { data: settings, refetch } = trpc.admin.getSettings.useQuery();
  const updateSetting = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const [musicGenEnabled, setMusicGenEnabled] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    suno: "",
    udio: "",
    elevenlabs: "",
    mubert: "",
    stable_audio: ""
  });

  // Load settings from database
  useState(() => {
    if (settings) {
      const musicGenSetting = settings.find((s: any) => s.key === "music_generation_enabled");
      setMusicGenEnabled(musicGenSetting?.value === "true");

      // Load API keys
      const platforms = ["suno", "udio", "elevenlabs", "mubert", "stable_audio"];
      const keys: any = {};
      platforms.forEach(platform => {
        const keySetting = settings.find((s: any) => s.key === `${platform}_api_key`);
        keys[platform] = keySetting?.value || "";
      });
      setApiKeys(keys);
    }
  });

  const handleToggleMusicGen = async (enabled: boolean) => {
    setMusicGenEnabled(enabled);
    await updateSetting.mutateAsync({
      key: "music_generation_enabled",
      value: enabled.toString(),
      description: "Enable or disable music generation feature"
    });
  };

  const handleSaveApiKey = async (platform: string) => {
    await updateSetting.mutateAsync({
      key: `${platform}_api_key`,
      value: apiKeys[platform as keyof typeof apiKeys],
      description: `API key for ${platform}`
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="text-amber-500 hover:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-amber-500">System Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Music Generation Settings */}
        <Card className="bg-zinc-900 border-amber-500/20 mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-amber-500" />
              <div>
                <CardTitle className="text-amber-500">Music Generation</CardTitle>
                <CardDescription>Configure automatic music generation with platform APIs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-amber-500/10">
              <div>
                <Label htmlFor="music-gen-toggle" className="text-base font-semibold">
                  Enable Music Generation
                </Label>
                <p className="text-sm text-zinc-400 mt-1">
                  Allow users to generate actual audio files via platform APIs
                </p>
              </div>
              <Switch
                id="music-gen-toggle"
                checked={musicGenEnabled}
                onCheckedChange={handleToggleMusicGen}
              />
            </div>

            {musicGenEnabled && (
              <div className="text-sm text-amber-500/80 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                ⚠️ Music generation is enabled. Make sure to configure API keys below.
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys Configuration */}
        <Card className="bg-zinc-900 border-amber-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-amber-500" />
              <div>
                <CardTitle className="text-amber-500">Platform API Keys</CardTitle>
                <CardDescription>Configure API credentials for music generation platforms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Suno */}
            <div className="space-y-2">
              <Label htmlFor="suno-key">Suno AI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="suno-key"
                  type="password"
                  placeholder="Enter Suno API key"
                  value={apiKeys.suno}
                  onChange={(e) => setApiKeys({ ...apiKeys, suno: e.target.value })}
                  className="bg-black border-amber-500/20 focus:border-amber-500"
                />
                <Button
                  onClick={() => handleSaveApiKey("suno")}
                  disabled={updateSetting.isPending}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Udio */}
            <div className="space-y-2">
              <Label htmlFor="udio-key">Udio API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="udio-key"
                  type="password"
                  placeholder="Enter Udio API key"
                  value={apiKeys.udio}
                  onChange={(e) => setApiKeys({ ...apiKeys, udio: e.target.value })}
                  className="bg-black border-amber-500/20 focus:border-amber-500"
                />
                <Button
                  onClick={() => handleSaveApiKey("udio")}
                  disabled={updateSetting.isPending}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ElevenLabs */}
            <div className="space-y-2">
              <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="elevenlabs-key"
                  type="password"
                  placeholder="Enter ElevenLabs API key"
                  value={apiKeys.elevenlabs}
                  onChange={(e) => setApiKeys({ ...apiKeys, elevenlabs: e.target.value })}
                  className="bg-black border-amber-500/20 focus:border-amber-500"
                />
                <Button
                  onClick={() => handleSaveApiKey("elevenlabs")}
                  disabled={updateSetting.isPending}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mubert */}
            <div className="space-y-2">
              <Label htmlFor="mubert-key">Mubert API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="mubert-key"
                  type="password"
                  placeholder="Enter Mubert API key"
                  value={apiKeys.mubert}
                  onChange={(e) => setApiKeys({ ...apiKeys, mubert: e.target.value })}
                  className="bg-black border-amber-500/20 focus:border-amber-500"
                />
                <Button
                  onClick={() => handleSaveApiKey("mubert")}
                  disabled={updateSetting.isPending}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stable Audio */}
            <div className="space-y-2">
              <Label htmlFor="stable-audio-key">Stable Audio API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="stable-audio-key"
                  type="password"
                  placeholder="Enter Stable Audio API key"
                  value={apiKeys.stable_audio}
                  onChange={(e) => setApiKeys({ ...apiKeys, stable_audio: e.target.value })}
                  className="bg-black border-amber-500/20 focus:border-amber-500"
                />
                <Button
                  onClick={() => handleSaveApiKey("stable_audio")}
                  disabled={updateSetting.isPending}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-zinc-400 p-3 bg-zinc-800/50 rounded-lg mt-4">
              <p className="font-semibold mb-2">How to get API keys:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Suno: Visit suno.ai and create an API account</li>
                <li>Udio: Visit udio.com/api for developer access</li>
                <li>ElevenLabs: Get your key from elevenlabs.io/api</li>
                <li>Mubert: Register at mubert.com/api</li>
                <li>Stable Audio: Visit stability.ai for API access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

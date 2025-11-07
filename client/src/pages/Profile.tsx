import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, User, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const utils = trpc.useUtils();
  
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
  
  const uploadAvatarMutation = trpc.profile.uploadAvatar.useMutation({
    onSuccess: (data) => {
      setAvatarPreview(data.avatarUrl);
      setAvatarFile(null);
      toast.success("Profile picture uploaded!");
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to upload picture: ${error.message}`);
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setAvatarFile({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = async () => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync({
          base64Image: avatarFile.base64,
          mimeType: avatarFile.mimeType,
        });
      }
      
      // Update bio
      await updateProfileMutation.mutateAsync({ bio });
      
      // Redirect to library after successful update
      setTimeout(() => setLocation("/library"), 1000);
    } catch (error) {
      // Error handling done in mutation callbacks
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to edit your profile</p>
      </div>
    );
  }
  
  const isSaving = updateProfileMutation.isPending || uploadAvatarMutation.isPending;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/library")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Edit Profile</h1>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container max-w-2xl py-8">
        <Card className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          
          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio (Optional)
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              maxLength={500}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 characters
            </p>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/library")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

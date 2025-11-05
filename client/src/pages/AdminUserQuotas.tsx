import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Users, Music } from "lucide-react";

export default function AdminUserQuotas() {
  const [, setLocation] = useLocation();
  const { data: users, refetch } = trpc.admin.getAllUsers.useQuery();
  const updateQuota = trpc.admin.updateUserQuota.useMutation({
    onSuccess: () => {
      toast.success("Quota updated successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update quota: ${error.message}`);
    }
  });

  const [quotas, setQuotas] = useState<Record<number, number>>({});

  const handleUpdateQuota = async (userId: number, quota: number) => {
    await updateQuota.mutateAsync({ userId, quota });
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
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                <Users className="w-6 h-6" />
                User Quota Management
              </h1>
              <p className="text-sm text-gray-400">Manage music generation quotas for users</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-zinc-900 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Music Generation Quotas
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set how many albums with actual music each user can generate. Unlimited albums with just lyrics/prompts are always allowed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 pb-2 border-b border-amber-500/20 text-sm font-semibold text-amber-500">
                <div>User</div>
                <div>Email</div>
                <div>Role</div>
                <div>Quota / Used</div>
                <div>Actions</div>
              </div>

              {/* User Rows */}
              {users?.map((user: any) => (
                <div key={user.id} className="grid grid-cols-5 gap-4 items-center py-3 border-b border-zinc-800">
                  <div className="text-white">{user.name || "Unknown"}</div>
                  <div className="text-gray-400 text-sm">{user.email || "No email"}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === "admin" 
                        ? "bg-amber-500/20 text-amber-500" 
                        : "bg-zinc-800 text-gray-400"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    {user.musicGenerationsUsed || 0} / {user.musicGenerationQuota === 999999 ? "∞" : user.musicGenerationQuota || 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Quota"
                      defaultValue={user.musicGenerationQuota || 1}
                      onChange={(e) => setQuotas({ ...quotas, [user.id]: parseInt(e.target.value) || 0 })}
                      className="w-24 bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateQuota(user.id, quotas[user.id] || user.musicGenerationQuota || 1)}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {!users || users.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No users found
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-500 mb-2">Quota System Explanation</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• <strong>Quota</strong>: Number of albums with actual music generation (uses Suno API credits)</li>
                <li>• <strong>Used</strong>: Number of albums with music already generated</li>
                <li>• <strong>Unlimited Albums</strong>: Users can create unlimited albums with just lyrics/prompts/artwork (no API usage)</li>
                <li>• <strong>Admin Users</strong>: Set quota to 999999 for unlimited music generation</li>
                <li>• <strong>Default</strong>: New users get 1 music generation by default</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

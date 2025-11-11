import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Users, Music, Plus, Gift } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [creditsToGrant, setCreditsToGrant] = useState(1);

  const handleUpdateQuota = async (userId: number, quota: number) => {
    await updateQuota.mutateAsync({ userId, quota });
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users?.map(u => u.id) || []));
    }
  };

  const handleGrantCredits = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);
      for (const userId of userIds) {
        const user = users?.find(u => u.id === userId);
        if (user) {
          const newQuota = (user.musicGenerationQuota || 1) + creditsToGrant;
          await updateQuota.mutateAsync({ userId, quota: newQuota });
        }
      }
      toast.success(`Granted ${creditsToGrant} credits to ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      setGrantDialogOpen(false);
      setCreditsToGrant(1);
    } catch (error) {
      toast.error("Failed to grant credits");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
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
            {selectedUsers.size > 0 && (
              <Button
                onClick={() => setGrantDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Gift className="w-4 h-4 mr-2" />
                Grant Credits ({selectedUsers.size} selected)
              </Button>
            )}
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
              {/* Bulk Actions */}
              <div className="flex items-center gap-4 mb-4">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.size === users?.length && users?.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-gray-400 cursor-pointer">
                  Select All ({selectedUsers.size} selected)
                </label>
              </div>

              {/* Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-6 gap-4 pb-2 border-b border-amber-500/20 text-sm font-semibold text-amber-500">
                <div>Select</div>
                <div>User</div>
                <div>Email</div>
                <div>Role</div>
                <div>Quota / Used</div>
                <div>Actions</div>
              </div>

              {/* User Rows */}
              {users?.map((user: any) => (
                <div key={user.id}>
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-6 gap-4 items-center py-3 border-b border-zinc-800">
                    <div>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        disabled={user.role === 'admin'}
                      />
                    </div>
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
                        value={quotas[user.id] !== undefined ? quotas[user.id] : user.musicGenerationQuota || 1}
                        onChange={(e) => setQuotas({ ...quotas, [user.id]: parseInt(e.target.value) || 0 })}
                        className="w-24 bg-zinc-800 border-zinc-700 text-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuota(user.id, quotas[user.id] !== undefined ? quotas[user.id] : user.musicGenerationQuota || 1)}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Layout - Card Style */}
                  <div className="md:hidden bg-zinc-800/50 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          disabled={user.role === 'admin'}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{user.name || "Unknown"}</div>
                          <div className="text-gray-400 text-sm truncate">{user.email || "No email"}</div>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === "admin" 
                                ? "bg-amber-500/20 text-amber-500" 
                                : "bg-zinc-700 text-gray-300"
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                      <div className="text-sm">
                        <span className="text-gray-400">Used: </span>
                        <span className="text-white font-medium">{user.musicGenerationsUsed || 0}</span>
                        <span className="text-gray-400"> / </span>
                        <span className="text-amber-500 font-medium">
                          {user.musicGenerationQuota === 999999 ? "∞" : user.musicGenerationQuota || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Set New Quota</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Quota"
                          value={quotas[user.id] !== undefined ? quotas[user.id] : user.musicGenerationQuota || 1}
                          onChange={(e) => setQuotas({ ...quotas, [user.id]: parseInt(e.target.value) || 0 })}
                          className="bg-zinc-900 border-zinc-700 text-white"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuota(user.id, quotas[user.id] !== undefined ? quotas[user.id] : user.musicGenerationQuota || 1)}
                        className="bg-amber-500 hover:bg-amber-600 text-black self-end"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
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

      {/* Grant Credits Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Grant Music Generation Credits</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add free music generation credits to {selectedUsers.size} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Number of credits to grant
              </label>
              <Input
                type="number"
                min="1"
                value={creditsToGrant}
                onChange={(e) => setCreditsToGrant(parseInt(e.target.value) || 1)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="p-3 bg-zinc-800 rounded text-sm text-gray-400">
              <p className="mb-2">Selected users:</p>
              <ul className="list-disc list-inside space-y-1">
                {Array.from(selectedUsers).map((userId) => {
                  const user = users?.find(u => u.id === userId);
                  return (
                    <li key={userId}>
                      {user?.name || "Unknown"} - Current: {user?.musicGenerationQuota || 1} → New: {(user?.musicGenerationQuota || 1) + creditsToGrant}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(false)}
              className="border-zinc-700 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantCredits}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              Grant {creditsToGrant} Credit{creditsToGrant !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

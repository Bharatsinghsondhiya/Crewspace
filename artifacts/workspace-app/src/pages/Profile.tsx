import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile, useChangePassword, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle, ShieldCheck, KeyRound, User as UserIcon } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Must be at least 8 characters"),
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const profileMutation = useUpdateProfile();
  const passwordMutation = useChangePassword();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", avatarUrl: user?.avatarUrl || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    profileMutation.mutate({ data }, {
      onSuccess: (updatedUser) => {
        toast.success("Profile updated securely.");
        updateUser(updatedUser);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    passwordMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Password changed securely.");
        passwordForm.reset();
      },
      onError: () => toast.error("Failed to update password. Please check your current password.")
    });
  };

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-1 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-transparent">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-[#080416] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#080416]" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{user?.name}</h1>
          <p className="text-white/50 mt-1 flex items-center gap-2">
            <UserCircle className="w-4 h-4" /> {user?.email}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-400" /> Personal Info
            </CardTitle>
            <CardDescription className="text-white/40">Update your display name and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                <FormField control={profileForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="avatarUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Avatar URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50" placeholder="https://example.com/avatar.png" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <Button type="submit" disabled={profileMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  {profileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" /> Security
            </CardTitle>
            <CardDescription className="text-white/40">Change your password and secure your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <Button type="submit" disabled={passwordMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

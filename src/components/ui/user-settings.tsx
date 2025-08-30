import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { KYCVerification } from "@/components/ui/kyc-verification";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Bell, 
  Shield, 
  Eye, 
  Lock,
  Camera,
  Save,
  AlertTriangle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  country: z.string().optional(),
  date_of_birth: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { user, userProfile, userRole } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: userProfile?.full_name || "",
      email: userProfile?.email || user?.email || "",
      phone: userProfile?.phone || "",
      company_name: userProfile?.company_name || "",
      country: userProfile?.country || "",
      date_of_birth: userProfile?.date_of_birth || "",
    },
  });

  // Fetch user preferences
  const { data: preferences = {
    two_factor_enabled: false,
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
  } } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      // In real app, fetch from database
      return {
        email_notifications: true,
        push_notifications: true,
        marketing_emails: false,
        two_factor_enabled: false,
        theme: "system",
        language: "en",
        timezone: "UTC",
      };
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          company_name: data.company_name,
          country: data.country,
          date_of_birth: data.date_of_birth || null,
          profile_image_url: profileImage || userProfile?.profile_image_url,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <Badge variant={userRole === 'verified_user' ? 'default' : 'secondary'}>
          {userRole?.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileImage || userProfile?.profile_image_url} />
                  <AvatarFallback className="text-lg">
                    {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <FileUpload
                    onUpload={(urls) => setProfileImage(urls[0])}
                    accept="image/*"
                    maxSize={2 * 1024 * 1024} // 2MB
                  />
                </div>
              </div>

              <Separator />

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      disabled={!isEditing}
                      {...form.register("full_name")}
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      disabled // Email changes require special handling
                      {...form.register("email")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      disabled={!isEditing}
                      {...form.register("phone")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_name">Company</Label>
                    <Input
                      id="company_name"
                      disabled={!isEditing}
                      {...form.register("company_name")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      disabled={!isEditing}
                      onValueChange={(value) => form.setValue("country", value)}
                      value={form.watch("country")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="SG">Singapore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      disabled={!isEditing}
                      {...form.register("date_of_birth")}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch checked={preferences.two_factor_enabled} />
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Change Password</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Active Sessions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Chrome on Windows • Current</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your assets and transactions
                    </p>
                  </div>
                  <Switch checked={preferences.email_notifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant alerts in your browser
                    </p>
                  </div>
                  <Switch checked={preferences.push_notifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and offers
                    </p>
                  </div>
                  <Switch checked={preferences.marketing_emails} />
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Notification Categories</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Asset Updates", description: "Changes to your tokenized assets" },
                      { label: "Transaction Alerts", description: "Buy/sell confirmations and updates" },
                      { label: "KYC Status", description: "Verification process updates" },
                      { label: "Security Alerts", description: "Account security notifications" },
                    ].map((category) => (
                      <div key={category.label} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category.label}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <KYCVerification />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Verified</p>
                    <p className="text-sm text-muted-foreground">Your email address is confirmed</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Identity Verification</p>
                    <p className="text-sm text-muted-foreground">Complete KYC to access all features</p>
                  </div>
                  <Badge variant={userRole === 'verified_user' ? 'default' : 'secondary'}>
                    {userRole === 'verified_user' ? 'Verified' : 'Pending'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Wallet Connected</p>
                    <p className="text-sm text-muted-foreground">Link your crypto wallet for trading</p>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
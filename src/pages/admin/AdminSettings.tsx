import { useState, useEffect } from "react";
// Admin Settings Component - Integrated Logo Manager with tabs
import { Save, Globe, Truck, Shield, Bell, Loader2, Key, Eye, EyeOff, Image as ImageIcon, Settings, CreditCard, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { settingsService, StoreSettings } from "@/lib/settingsService";
import { useLogoSettings } from "@/hooks/useLogoSettings";
import { supabase } from "@/integrations/supabase/client";

/* ─── Stripe state shape ─── */
interface StripeConfig {
  enabled: boolean;
  liveMode: boolean;
  publishableKeyTest: string;
  secretKeyTest: string;
  webhookSecretTest: string;
  publishableKeyLive: string;
  secretKeyLive: string;
  webhookSecretLive: string;
}

const defaultStripe: StripeConfig = {
  enabled: false,
  liveMode: false,
  publishableKeyTest: "",
  secretKeyTest: "",
  webhookSecretTest: "",
  publishableKeyLive: "",
  secretKeyLive: "",
  webhookSecretLive: "",
};

const AdminSettings = () => {
  const { logos, updateLogo, resetLogo } = useLogoSettings();
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "Fashion Spectrum",
    store_email: "contact@fashionspectrum.com",
    store_phone: "+61 2 9876 5432",
    currency: "AUD",
    tax_rate: 10,
    free_shipping_min: 100,
    shipping_fee: 15,
    enable_wishlist: true,
    enable_cod: true,
    maintenance_mode: false,
    email_notifications: true,
    order_notifications: true,
    low_stock_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* ── Password ── */
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);

  /* ── Logo Management ── */
  const handleLogoUpload = async (type: keyof typeof logos, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingLogo(type);
      await updateLogo(type, file);
      toast({
        title: "Logo updated",
        description: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} logo has been updated successfully.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to update logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleLogoReset = async (type: keyof typeof logos) => {
    try {
      setUploadingLogo(type);
      await resetLogo(type);
      toast({
        title: "Logo reset",
        description: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} logo has been reset to default.`
      });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Failed to reset logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  /* ── Stripe ── */
  const [stripe, setStripe] = useState<StripeConfig>(defaultStripe);
  const [savingStripe, setSavingStripe] = useState(false);

  useEffect(() => {
    loadSettings();
    // Load Stripe config from localStorage (never store secret keys in DB)
    try {
      const raw = localStorage.getItem("stripe_settings");
      if (raw) setStripe(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({ title: "Error loading settings", description: "Please try again later", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof StoreSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateStripe = (key: keyof StripeConfig, value: string | boolean) =>
    setStripe(prev => ({ ...prev, [key]: value }));

  const saveSettings = async () => {
    try {
      setSaving(true);
      const validation = settingsService.validateSettings(settings);
      if (!validation.isValid) {
        toast({ title: "Validation Error", description: validation.errors.join(", "), variant: "destructive" });
        return;
      }
      await settingsService.saveSettings(settings);
      setHasChanges(false);
      toast({ title: "Settings saved successfully!" });
    } catch (error) {
      toast({ title: "Error saving settings", description: "Please try again later", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveStripeSettings = () => {
    try {
      setSavingStripe(true);
      const pubKey = stripe.liveMode ? stripe.publishableKeyLive : stripe.publishableKeyTest;
      const secKey = stripe.liveMode ? stripe.secretKeyLive : stripe.secretKeyTest;
      if (stripe.enabled && (!pubKey.trim() || !secKey.trim())) {
        toast({
          title: "Stripe keys required",
          description: `Please enter your ${stripe.liveMode ? "Live" : "Test"} Publishable Key and Secret Key to enable Stripe.`,
          variant: "destructive",
        });
        return;
      }
      localStorage.setItem("stripe_settings", JSON.stringify(stripe));
      toast({ title: "Stripe settings saved!", description: "Keys stored securely in browser storage." });
    } catch {
      toast({ title: "Failed to save Stripe settings", variant: "destructive" });
    } finally {
      setSavingStripe(false);
    }
  };

  const changePassword = async () => {
    try {
      setChangingPassword(true);
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast({ title: "All password fields are required", variant: "destructive" });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({ title: "Password Mismatch", description: "New password and confirmation do not match", variant: "destructive" });
        return;
      }
      if (passwordData.newPassword.length < 6) {
        toast({ title: "Password Too Short", description: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "No authenticated user found", variant: "destructive" }); return; }
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) { toast({ title: "Password Change Failed", description: error.message, variant: "destructive" }); return; }
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password changed successfully!" });
    } catch {
      toast({ title: "Error changing password", description: "Please try again later", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Settings</h1>
          <p className="font-body text-sm text-muted-foreground">Manage your store configuration and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe size={16} />
            General
          </TabsTrigger>
          <TabsTrigger value="logos" className="flex items-center gap-2">
            <ImageIcon size={16} />
            Logos
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard size={16} />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield size={16} />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                Store Information
              </CardTitle>
              <CardDescription>Basic store details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Store Name</Label>
                  <Input value={settings.store_name} onChange={e => update("store_name", e.target.value)} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Email</Label>
                  <Input value={settings.store_email} onChange={e => update("store_email", e.target.value)} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Phone</Label>
                  <Input value={settings.store_phone} onChange={e => update("store_phone", e.target.value)} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Currency</Label>
                  <select value={settings.currency} onChange={e => update("currency", e.target.value)} className="w-full h-10 rounded-md border border-border bg-card px-3 font-body text-sm text-foreground">
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                Shipping & Tax
              </CardTitle>
              <CardDescription>Configure shipping rates and tax settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Tax Rate (%)</Label>
                  <Input type="number" value={settings.tax_rate} onChange={e => update("tax_rate", Number(e.target.value))} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Free Shipping Min</Label>
                  <Input type="number" value={settings.free_shipping_min} onChange={e => update("free_shipping_min", Number(e.target.value))} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Shipping Fee</Label>
                  <Input type="number" value={settings.shipping_fee} onChange={e => update("shipping_fee", Number(e.target.value))} className="h-10 bg-card border-border font-body" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="font-body text-xs tracking-wider uppercase"
              onClick={saveSettings}
              disabled={saving || !hasChanges}
            >
              {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : <><Save size={14} className="mr-1" /> Save Changes</>}
            </Button>
          </div>
        </TabsContent>

        {/* Logo Management Tab */}
        <TabsContent value="logos" className="space-y-6">
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Uploaded logos are stored locally in your browser. For production deployment, consider using a cloud storage service.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Header Logo
                </CardTitle>
                <CardDescription>
                  Logo displayed in the main navigation header
                  <span className="block text-xs mt-1">
                    <strong>Location:</strong> Frontend Header
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted">
                    <img
                      src={logos.header_logo_url}
                      alt="Current header logo"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {logos.header_logo_url}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="header-logo-upload" className="font-body text-sm">
                      Upload New Logo
                    </Label>
                    <Input
                      id="header-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('header_logo_url', e)}
                      disabled={uploadingLogo === 'header_logo_url'}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG (max 5MB)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogoReset('header_logo_url')}
                      disabled={uploadingLogo === 'header_logo_url'}
                      className="flex items-center gap-2"
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>

                {uploadingLogo === 'header_logo_url' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Admin Panel Logo
                </CardTitle>
                <CardDescription>
                  Logo displayed in the admin panel sidebar
                  <span className="block text-xs mt-1">
                    <strong>Location:</strong> Admin Panel
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted">
                    <img
                      src={logos.admin_logo_url}
                      alt="Current admin logo"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {logos.admin_logo_url}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="admin-logo-upload" className="font-body text-sm">
                      Upload New Logo
                    </Label>
                    <Input
                      id="admin-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('admin_logo_url', e)}
                      disabled={uploadingLogo === 'admin_logo_url'}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG (max 5MB)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogoReset('admin_logo_url')}
                      disabled={uploadingLogo === 'admin_logo_url'}
                      className="flex items-center gap-2"
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>

                {uploadingLogo === 'admin_logo_url' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Payment Methods
              </CardTitle>
              <CardDescription>Configure payment options for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Cash on Delivery</Label>
                  <p className="font-body text-xs text-muted-foreground">Allow customers to pay when they receive their order</p>
                </div>
                <Switch
                  checked={settings.enable_cod}
                  onCheckedChange={(checked) => update("enable_cod", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Stripe Configuration
              </CardTitle>
              <CardDescription>Set up Stripe payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Enable Stripe</Label>
                  <p className="font-body text-xs text-muted-foreground">Accept credit card payments via Stripe</p>
                </div>
                <Switch
                  checked={stripe.enabled}
                  onCheckedChange={(checked) => updateStripe("enabled", checked)}
                />
              </div>

              {stripe.enabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-body text-sm font-medium">Test Mode</Label>
                      <p className="font-body text-xs text-muted-foreground">Use test keys for development</p>
                    </div>
                    <Switch
                      checked={!stripe.liveMode}
                      onCheckedChange={(checked) => updateStripe("liveMode", !checked)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="font-body text-xs uppercase text-muted-foreground">
                        {stripe.liveMode ? "Live" : "Test"} Publishable Key
                      </Label>
                      <Input
                        type="password"
                        value={stripe.liveMode ? stripe.publishableKeyLive : stripe.publishableKeyTest}
                        onChange={e => updateStripe(stripe.liveMode ? "publishableKeyLive" : "publishableKeyTest", e.target.value)}
                        placeholder={stripe.liveMode ? "pk_live_..." : "pk_test_..."}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label className="font-body text-xs uppercase text-muted-foreground">
                        {stripe.liveMode ? "Live" : "Test"} Secret Key
                      </Label>
                      <Input
                        type="password"
                        value={stripe.liveMode ? stripe.secretKeyLive : stripe.secretKeyTest}
                        onChange={e => updateStripe(stripe.liveMode ? "secretKeyLive" : "secretKeyTest", e.target.value)}
                        placeholder={stripe.liveMode ? "sk_live_..." : "sk_test_..."}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveStripeSettings}
                      disabled={savingStripe}
                      className="font-body text-xs"
                    >
                      {savingStripe ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : <><Save size={14} className="mr-1" /> Save Stripe Settings</>}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail size={18} className="text-primary" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Order Notifications</Label>
                  <p className="font-body text-xs text-muted-foreground">Send email notifications for new orders</p>
                </div>
                <Switch
                  checked={settings.order_notifications}
                  onCheckedChange={(checked) => update("order_notifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Low Stock Alerts</Label>
                  <p className="font-body text-xs text-muted-foreground">Alert when products are running low on stock</p>
                </div>
                <Switch
                  checked={settings.low_stock_alerts}
                  onCheckedChange={(checked) => update("low_stock_alerts", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone size={18} className="text-primary" />
                Customer Features
              </CardTitle>
              <CardDescription>Enable customer-facing features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Wishlist</Label>
                  <p className="font-body text-xs text-muted-foreground">Allow customers to save items to wishlist</p>
                </div>
                <Switch
                  checked={settings.enable_wishlist}
                  onCheckedChange={(checked) => update("enable_wishlist", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="font-body text-xs tracking-wider uppercase"
              onClick={saveSettings}
              disabled={saving || !hasChanges}
            >
              {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : <><Save size={14} className="mr-1" /> Save Changes</>}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Store Security
              </CardTitle>
              <CardDescription>Manage security settings for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-body text-sm font-medium">Maintenance Mode</Label>
                  <p className="font-body text-xs text-muted-foreground">Temporarily disable customer access to the store</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => update("maintenance_mode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key size={18} className="text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your admin account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(passwordData).map(([key, value]) => (
                  <div key={key}>
                    <Label className="font-body text-xs uppercase text-muted-foreground">
                      {key === "currentPassword" ? "Current Password" : key === "newPassword" ? "New Password" : "Confirm New Password"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords[key as keyof typeof showPasswords] ? "text" : "password"}
                        value={value}
                        onChange={e => setPasswordData(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={key === "currentPassword" ? "Enter current password" : key === "newPassword" ? "Enter new password" : "Confirm new password"}
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key as keyof typeof showPasswords] }))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showPasswords[key as keyof typeof showPasswords] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                <Button
                  onClick={changePassword}
                  disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="font-body text-xs"
                >
                  {changingPassword
                    ? <><Loader2 size={14} className="mr-1 animate-spin" /> Changing...</>
                    : <><Key size={14} className="mr-1" /> Change Password</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="font-body text-xs tracking-wider uppercase"
              onClick={saveSettings}
              disabled={saving || !hasChanges}
            >
              {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : <><Save size={14} className="mr-1" /> Save Changes</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

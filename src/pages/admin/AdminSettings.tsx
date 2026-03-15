import { useState, useEffect } from "react";
import { Save, Globe, Truck, Shield, Bell, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { settingsService, StoreSettings } from "@/lib/settingsService";
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
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "Fashion Spectrum",
    store_email: "contact@fashionspectrum.com",
    store_phone: "+61 2 9876 5432",
    currency: "AUD",
    tax_rate: 10,
    free_shipping_min: 100,
    shipping_fee: 15,
    enable_reviews: true,
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

  /* ── Stripe ── */
  const [stripe, setStripe] = useState<StripeConfig>(defaultStripe);
  const [showStripeKeys, setShowStripeKeys] = useState({ secretTest: false, webhookTest: false, secretLive: false, webhookLive: false });
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

  /* ── Stripe key input component ── */
  const StripeKeyField = ({
    label, hint, value, onChange, show, onToggleShow, placeholder,
  }: {
    label: string; hint?: string; value: string; onChange: (v: string) => void;
    show?: boolean; onToggleShow?: () => void; placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="font-body text-xs uppercase text-muted-foreground">{label}</Label>
      {hint && <p className="font-body text-[11px] text-muted-foreground/70 leading-snug">{hint}</p>}
      <div className="relative">
        <Input
          type={show === undefined ? "text" : show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? `Enter ${label}`}
          className="h-10 bg-card border-border font-mono text-xs pr-10"
          autoComplete="off"
        />
        {onToggleShow && (
          <Button type="button" variant="ghost" size="sm"
            className="absolute right-0 top-0 h-10 w-10 p-0"
            onClick={onToggleShow}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/stripe/webhook`
    : "https://yourdomain.com/api/stripe/webhook";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Settings</h1>
          <p className="font-body text-sm text-muted-foreground">Store configuration</p>
        </div>
        <Button
          className="font-body text-xs tracking-wider uppercase"
          onClick={saveSettings}
          disabled={saving || !hasChanges}
        >
          {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : <><Save size={14} className="mr-1" /> Save Changes</>}
        </Button>
      </div>

      {/* ── General ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">General</h3>
        </div>
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
      </div>

      {/* ── Shipping & Tax ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Truck size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Shipping &amp; Tax</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Tax Rate (%)</Label>
            <Input type="number" value={settings.tax_rate} onChange={e => update("tax_rate", parseFloat(e.target.value) || 0)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Free Shipping Min</Label>
            <Input type="number" value={settings.free_shipping_min} onChange={e => update("free_shipping_min", parseFloat(e.target.value) || 0)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Shipping Fee</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-body text-muted-foreground">
                {settings.currency === "AUD" ? "A$" : settings.currency}
              </span>
              <Input type="number" value={settings.shipping_fee} onChange={e => update("shipping_fee", parseFloat(e.target.value) || 0)} className="h-10 bg-card border-border font-body pl-9" />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          STRIPE PAYMENT SETTINGS
          ════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">

        {/* Section header + enable toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Stripe brand mark */}
            <div className="w-9 h-9 rounded-lg bg-[#635BFF] flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M13.52 3.43c-2.87-.5-5.62.59-6.58 2.64-.93 1.97-.11 4.22 1.96 5.4l2.18 1.22c.9.5 1.29 1.31.97 2.04-.35.78-1.39 1.18-2.58.97-1.26-.23-2.3-1.07-2.9-2.3L4 14.7c.96 2.1 2.96 3.56 5.31 3.97 2.97.54 5.78-.6 6.75-2.72.91-1.96.06-4.23-2.1-5.43l-2.18-1.21c-.87-.49-1.23-1.28-.91-2.01.34-.77 1.34-1.17 2.5-.96 1.14.21 2.12.99 2.66 2.13l2.57-1.27c-.94-1.93-2.82-3.27-5.08-3.77z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Stripe Payments</h3>
              <p className="font-body text-xs text-muted-foreground">Accept credit &amp; debit cards securely via Stripe</p>
            </div>
          </div>
          <Switch checked={stripe.enabled} onCheckedChange={v => updateStripe("enabled", v)} />
        </div>

        <Separator />

        {/* Status pill */}
        {stripe.enabled ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="font-body text-xs text-green-700">
              Stripe is <strong>enabled</strong> — running in <strong>{stripe.liveMode ? "Live (real payments)" : "Test (sandbox)"}</strong> mode
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="font-body text-xs text-amber-700">
              Stripe is <strong>disabled</strong> — customers will only see Cash on Delivery
            </span>
          </div>
        )}

        {/* Live / Test mode */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-body text-sm font-medium text-foreground">Payment Mode</p>
            <p className="font-body text-xs text-muted-foreground">
              Use Test mode during development. Switch to Live once ready for real transactions.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`font-body text-xs font-semibold ${!stripe.liveMode ? "text-amber-600" : "text-muted-foreground"}`}>Test</span>
            <Switch checked={stripe.liveMode} onCheckedChange={v => updateStripe("liveMode", v)} />
            <span className={`font-body text-xs font-semibold ${stripe.liveMode ? "text-green-600" : "text-muted-foreground"}`}>Live</span>
          </div>
        </div>

        <Separator />

        {/* ── TEST KEYS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="font-body text-xs font-bold uppercase tracking-wider text-foreground">Test Keys</span>
            <span className="font-body text-[10px] text-muted-foreground">(sandbox — no real charges)</span>
          </div>
          <div className="space-y-4">
            <StripeKeyField
              label="Test Publishable Key"
              hint="Starts with pk_test_ — safe to expose in frontend code"
              value={stripe.publishableKeyTest}
              onChange={v => updateStripe("publishableKeyTest", v)}
              placeholder="pk_test_..."
            />
            <StripeKeyField
              label="Test Secret Key"
              hint="Starts with sk_test_ — keep this secret, never expose it in frontend code"
              value={stripe.secretKeyTest}
              onChange={v => updateStripe("secretKeyTest", v)}
              show={showStripeKeys.secretTest}
              onToggleShow={() => setShowStripeKeys(p => ({ ...p, secretTest: !p.secretTest }))}
              placeholder="sk_test_..."
            />
            <StripeKeyField
              label="Test Webhook Secret"
              hint="Starts with whsec_ — get this from Stripe Dashboard → Developers → Webhooks"
              value={stripe.webhookSecretTest}
              onChange={v => updateStripe("webhookSecretTest", v)}
              show={showStripeKeys.webhookTest}
              onToggleShow={() => setShowStripeKeys(p => ({ ...p, webhookTest: !p.webhookTest }))}
              placeholder="whsec_..."
            />
          </div>
        </div>

        <Separator />

        {/* ── LIVE KEYS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="font-body text-xs font-bold uppercase tracking-wider text-foreground">Live Keys</span>
            <span className="font-body text-[10px] text-muted-foreground">(real payments — use with caution)</span>
          </div>
          <div className="space-y-4">
            <StripeKeyField
              label="Live Publishable Key"
              hint="Starts with pk_live_ — safe to expose in frontend code"
              value={stripe.publishableKeyLive}
              onChange={v => updateStripe("publishableKeyLive", v)}
              placeholder="pk_live_..."
            />
            <StripeKeyField
              label="Live Secret Key"
              hint="Starts with sk_live_ — keep this secret, never expose it in frontend code"
              value={stripe.secretKeyLive}
              onChange={v => updateStripe("secretKeyLive", v)}
              show={showStripeKeys.secretLive}
              onToggleShow={() => setShowStripeKeys(p => ({ ...p, secretLive: !p.secretLive }))}
              placeholder="sk_live_..."
            />
            <StripeKeyField
              label="Live Webhook Secret"
              hint="Starts with whsec_ — get this from Stripe Dashboard → Developers → Webhooks"
              value={stripe.webhookSecretLive}
              onChange={v => updateStripe("webhookSecretLive", v)}
              show={showStripeKeys.webhookLive}
              onToggleShow={() => setShowStripeKeys(p => ({ ...p, webhookLive: !p.webhookLive }))}
              placeholder="whsec_..."
            />
          </div>
        </div>

        <Separator />

        {/* ── Webhook endpoint ── */}
        <div className="space-y-2">
          <Label className="font-body text-xs uppercase text-muted-foreground">Webhook Endpoint URL</Label>
          <p className="font-body text-[11px] text-muted-foreground/70 leading-relaxed">
            Add this URL in <strong>Stripe Dashboard → Developers → Webhooks → Add endpoint</strong>.
            Subscribe to: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">payment_intent.succeeded</code>,{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">charge.refunded</code>,{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">checkout.session.completed</code>
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 flex items-center bg-muted/60 border border-border rounded-md px-3 overflow-hidden">
              <span className="font-mono text-xs text-muted-foreground truncate select-all">{webhookUrl}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-body text-xs h-10 px-3 flex-shrink-0"
              onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "Webhook URL copied!" }); }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* ── How to get keys guide ── */}
        <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-lg p-4 space-y-2">
          <p className="font-body text-xs font-bold text-[#635BFF]">How to get your Stripe API keys</p>
          <ol className="font-body text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>
              Go to{" "}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                className="text-[#635BFF] underline underline-offset-2">
                dashboard.stripe.com/apikeys
              </a>
            </li>
            <li>Copy the <strong>Publishable key</strong> (starts with <code className="bg-muted px-1 rounded">pk_</code>)</li>
            <li>Click <em>Reveal live key</em> and copy the <strong>Secret key</strong> (starts with <code className="bg-muted px-1 rounded">sk_</code>)</li>
            <li>Go to <strong>Developers → Webhooks → Add endpoint</strong>, paste the URL above</li>
            <li>After creating the webhook, copy the <strong>Signing secret</strong> (starts with <code className="bg-muted px-1 rounded">whsec_</code>)</li>
          </ol>
          <p className="font-body text-[10px] text-muted-foreground/70 pt-1">
            Note: Keys are stored locally in your browser. For production, move them to secure server environment variables.
          </p>
        </div>

        {/* Save Stripe button */}
        <div className="flex justify-end pt-1">
          <Button
            onClick={saveStripeSettings}
            disabled={savingStripe}
            className="font-body text-xs tracking-wider uppercase bg-[#635BFF] hover:bg-[#5248e0] text-white"
          >
            {savingStripe
              ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</>
              : <><Save size={14} className="mr-1" /> Save Stripe Settings</>}
          </Button>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Features</h3>
        </div>
        {[
          { key: "enable_reviews", label: "Customer Reviews", desc: "Allow customers to leave product reviews" },
          { key: "enable_wishlist", label: "Wishlist", desc: "Enable wishlist functionality" },
          { key: "enable_cod", label: "Cash on Delivery", desc: "Accept COD payments" },
          { key: "maintenance_mode", label: "Maintenance Mode", desc: "Put store in maintenance mode" },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch
              checked={settings[f.key as keyof StoreSettings] as boolean}
              onCheckedChange={v => update(f.key as keyof StoreSettings, v)}
            />
          </div>
        ))}
      </div>

      {/* ── Notifications ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        {[
          { key: "email_notifications", label: "Email Notifications", desc: "Receive email for important updates" },
          { key: "order_notifications", label: "Order Notifications", desc: "Get notified for new orders" },
          { key: "low_stock_alerts", label: "Low Stock Alerts", desc: "Alert when products are running low" },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch
              checked={settings[f.key as keyof StoreSettings] as boolean}
              onCheckedChange={v => update(f.key as keyof StoreSettings, v)}
            />
          </div>
        ))}
      </div>

      {/* ── Change Password ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Change Password</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { field: "currentPassword", label: "Current Password", key: "current" as const },
            { field: "newPassword", label: "New Password", key: "new" as const },
            { field: "confirmPassword", label: "Confirm Password", key: "confirm" as const },
          ] as const).map(({ field, label, key }) => (
            <div key={field} className="space-y-1.5">
              <Label className="font-body text-xs uppercase text-muted-foreground">{label}</Label>
              <div className="relative">
                <Input
                  type={showPasswords[key] ? "text" : "password"}
                  value={passwordData[field]}
                  onChange={e => setPasswordData(prev => ({ ...prev, [field]: e.target.value }))}
                  className="h-10 bg-card border-border font-body pr-10"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 p-0"
                  onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  {showPasswords[key] ? <EyeOff size={14} /> : <Eye size={14} />}
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
      </div>
    </div>
  );
};

export default AdminSettings;

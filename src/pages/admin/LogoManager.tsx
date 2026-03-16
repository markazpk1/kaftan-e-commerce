import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, RotateCcw, Image as ImageIcon } from "lucide-react";
import { useLogoSettings } from "@/hooks/useLogoSettings";
import { useToast } from "@/hooks/use-toast";

const LogoManager = () => {
  const { logos, loading, updateLogo, resetLogo } = useLogoSettings();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (type: keyof typeof logos, event: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploading(type);
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
      setUploading(null);
    }
  };

  const handleReset = async (type: keyof typeof logos) => {
    try {
      setUploading(type);
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
      setUploading(null);
    }
  };

  const logoSections = [
    {
      key: 'header_logo_url' as keyof typeof logos,
      title: 'Header Logo',
      description: 'Logo displayed in the main navigation header',
      location: 'Frontend Header'
    },
    {
      key: 'footer_logo_url' as keyof typeof logos,
      title: 'Footer Logo',
      description: 'Logo displayed in the website footer',
      location: 'Frontend Footer'
    },
    {
      key: 'admin_logo_url' as keyof typeof logos,
      title: 'Admin Panel Logo',
      description: 'Logo displayed in the admin panel sidebar',
      location: 'Admin Panel'
    },
    {
      key: 'favicon_url' as keyof typeof logos,
      title: 'Favicon',
      description: 'Browser tab icon and bookmark icon',
      location: 'Browser Tab'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">Logo Management</h1>
        <p className="font-body text-muted-foreground">
          Update logos across all parts of your application. Changes will be reflected immediately in the frontend, admin panel, and user panel.
        </p>
      </div>

      <Alert className="mb-6">
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Uploaded logos are stored locally in your browser. For production deployment, consider using a cloud storage service.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {logoSections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>
                {section.description}
                <span className="block text-xs mt-1">
                  <strong>Location:</strong> {section.location}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Logo Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted">
                  <img
                    src={logos[section.key]}
                    alt="Current logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Logo</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {logos[section.key]}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Upload Controls */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`upload-${section.key}`} className="font-body text-sm">
                    Upload New Logo
                  </Label>
                  <Input
                    id={`upload-${section.key}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(section.key, e)}
                    disabled={uploading === section.key}
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
                    onClick={() => handleReset(section.key)}
                    disabled={uploading === section.key}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
              </div>

              {uploading === section.key && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Uploading...
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-heading text-sm font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Upload a new logo to replace the current one</li>
          <li>• Changes are applied immediately across all sections</li>
          <li>• Reset to default to restore the original logo</li>
          <li>• Logos are stored locally in the browser</li>
        </ul>
      </div>
    </div>
  );
};

export default LogoManager;

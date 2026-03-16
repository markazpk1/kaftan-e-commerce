import { supabase } from '@/integrations/supabase/client';

export interface LogoSettings {
  header_logo_url?: string;
  footer_logo_url?: string;
  admin_logo_url?: string;
  favicon_url?: string;
}

// Default logo paths
export const DEFAULT_LOGOS: LogoSettings = {
  header_logo_url: '/logo.png',
  footer_logo_url: '/logo.png',
  admin_logo_url: '/logo.png',
  favicon_url: '/favicon.png',
};

class LogoService {
  private readonly STORAGE_KEY = 'logo_settings';

  // Get logo settings from localStorage or return defaults
  getLogoSettings(): LogoSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_LOGOS, ...parsed };
      }
      return DEFAULT_LOGOS;
    } catch (error) {
      console.error('Error fetching logo settings:', error);
      return DEFAULT_LOGOS;
    }
  }

  // Update logo settings
  updateLogoSettings(settings: Partial<LogoSettings>): LogoSettings {
    try {
      const current = this.getLogoSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error updating logo settings:', error);
      throw error;
    }
  }

  // Upload logo file and return URL (for now, return a placeholder URL)
  async uploadLogo(file: File, type: 'header' | 'footer' | 'admin' | 'favicon'): Promise<string> {
    try {
      // For now, create a blob URL
      // In a real implementation, you would upload to a storage service
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  // Reset logo to default
  resetLogo(type: keyof LogoSettings): LogoSettings {
    return this.updateLogoSettings({
      [type]: DEFAULT_LOGOS[type]
    });
  }
}

export const logoService = new LogoService();

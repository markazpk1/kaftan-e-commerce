import { useState, useEffect } from "react";
import { logoService, LogoSettings, DEFAULT_LOGOS } from "@/lib/logoService";

export const useLogoSettings = () => {
  const [logos, setLogos] = useState<LogoSettings>(DEFAULT_LOGOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogoSettings();
  }, []);

  const fetchLogoSettings = () => {
    try {
      setLoading(true);
      setError(null);
      const settings = logoService.getLogoSettings();
      setLogos(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logo settings');
    } finally {
      setLoading(false);
    }
  };

  const updateLogo = async (type: keyof LogoSettings, file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Upload new logo
      const logoUrl = await logoService.uploadLogo(file, type as any);

      // Update settings
      const updatedSettings = logoService.updateLogoSettings({
        [type]: logoUrl
      });

      setLogos(updatedSettings);
      return logoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update logo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetLogo = async (type: keyof LogoSettings) => {
    try {
      setLoading(true);
      setError(null);

      // Reset to default
      const updatedSettings = logoService.resetLogo(type);
      setLogos(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset logo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    logos,
    loading,
    error,
    updateLogo,
    resetLogo,
    refetch: fetchLogoSettings
  };
};

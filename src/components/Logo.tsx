import { useLogoSettings } from "@/hooks/useLogoSettings";
import { DEFAULT_LOGOS } from "@/lib/logoService";

interface LogoProps {
  type?: 'header' | 'footer' | 'admin' | 'favicon';
  className?: string;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo = ({ 
  type = 'header', 
  className = "", 
  alt = "Fashion Spectrum",
  fallbackText = "FS",
  size = 'md'
}: LogoProps) => {
  const { logos } = useLogoSettings();

  // Get the appropriate logo URL based on type
  const getLogoUrl = () => {
    switch (type) {
      case 'header':
        return logos.header_logo_url;
      case 'footer':
        return logos.footer_logo_url;
      case 'admin':
        return logos.admin_logo_url;
      case 'favicon':
        return logos.favicon_url;
      default:
        return logos.header_logo_url;
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'md':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      case 'xl':
        return 'h-16 w-16';
      default:
        return 'h-8 w-8';
    }
  };

  const logoUrl = getLogoUrl();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center ${className}`}>
      {logoUrl && logoUrl !== DEFAULT_LOGOS[type === 'favicon' ? 'favicon_url' : `${type}_logo_url` as keyof typeof DEFAULT_LOGOS] ? (
        <img
          src={logoUrl}
          alt={alt}
          className={`${sizeClasses} object-contain`}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.fallback-text')) {
              const fallback = document.createElement('div');
              fallback.className = `fallback-text ${sizeClasses} bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-heading font-bold text-sm`;
              fallback.textContent = fallbackText;
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className={`${sizeClasses} bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-heading font-bold text-sm`}>
          {fallbackText}
        </div>
      )}
    </div>
  );
};

export default Logo;

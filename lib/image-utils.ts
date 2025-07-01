// Image utility functions for handling PNG, HEIC, JPG formats

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

// Get optimal image dimensions based on usage
export function getOptimalImageSize(usage: 'thumbnail' | 'gallery' | 'featured' | 'full') {
  switch (usage) {
    case 'thumbnail':
      return { width: 300, height: 300 };
    case 'gallery':
      return { width: 800, height: 600 };
    case 'featured':
      return { width: 1200, height: 800 };
    case 'full':
      return { width: 1920, height: 1080 };
    default:
      return { width: 800, height: 600 };
  }
}

// Generate Next.js Image component props for optimization
export function getImageProps(
  src: string,
  alt: string,
  usage: 'thumbnail' | 'gallery' | 'featured' | 'full' = 'gallery',
  options: ImageOptimizationOptions = {}
) {
  const { width, height } = getOptimalImageSize(usage);
  
  return {
    src,
    alt,
    width: options.width || width,
    height: options.height || height,
    sizes: getResponsiveSizes(usage),
    quality: options.quality || 85,
    priority: usage === 'featured',
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  };
}

// Generate Next.js Image component props for fill usage (no width/height)
export function getImagePropsForFill(
  src: string,
  alt: string,
  usage: 'thumbnail' | 'gallery' | 'featured' | 'full' = 'gallery',
  options: ImageOptimizationOptions = {}
) {
  return {
    src,
    alt,
    sizes: getResponsiveSizes(usage),
    quality: options.quality || 85,
    priority: usage === 'featured',
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  };
}

// Check if image format is supported
export function isSupportedImageFormat(filename: string): boolean {
  const supportedFormats = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.webp', '.avif'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return supportedFormats.includes(extension);
}

// Get file size in MB
export function getFileSizeInMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

// Validate image file size (max 8MB)
export function isValidImageSize(bytes: number): boolean {
  const maxSize = 8 * 1024 * 1024; // 8MB in bytes
  return bytes <= maxSize;
}

// Generate responsive image sizes for different screen sizes
export function getResponsiveSizes(usage: 'thumbnail' | 'gallery' | 'featured' | 'full'): string {
  switch (usage) {
    case 'thumbnail':
      return '(max-width: 768px) 100vw, 300px';
    case 'gallery':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    case 'featured':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px';
    case 'full':
      return '100vw';
    default:
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }
} 
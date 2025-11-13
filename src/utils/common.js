/**
 * Get the full image URL by combining the backend URL with the relative image path
 * @param {string} imagePath - Relative image path (e.g., "/images/logo/logo_1763033583467_kzakpx.png")
 * @returns {string} Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }

  // If the image path is already a full URL (starts with http:// or https://),
  // extract just the path portion for Next.js Image component
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const url = new URL(imagePath);
      let pathname = url.pathname;

      // Remove /public/ prefix if present since Next.js serves from public folder directly
      if (pathname.startsWith('/public/')) {
        pathname = pathname.replace('/public', '');
      }

      return pathname;
    } catch (error) {
      console.error('Error parsing image URL:', error);
      return imagePath;
    }
  }

  // Remove /public/ prefix if present
  let normalizedPath = imagePath.startsWith('/public/')
    ? imagePath.replace('/public', '')
    : imagePath;

  // Ensure path starts with a slash
  normalizedPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  return normalizedPath;
};

/**
 * Get the full image URL by combining the backend URL with the relative image path
 * @param {string} imagePath - Relative image path (e.g., "/images/logo/logo_1763033583467_kzakpx.png")
 * @returns {string} Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }

  // If the image path is already a full URL (starts with http:// or https://), return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get the backend URL from environment variables
  const backendUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000/public';

  // Remove trailing slash from backend URL if present
  const baseUrl = backendUrl.replace(/\/$/, '');

  // Ensure image path starts with a slash
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Combine base URL with image path
  return `${baseUrl}${normalizedPath}`;
};

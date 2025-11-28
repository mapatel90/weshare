/**
 * Get the full image URL by combining the backend URL with the relative image path
 * @param {string} imagePath - Relative image path (e.g., "/images/logo/logo_1763033583467_kzakpx.png")
 * @returns {string} Full image URL
 */
const stripPublicPrefix = (value = "") =>
  value.startsWith("/public/") ? value.replace("/public", "") : value;

const ensureLeadingSlash = (value = "") =>
  value.startsWith("/") ? value : `/${value}`;

const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_FILES_BASE_URL ||
  "";

/**
 * Normalise image paths to an absolute URL (when a base is provided)
 * or a project-relative path so that both browser <img> and Next/Image
 * can resolve them reliably across environments.
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return "";
  }

  const trimmed = imagePath.trim();
  const isAbsolute = /^https?:\/\//i.test(trimmed);

  if (isAbsolute) {
    // Already a fully-qualified URL – return as-is so that external/CDN images work.
    return trimmed;
  }

  const normalizedPath = ensureLeadingSlash(stripPublicPrefix(trimmed));

  if (!ASSET_BASE_URL) {
    return normalizedPath;
  }

  const base = ASSET_BASE_URL.replace(/\/+$/, "");
  return `${base}${normalizedPath}`;
};

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

/**
 * Get current date and time in the specified timezone
 * @param {string} timeZone - IANA timezone name (e.g., 'Asia/Kolkata', 'America/New_York', 'Asia/Ho_Chi_Minh')
 * @returns {Date} Date object representing current time converted to the specified timezone
 */
export function getDateTimeInTZ(timeZone) {
  const now = new Date();

  // Format the current time in the target timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;

  // Get date/time components as they appear in the target timezone
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  // Build ISO string representing the wall-clock time in target timezone
  // Important: Adding 'Z' tells Date constructor to treat this as UTC
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;

  // Return Date object - will be stored as UTC in database
  // When retrieved and formatted with the same timezone, it will show the correct time
  return new Date(isoString);
}

export function sumFieldFromObject(data, field) {
  return data
    .reduce((sum, item) => {
      if (item?.project_data?.length > 0) {
        const value = Number(item.project_data[0]?.[field] ?? 0);
        return sum + value;
      }
      return sum;
    }, 0);
}


export function formatShort(value, decimals = 4) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: decimals,
  }).format(value);
}
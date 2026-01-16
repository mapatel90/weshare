'use client';

import { useState, useEffect } from 'react';

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

// Sum a nested numeric field from project_data with optional slicing
export const sumNestedField = (data = [], field, limit) =>
  data
    .slice(0, limit ?? data.length)
    .reduce((sum, item) => {
      const raw = item?.project_data?.[0]?.[field] || item?.[field];
      const value = Number(raw);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

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
        const value = Number(item.project_data[0]?.[field] || item?.[field] || 0);
        return sum + value;
      }
      return sum;
    }, 0);
}


export function formatShort(value, decimals = 3) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: decimals,
  }).format(value);
}


export function convertEnergyToKwh(value, unit = 'kWh') {
  if (value == null) return 0;

  const numeric = Number(value);
  if (isNaN(numeric)) return 0;

  const normalizedUnit = String(unit).toLowerCase().trim();

  if (normalizedUnit === 'mwh') return numeric * 1000; // 1 MWh = 1000 kWh
  if (normalizedUnit === 'kwh') return numeric;

  // Unknown unit → assume kWh
  return numeric;
}

export const formatEnergyUnit = (value, decimals = 3) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return "0 W";

  // Below 1 → Watts
  if (numeric < 1) {
    return `${(numeric * 1000).toFixed(0)} W`;
  }

  // 1 to 1000 → kWh
  if (numeric >= 1 && numeric < 1000) {
    return `${numeric.toFixed(decimals)} kWh`;
  }

  // 1000 to 1,000,000 → MWh
  if (numeric >= 1000 && numeric < 1_000_000) {
    return `${(numeric / 1000).toFixed(decimals)} MWh`;
  }

  // Above 1,000,000 → GWh
  return `${(numeric / 1_000_000).toFixed(decimals)} GWh`;
};

// -------- DARK MODE UTILITIES ----------
/**
 * Get dark mode color scheme based on isDark boolean
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {object} Color scheme object with all theme colors
 */
export const getDarkModeColors = (isDark) => {
  return {
    bg: isDark ? "#0f172a" : "#f9fafb",
    cardBg: isDark ? "#121a2d" : "#fff",
    text: isDark ? "#ffffff" : "#111827",
    textMuted: isDark ? "#b1b4c0" : "#6b7280",
    border: isDark ? "#1b2436" : "#e5e7eb",
    borderLight: isDark ? "#1b2436" : "#f3f4f6",
    gradientBg: isDark
      ? "linear-gradient(to bottom right, #1a1f2e, #0f172a, #1a1628)"
      : "linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff)",
  };
};

/**
 * React hook to detect dark mode globally
 * Monitors document root for 'app-skin-dark' class
 * @returns {boolean} True if dark mode is enabled
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("app-skin-dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};


export const sortByNameAsc = (list = [], key = "name") => {
  return [...list].sort((a, b) => {
    const nameA = String(a?.[key] ?? "").toLowerCase();
    const nameB = String(b?.[key] ?? "").toLowerCase();

    return nameA.localeCompare(nameB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
};
/**
 * Gets the value for a specific key from settings array
 * @param {Array} settingsArr - Array of settings objects
 * @param {string} key - The key to search for
 * @returns {string|null} - The value if found, else null
 */

import { apiGet } from "@/lib/api";

export const SETTING_FIELDS = [
  'id',
  'key',
  'value',
  'createdAt',
  'updatedAt',
];


/**
 * Returns all Setting table fields as an array
 */
export function getSettingFields() {
  return [...SETTING_FIELDS];
}


/**
 * Checks if a field is a valid Setting table field
 * @param {string} field
 * @returns {boolean}
 */
export function isSettingField(field) {
  return SETTING_FIELDS.includes(field);
}


/**
 * Fetch a setting value by key from the API
 * @param {string} key - The key to fetch
 * @returns {Promise<string|null>} - The value if found, else null
 */
export async function getSettingValue(key) {
    console.log(key);
  if (!key) return null;
  try {
    const response = await apiGet(`/api/settings/${encodeURIComponent(key)}`);
    if (response?.success && response.data && typeof response.data.value !== 'undefined') {
      return response.data.value;
    }
    return null;
  } catch (error) {
    console.error("Error fetching setting value:", error);
    return null;
  }
}
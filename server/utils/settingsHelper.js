// Helper for Setting table fields
// Provides easy access to all Setting table fields and utility functions

const SETTING_FIELDS = [
  'id',
  'key',
  'value',
  'createdAt',
  'updatedAt',
];

/**
 * Returns all Setting table fields as an array
 */
function getSettingFields() {
  return [...SETTING_FIELDS];
}

/**
 * Checks if a field is a valid Setting table field
 * @param {string} field
 * @returns {boolean}
 */
function isSettingField(field) {
  return SETTING_FIELDS.includes(field);
}

module.exports = {
  SETTING_FIELDS,
  getSettingFields,
  isSettingField,
};

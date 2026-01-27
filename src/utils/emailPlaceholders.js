/**
 * Email Template Placeholders
 * These placeholders can be used in email templates and will be replaced with actual values
 */

// Available placeholders for email templates
export const EMAIL_PLACEHOLDERS = [
  { key: "[user_name]", label: "User Name", description: "Recipient's full name" },
  { key: "[user_email]", label: "User Email", description: "Recipient's email address" },
  { key: "[user_phone]", label: "User Phone", description: "Recipient's phone number" },
  { key: "[project_name]", label: "Project Name", description: "Name of the project" },
  { key: "[project_code]", label: "Project Code", description: "Project code/identifier" },
  { key: "[project_description]", label: "Project Description", description: "Project description" },
  { key: "[company_name]", label: "Company Name", description: "Company name from settings" },
  { key: "[invoice_number]", label: "Invoice Number", description: "Invoice number" },
  { key: "[contract_title]", label: "Contract Title", description: "Title of the contract" },
  { key: "[address_1]", label: "Address 1", description: "Primary address line" },
  { key: "[zipcode]", label: "Zipcode", description: "Postal/ZIP code" },
  { key: "[current_date]", label: "Current Date", description: "Current date" },
  { key: "[site_url]", label: "Site URL", description: "Website URL" },
];

// Test/Preview values for local testing
export const PLACEHOLDER_TEST_VALUES = {
  "[user_name]": "Test Name",
  "[user_email]": "test@example.com",
  "[user_phone]": "+1234567890",
  "[project_name]": "Solar Project ABC",
  "[project_code]": "PRJ-2026-001",
  "[project_description]": "Commercial rooftop solar installation with 500kW capacity",
  "[company_name]": "WeShare Energy",
  "[invoice_number]": "INV-2026-001",
  "[contract_title]": "Energy Agreement 2026",
  "[address_1]": "123 Main Street, Building A",
  "[zipcode]": "10001",
  "[current_date]": new Date().toLocaleDateString(),
  "[site_url]": "https://weshare.com",
};

/**
 * Replace placeholders with actual values
 * @param {string} template - Template string with placeholders
 * @param {object} values - Object with actual values (optional, uses test values by default)
 * @returns {string} - Template with replaced values
 */
export const replacePlaceholders = (template, values = PLACEHOLDER_TEST_VALUES) => {
  if (!template) return "";
  
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value || "");
  });
  
  return result;
};

/**
 * Get test preview of email content
 * @param {object} emailData - Email data with subject, content_en, content_vi
 * @returns {object} - Email data with placeholders replaced
 */
export const getPreviewEmail = (emailData) => {
  return {
    subject: replacePlaceholders(emailData.subject),
    content_en: replacePlaceholders(emailData.content_en),
    content_vi: replacePlaceholders(emailData.content_vi),
  };
};

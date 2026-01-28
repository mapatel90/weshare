/**
 * Email Template Placeholders
 * These placeholders can be used in email templates and will be replaced with actual values
 */

// Available placeholders for email templates
export const EMAIL_PLACEHOLDERS = [
  { key: "[user_name]", label: "User Name", description: "Recipient's full name" },
  { key: "[user_email]", label: "User Email", description: "Recipient's email address" },
  { key: "[user_phone]", label: "User Phone", description: "Recipient's phone number" },
  { key: "[account_type]", label: "Account Type", description: "Type of account (Offtaker / Investor)" },
  { key: "[project_name]", label: "Project Name", description: "Name of the project" },
  { key: "[project_code]", label: "Project Code", description: "Project code/identifier" },
  { key: "[project_description]", label: "Project Description", description: "Project description" },
  { key: "[company_name]", label: "Company Name", description: "Company name from settings" },
  { key: "[company_logo]", label: "Company Logo URL", description: "Absolute URL to company logo" },
  { key: "[support_email]", label: "Support Email", description: "Support contact email" },
  { key: "[support_phone]", label: "Support Phone", description: "Support contact phone" },
  { key: "[support_hours]", label: "Support Hours", description: "Support availability window" },
  { key: "[invoice_number]", label: "Invoice Number", description: "Invoice number" },
  { key: "[contract_title]", label: "Contract Title", description: "Title of the contract" },
  { key: "[address_1]", label: "Address 1", description: "Primary address line" },
  { key: "[zipcode]", label: "Zipcode", description: "Postal/ZIP code" },
  { key: "[current_date]", label: "Current Date", description: "Current date" },
  { key: "[site_url]", label: "Site URL", description: "Website URL" },
  { key: "[verify_link]", label: "Verification Link", description: "Account verification URL" },
  { key: "[login_url]", label: "Login URL", description: "Portal login URL" },
];

// Test/Preview values for local testing
export const PLACEHOLDER_TEST_VALUES = {
  "[user_name]": "Test Name",
  "[user_email]": "test@example.com",
  "[user_phone]": "+1234567890",
  "[account_type]": "Offtaker",
  "[project_name]": "Solar Project ABC",
  "[project_code]": "PRJ-2026-001",
  "[project_description]": "Commercial rooftop solar installation with 500kW capacity",
  "[company_name]": "WeShare Energy",
  "[company_logo]": "https://weshare.com/logo.png",
  "[support_email]": "support@weshare.com",
  "[support_phone]": "+1 (555) 123-4567",
  "[support_hours]": "Mon–Fri, 9am–6pm GMT",
  "[invoice_number]": "INV-2026-001",
  "[contract_title]": "Energy Agreement 2026",
  "[address_1]": "123 Main Street, Building A",
  "[zipcode]": "10001",
  "[current_date]": new Date().toLocaleDateString(),
  "[site_url]": "https://weshare.com",
  "[verify_link]": "https://weshare.com/verify/abc123",
  "[login_url]": "https://weshare.com/login",
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

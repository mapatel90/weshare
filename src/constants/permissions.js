/**
 * Permission Modules - Maps to modules in the database
 * These should match the module names in roles_permissions table
 * NOTE: Only leaf-level (actual page) modules - parent modules removed
 */
export const MODULES = {
  // Single page modules (no dropdown)
  DASHBOARDS: 'dashboards',
  USERS: 'users',
  CONTRACTS: 'contracts',
  LEASE_REQUESTS: 'lease_requests',
  BLOG: 'blog',
  NEWS: 'news',
  TESTIMONIALS: 'testimonials',
  CONTACT_US: 'contact_us',
  NOTIFICATIONS: 'notifications',
  
  // Projects sub-modules
  PROJECTS: 'projects',  // For project list page
  PROJECT_TYPE: 'project_type',
  
  // Inverter sub-modules
  INVERTER_TYPE: 'inverter_type',
  INVERTER_COMPANY: 'inverter_company',
  INVERTER_LIST: 'inverter_list',
  
  // Finance sub-modules
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  PAYOUTS: 'payouts',
  
  // Reports sub-modules
  INVERTER_EVN_REPORT: 'inverter_evn_report',
  PROJECT_EVN_REPORT: 'project_evn_report',
  SAVING_REPORT: 'saving_report',
  
  // Settings sub-modules
  GENERAL_SETTINGS: 'general_settings',
  ROLES_MANAGEMENT: 'roles_management',
  SMTP_SETTINGS: 'smtp_settings',
  EMAIL_TEMPLATES: 'email_templates',
  FINANCE_SETTINGS: 'finance_settings',
  MISCELLANEOUS: 'miscellaneous',
};

/**
 * Permission Capabilities/Actions
 */
export const CAPABILITIES = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  VIEW_ALL_TEMPLATES: 'view_all_templates',
};

/**
 * Capability Labels for display
 */
export const CAPABILITY_LABELS = {
  [CAPABILITIES.VIEW]: 'View',
  [CAPABILITIES.CREATE]: 'Create',
  [CAPABILITIES.EDIT]: 'Edit',
  [CAPABILITIES.DELETE]: 'Delete',
  [CAPABILITIES.VIEW_ALL_TEMPLATES]: 'View All Templates',
};

/**
 * Module Labels for display
 */
export const MODULE_LABELS = {
  [MODULES.DASHBOARDS]: 'Dashboards',
  [MODULES.USERS]: 'Users',
  [MODULES.CONTRACTS]: 'Contracts',
  [MODULES.LEASE_REQUESTS]: 'Lease Requests',
  [MODULES.BLOG]: 'Blog',
  [MODULES.NEWS]: 'News',
  [MODULES.TESTIMONIALS]: 'Testimonials',
  [MODULES.CONTACT_US]: 'Contact Us',
  [MODULES.NOTIFICATIONS]: 'Notifications',
  [MODULES.PROJECTS]: 'Projects',
  [MODULES.PROJECT_TYPE]: 'Project Type',
  [MODULES.INVERTER_TYPE]: 'Inverter Type',
  [MODULES.INVERTER_COMPANY]: 'Inverter Company',
  [MODULES.INVERTER_LIST]: 'Inverter List',
  [MODULES.INVOICES]: 'Invoices',
  [MODULES.PAYMENTS]: 'Payments',
  [MODULES.PAYOUTS]: 'Payouts',
  [MODULES.INVERTER_EVN_REPORT]: 'Inverter EVN Report',
  [MODULES.PROJECT_EVN_REPORT]: 'Project EVN Report',
  [MODULES.SAVING_REPORT]: 'Saving Report',
  [MODULES.GENERAL_SETTINGS]: 'General Settings',
  [MODULES.ROLES_MANAGEMENT]: 'Roles Management',
  [MODULES.SMTP_SETTINGS]: 'SMTP Settings',
  [MODULES.EMAIL_TEMPLATES]: 'Email Templates',
  [MODULES.FINANCE_SETTINGS]: 'Finance Settings',
  [MODULES.MISCELLANEOUS]: 'Miscellaneous',
};


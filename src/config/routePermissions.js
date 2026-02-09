import { MODULES, CAPABILITIES } from '@/constants/permissions';

export const routePermissions = [
  // Dashboard
  {
    path: '/admin/dashboards',
    module: MODULES.DASHBOARDS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Projects
  {
    path: '/admin/projects/list',
    module: MODULES.PROJECT_LIST,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/projects/create',
    module: MODULES.PROJECT_LIST,
    capability: CAPABILITIES.CREATE,
    exact: true,
  },
  {
    path: '/admin/projects/edit',
    module: MODULES.PROJECT_LIST,
    capability: CAPABILITIES.EDIT,
    exact: false,
  },
  {
    path: '/admin/projects/view',
    module: MODULES.PROJECT_LIST,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/projects/list',
    module: MODULES.PROJECT_TYPE,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Users
  {
    path: '/admin/users/list',
    module: MODULES.USERS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/users/create',
    module: MODULES.USERS,
    capability: CAPABILITIES.CREATE,
    exact: true,
  },
  {
    path: '/admin/users/edit',
    module: MODULES.USERS,
    capability: CAPABILITIES.EDIT,
    exact: false,
  },
  {
    path: '/admin/users/view',
    module: MODULES.USERS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Inverter
  {
    path: '/admin/inverter/type',
    module: MODULES.INVERTER_TYPE,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/inverter/company',
    module: MODULES.INVERTER_COMPANY,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/inverter/list',
    module: MODULES.INVERTER_LIST,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Finance
  {
    path: '/admin/finance/invoice',
    module: MODULES.INVOICES,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/finance/payments',
    module: MODULES.PAYMENTS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/finance/payouts',
    module: MODULES.PAYOUTS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Contracts
  {
    path: '/admin/contract',
    module: MODULES.CONTRACTS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Lease Requests
  {
    path: '/admin/lease-request',
    module: MODULES.LEASE_REQUESTS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Blog
  {
    path: '/admin/blog',
    module: MODULES.BLOG,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // News
  {
    path: '/admin/news',
    module: MODULES.NEWS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Testimonials
  {
    path: '/admin/testimonial',
    module: MODULES.TESTIMONIALS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Contact Us
  {
    path: '/admin/contact-us',
    module: MODULES.CONTACT_US,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Notifications
  {
    path: '/admin/notification',
    module: MODULES.NOTIFICATIONS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Reports
  {
    path: '/admin/reports/inverter-evn',
    module: MODULES.INVERTER_EVN_REPORT,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/reports/project-env',
    module: MODULES.PROJECT_EVN_REPORT,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/reports/saving-report',
    module: MODULES.SAVING_REPORT,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },

  // Settings
  {
    path: '/admin/settings/general',
    module: MODULES.GENERAL_SETTINGS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/settings/role',
    module: MODULES.ROLES_MANAGEMENT,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/settings/smtp',
    module: MODULES.SMTP_SETTINGS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/email_template',
    module: MODULES.EMAIL_TEMPLATES,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/settings/finance',
    module: MODULES.FINANCE_SETTINGS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
  {
    path: '/admin/settings/miscellaneous',
    module: MODULES.MISCELLANEOUS,
    capability: CAPABILITIES.VIEW,
    exact: false,
  },
];

/**
 * Find permission config for a given pathname
 * @param {string} pathname - Current URL pathname
 * @returns {object|null} - Permission config or null if not found
 */
export const getRoutePermission = (pathname) => {
  // First try exact match
  const exactMatch = routePermissions.find(
    (route) => route.exact && route.path === pathname
  );
  if (exactMatch) return exactMatch;

  // Then try prefix match (longest match first)
  const prefixMatches = routePermissions
    .filter((route) => !route.exact && pathname.startsWith(route.path))
    .sort((a, b) => b.path.length - a.path.length);

  return prefixMatches[0] || null;
};

export default routePermissions;


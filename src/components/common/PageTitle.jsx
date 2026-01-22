"use client";

import { usePageTitle } from '@/contexts/PageTitleContext';

/**
 * PageTitle Component (Legacy)
 *
 * This component is maintained for backward compatibility.
 * For new code, prefer using the usePageTitle hook directly.
 *
 * @deprecated Use usePageTitle hook instead
 *
 * @param {string} titleKey - Translation key for the page title (e.g., "page_title.login")
 * @param {string} suffix - Optional suffix to append (defaults to "WeShare")
 * @param {boolean} useSuffix - Whether to append the suffix (defaults to true)
 *
 * @example
 * // Old way (still works)
 * <PageTitle titleKey="page_title.login" />
 *
 * @example
 * // New way (recommended)
 * usePageTitle('page_title.login');
 */
const PageTitle = ({ titleKey, suffix, useSuffix }) => {
    usePageTitle(titleKey, { suffix, useSuffix });
    return null; // This component doesn't render anything
};

export default PageTitle;

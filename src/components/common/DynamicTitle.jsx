'use client';

import { usePageTitle } from '@/contexts/PageTitleContext';

/**
 * DynamicTitle Component
 *
 * Uses the centralized PageTitleContext for managing page titles
 *
 * @param {string} titleKey - Translation key for the page title
 * @param {string} suffix - Optional suffix (defaults to "WeShare")
 * @param {boolean} useSuffix - Whether to use suffix (defaults to true)
 *
 * @example
 * <DynamicTitle titleKey="page_title.login" />
 *
 * @deprecated For new code, prefer using usePageTitle hook directly:
 * usePageTitle('page_title.login');
 */
const DynamicTitle = ({ titleKey, suffix, useSuffix = true }) => {
  usePageTitle(titleKey, { suffix, useSuffix });
  return null;
};

export default DynamicTitle;

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const PageTitleContext = createContext({
  setPageTitle: () => {},
  pageTitle: null
});

/**
 * PageTitleProvider Component
 *
 * Manages page titles globally. Wrap your app with this provider
 * in the root layout.
 */
export function PageTitleProvider({ children, defaultSuffix = 'WeShare' }) {
  const [pageTitle, setPageTitle] = useState(null);
  const { lang } = useLanguage();

  useEffect(() => {
    if (pageTitle) {
      const { titleKey, suffix, useSuffix } = pageTitle;
      const title = lang(titleKey);
      const finalSuffix = suffix !== undefined ? suffix : defaultSuffix;
      const fullTitle = useSuffix !== false ? `${title} - ${finalSuffix}` : title;
      document.title = fullTitle;
    }
  }, [pageTitle, lang, defaultSuffix]);

  return (
    <PageTitleContext.Provider value={{ setPageTitle, pageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

/**
 * usePageTitle Hook
 *
 * Use this hook in any page component to set the page title
 *
 * @param {string} titleKey - Translation key for the page title
 * @param {object} options - Optional configuration
 * @param {string} options.suffix - Custom suffix (default: "WeShare")
 * @param {boolean} options.useSuffix - Whether to use suffix (default: true)
 *
 * @example
 * // Simple usage
 * usePageTitle('page_title.login');
 *
 * @example
 * // Custom suffix
 * usePageTitle('page_title.dashboard', { suffix: 'Admin Panel' });
 *
 * @example
 * // No suffix
 * usePageTitle('page_title.home', { useSuffix: false });
 */
export function usePageTitle(titleKey, options = {}) {
  const { setPageTitle } = useContext(PageTitleContext);

  useEffect(() => {
    if (titleKey) {
      setPageTitle({
        titleKey,
        suffix: options.suffix,
        useSuffix: options.useSuffix
      });
    }
  }, [titleKey, options.suffix, options.useSuffix, setPageTitle]);
}

export default PageTitleContext;

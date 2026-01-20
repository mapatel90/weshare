"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * PageTitle Component
 *
 * Dynamically sets the page title using translation keys
 *
 * @param {string} titleKey - Translation key for the page title (e.g., "page_title.login")
 * @param {string} suffix - Optional suffix to append (defaults to "WeShare")
 * @param {boolean} useSuffix - Whether to append the suffix (defaults to true)
 *
 * @example
 * // Simple usage
 * <PageTitle titleKey="page_title.login" />
 * // Output: "Login - WeShare"
 *
 * @example
 * // Without suffix
 * <PageTitle titleKey="page_title.dashboard" useSuffix={false} />
 * // Output: "Dashboard"
 *
 * @example
 * // Custom suffix
 * <PageTitle titleKey="page_title.profile" suffix="Sunshare Platform" />
 * // Output: "Profile - Sunshare Platform"
 */
const PageTitle = ({ titleKey, suffix = 'WeShare', useSuffix = true }) => {
    const { lang } = useLanguage();

    useEffect(() => {
        const title = lang(titleKey);
        const fullTitle = useSuffix ? `${title} - ${suffix}` : title;
        document.title = fullTitle;
    }, [titleKey, suffix, useSuffix, lang]);

    return null; // This component doesn't render anything
};

export default PageTitle;

'use client';

import { useSettings } from '@/contexts/SettingsContext';

export function useFormatPrice() {
  const { settings, loading } = useSettings();

  return (amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '-';

    const currency = options.currency || settings?.finance_currency || 'VND';
    const locale   = options.locale   || settings?.currency_locale || 'en-US';
    const decimals = options.decimals != null ? options.decimals : 3;
    const site_country = settings?.site_country != null ? settings.site_country : '';

    const formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        style: 'currency',
        currency:currency,
        maximumFractionDigits: decimals,
    }).format(amount);

    return formatted;

    // For Vietnamese currency, move the currency symbol to the end
    if (currency === 'đ' || currency === 'VND' || site_country == 6) {
      // Remove currency symbol (₫ or VND) from the beginning
      const numberPart = formatted.replace(/^[^\d-]+\s*/, '').trim();
      // Add currency symbol at the end
      return `${numberPart} ${currency}`;
    }

    return formatted;
  };
}

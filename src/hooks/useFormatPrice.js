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
  };
}


export function usePriceWithCurrency() {
  const { settings } = useSettings();

  return (amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '-';

    const currency = options.currency || settings?.finance_currency || 'VND';
    const position = options.position || settings?.currency_position || 'before';
    const symbol   = options.symbol   || settings?.currency_symbol || currency;

    const value = Number(amount);

    // Return without formatting
    return position === 'after'
      ? `${value} ${symbol}`
      : `${symbol} ${value}`;
  };
}

'use client';

import { useSettings } from '@/contexts/SettingsContext';

export function usePriceWithCurrency() {
  const { settings } = useSettings();

  return (amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '-';

    const currency = options.currency || settings?.finance_currency || 'VND';
    const position = options.position || settings?.currency_position || 'before';
    const symbol   = options.symbol   || settings?.currency_symbol || currency;

    const value = Number(amount);

    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency:currency,
    }).format(value);

    return formatted;
   };
}

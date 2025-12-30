'use client'
import React from 'react'
import { Sun, Zap, TrendingUp, Activity } from 'lucide-react'
import { getSettingValue } from '@/utils/settingsHelper';
import getSetting from "@/hooks/useSettings";
import { useLanguage } from '@/contexts/LanguageContext';

const formatNumber = (v, suffix = '') => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'number') return v.toLocaleString() + suffix
  return String(v) + suffix
}

const toNumericOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? null : numeric
}

const getAggregatedMetric = (source, key) => {
  if (!source) return null
  if (Array.isArray(source)) {
    let hasValue = false
    const total = source.reduce((sum, entry) => {
      const numeric = toNumericOrNull(entry?.[key])
      if (numeric === null) return sum
      hasValue = true
      return sum + numeric
    }, 0)
    return hasValue ? total : null
  }
  return toNumericOrNull(source?.[key])
}

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, isDark = false }) => {
  const colors = {
    cardBg: isDark ? '#121a2d' : '#fff',
    text: isDark ? '#ffffff' : '#111827',
    textMuted: isDark ? '#b1b4c0' : '#6b7280',
    textSubtitle: isDark ? '#9ca3af' : '#9ca3af',
    border: isDark ? '#1b2436' : '#f3f4f6',
    trendPositiveBg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
    trendPositiveText: isDark ? '#22c55e' : '#166534',
    trendNegativeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
    trendNegativeText: isDark ? '#ef4444' : '#991b1b',
    boxShadow: isDark ? '0 0 20px rgba(14, 32, 56, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
  }

  return (
    <div style={{
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      boxShadow: colors.boxShadow,
      padding: 24,
      border: `1px solid ${colors.border}`,
      transition: 'box-shadow 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 24, height: 24, color: '#fff' }} />
        </div>
        {trend !== null && trend !== undefined && (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: trend > 0 ? colors.trendPositiveBg : colors.trendNegativeBg,
            color: trend > 0 ? colors.trendPositiveText : colors.trendNegativeText
          }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>{value}</h3>
      <p style={{ fontSize: 14, color: colors.textMuted }}>{title}</p>
      <p style={{ fontSize: 12, color: colors.textSubtitle, marginTop: 4 }}>{subtitle}</p>
    </div>
  )
}

const StatCardsGrid = ({
  project = {},
  inverterLatest = null,
  inverterLatestLoading = false,
  selectedInverterId = '',
  statCardsData = [],
  isDark = false
}) => {
  // If an inverter is selected, show its data; otherwise show project-level data
  const { lang } = useLanguage()
  const isInverterSelected = !!selectedInverterId;
  const projectPriceKwh = project?.price_kwh;
  // Prefer statCardsData for yield metrics if available
  let dailyYieldMetric = null;
  let totalYieldMetric = null;
  let hasAggregatedData = Array.isArray(statCardsData) && statCardsData.length > 0;
  if (!isInverterSelected && hasAggregatedData) {
    // Sum all daily_yield and total_yield from statCardsData
    dailyYieldMetric = statCardsData.reduce((sum, item) => sum + (item.daily_yield || 0), 0);
    totalYieldMetric = statCardsData.reduce((sum, item) => sum + (item.total_yield || 0), 0);
  } else if (isInverterSelected && hasAggregatedData) {
    // Find the selected inverter's values
    const selected = statCardsData.find(item => String(item.inverter_id) === String(selectedInverterId));
    dailyYieldMetric = selected?.daily_yield ?? null;
    totalYieldMetric = selected?.total_yield ?? null;
  } else {
    // Fallback to inverterLatest
    dailyYieldMetric = getAggregatedMetric(statCardsData, 'daily_yield');
    totalYieldMetric = getAggregatedMetric(statCardsData, 'total_yield');
  }
  const settings_data = getSetting();
  const currency = settings_data?.settings?.finance_currency;
  const contextLabel = isInverterSelected
    ? 'Selected Inverter'
    : hasAggregatedData
      ? 'All Inverters'
      : 'Project';

  // Determine daily yield
  let dailyYieldValue, dailyYieldSubtitle
  if (inverterLatestLoading) {
    dailyYieldValue = 'Loading...'
    dailyYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (dailyYieldMetric !== null) {
    dailyYieldValue = `${formatNumber(dailyYieldMetric)} kWh`
    let monetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && dailyYieldMetric !== null) {
      monetaryValue = dailyYieldMetric * projectPriceKwh
    }
    dailyYieldSubtitle = (monetaryValue !== null ? ` • ${lang('reports.dailyRevenue')}: ${currency} ${formatNumber(monetaryValue)}` : '')
  } else if (!isInverterSelected && project?.daily_yield !== undefined && project?.daily_yield !== null) {
    dailyYieldValue = `${formatNumber(project.daily_yield)} kWh`
    let monetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && project.daily_yield !== null) {
      monetaryValue = project.daily_yield * projectPriceKwh
    }
    dailyYieldSubtitle = (monetaryValue !== null ? ` • ${lang('reports.dailyRevenue')}: ${currency} ${formatNumber(monetaryValue)}` : '')
  } else {
    dailyYieldValue = '-'
    dailyYieldSubtitle = isInverterSelected
      ? 'No revenue available for selected inverter'
      : 'No revenue available'
  }

  // Determine total yield
  let totalYieldValue, totalYieldSubtitle
  if (inverterLatestLoading) {
    totalYieldValue = 'Loading...'
    totalYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (totalYieldMetric !== null) {
    totalYieldValue = `${formatNumber(totalYieldMetric)} kWh`
    let totalMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && totalYieldMetric !== null) {
      totalMonetaryValue = totalYieldMetric * projectPriceKwh
    }
    totalYieldSubtitle = (totalMonetaryValue !== null ? ` • ${lang('reports.totalRevenue')}: ${currency} ${formatNumber(totalMonetaryValue)}` : '')
  } else if (!isInverterSelected && project?.total_yield !== undefined && project?.total_yield !== null) {
    totalYieldValue = `${formatNumber(project.total_yield)} kWh`
    let totalMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && project.total_yield !== null) {
      totalMonetaryValue = project.total_yield * projectPriceKwh
    }
    totalYieldSubtitle = (totalMonetaryValue !== null ? ` • ${lang('reports.totalRevenue')}: ${currency} ${formatNumber(totalMonetaryValue)}` : '')
  } else {
    totalYieldValue = '-'
    totalYieldSubtitle = isInverterSelected
      ? 'No revenue available for selected inverter'
      : 'No revenue available'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
      <StatCard
        icon={Sun}
        title={lang('projectView.projectInformation.capacity', 'Capacity')}
        value={(project?.project_size !== undefined ? formatNumber(project?.project_size) : '-') + ' kWh'}
        subtitle={project?.project_size !== undefined ? ` • ${lang('reports.capacityPrice', 'Capacity Price')}: ${currency} ${formatNumber(project?.project_size)}` : lang('reports.capacityperKWh', 'Capacity price per kWh')}
        color="linear-gradient(to bottom right, #fbbf24, #f97316)"
        trend={null}
        isDark={isDark}
      />
      <StatCard
        icon={Zap}
        title={lang('reports.dailyYield', 'Daily Yield')}
        value={dailyYieldValue}
        subtitle={dailyYieldSubtitle}
        color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
        trend={isInverterSelected ? null : (project?.output_trend ?? null)}
        isDark={isDark}
      />
      <StatCard
        icon={Activity}
        title={lang('reports.totalYield', 'Total Yield')}
        value={totalYieldValue}
        subtitle={totalYieldSubtitle}
        color="linear-gradient(to bottom right, #06b6d4, #0891b2)"
        trend={null}
        isDark={isDark}
      />
      <StatCard
        icon={Activity}
        title="Revenue"
        value={
          project?.monthly_revenue
            ? `$${formatNumber(project.monthly_revenue)}`
            : project?.revenue
              ? `$${formatNumber(project.revenue)}`
              : '-'
        }
        subtitle="Total revenue generated"
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        trend={project?.revenue_trend ?? null}
        isDark={isDark}
      />
    </div>
  )
}

export default StatCardsGrid
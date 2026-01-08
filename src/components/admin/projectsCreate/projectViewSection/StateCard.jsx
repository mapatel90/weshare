'use client'
import React from 'react'
import { Sun, Zap, TrendingUp, Activity } from 'lucide-react'
import { getSettingValue } from '@/utils/settingsHelper';
import getSetting from "@/hooks/useSettings";
import { useLanguage } from '@/contexts/LanguageContext';
import { formatShort, formatEnergyUnit } from '@/utils/common';

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
      <h3 style={{ fontSize: 30, fontWeight: 'bold', color: colors.text, marginBottom: 4, display: 'flex', alignItems: 'baseline' }}>
        {(() => {
          const valueStr = String(value)
          const decimalMatch = valueStr.match(/^([^.]+)(\.[\d,]+)(.*)$/)
          if (decimalMatch) {
            return (
              <>
                <span>{decimalMatch[1]}</span>
                <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>{decimalMatch[2]}{decimalMatch[3]}</span>
              </>
            )
          }
          return value
        })()}
      </h3>
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
  console.log('StatCardsGrid render:', project);
  // If an inverter is selected, show its data; otherwise show project-level data
  const { lang } = useLanguage()
  const isInverterSelected = !!selectedInverterId;
  const projectPriceKwh = project?.weshare_price_kwh;
  const projectStateData = project?.project_data || {};
  const inverterStateData = project?.project_inverters || {};
  // Prefer statCardsData for yield metrics if available
  let dailyYieldMetric = null;
  let totalYieldMetric = null;
  let monthlyYieldMetric = null;
  let hasAggregatedData = Array.isArray(statCardsData) && statCardsData.length > 0;
  if (!isInverterSelected && hasAggregatedData) {
    console.log('Aggregating data from statCardsData for project-level view');
    // Sum all daily_yield and total_yield from statCardsData
    dailyYieldMetric = projectStateData.reduce((sum, item) => sum + (item.day_energy || 0), 0);
    totalYieldMetric = projectStateData.reduce((sum, item) => sum + (item.year_energy || 0), 0);
  } else if (isInverterSelected && hasAggregatedData) {
    // Find the selected inverter's values
    console.log('Finding data for selected inverter ID:', selectedInverterId);
    const selected = inverterStateData.find(item => String(item.id) === String(selectedInverterId));
    dailyYieldMetric = selected?.day_energy ?? null;
    monthlyYieldMetric = selected?.month_energy ?? null;
    totalYieldMetric = selected?.total_energy ?? null;
  } else {
    console.log('Using fallback metrics from statCardsData');
    // Fallback to inverterLatest
    const selected = inverterStateData.find(item => String(item.id) === String(selectedInverterId));
    dailyYieldMetric = selected?.day_energy ?? null;
    monthlyYieldMetric = selected?.month_energy ?? null;
    totalYieldMetric = selected?.total_energy ?? null;
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
    dailyYieldSubtitle = (monetaryValue !== null ? ` • ${lang('reports.dailyRevenue')}: ${currency} ${formatShort(monetaryValue)}` : '')
  } else if (!isInverterSelected && project?.project_data?.[0]?.day_energy !== undefined && project?.project_data?.[0]?.day_energy !== null) {
    dailyYieldValue = `${formatNumber(project.project_data[0].day_energy)} kWh`
    let monetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && project.project_data[0].day_energy !== null) {
      monetaryValue = project.project_data[0].day_energy * projectPriceKwh
    }
    dailyYieldSubtitle = (monetaryValue !== null ? ` • ${lang('reports.dailyRevenue')}: ${currency} ${formatShort(monetaryValue)}` : '')
  } else {
    dailyYieldValue = '-'
    dailyYieldSubtitle = isInverterSelected
      ? 'No revenue available for selected inverter'
      : 'No revenue available'
  }

  // Determine monthly yield
  let monthlyYieldValue, monthlyYieldSubtitle, monthlyYieldRawValue = null
  if (inverterLatestLoading) {
    monthlyYieldValue = 'Loading...'
    monthlyYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (monthlyYieldMetric !== null) {
    monthlyYieldRawValue = monthlyYieldMetric
    monthlyYieldValue = formatEnergyUnit(monthlyYieldRawValue)
    let monthlyMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && monthlyYieldRawValue !== null) {
      monthlyMonetaryValue = monthlyYieldRawValue * projectPriceKwh
    }
    monthlyYieldSubtitle = (monthlyMonetaryValue !== null ? ` • ${lang('reports.monthlyRevenue')}: ${currency} ${formatShort(monthlyMonetaryValue)}` : '')
  } else if (!isInverterSelected && project?.project_data?.[0]?.month_energy !== undefined && project?.project_data?.[0]?.month_energy !== null) {
    monthlyYieldRawValue = project.project_data[0].month_energy
    monthlyYieldValue = formatEnergyUnit(monthlyYieldRawValue)
    let monthlyMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && monthlyYieldRawValue !== null) {
      monthlyMonetaryValue = monthlyYieldRawValue * projectPriceKwh
    }
    monthlyYieldSubtitle = (monthlyMonetaryValue !== null ? ` • ${lang('reports.monthlyRevenue')}: ${currency} ${formatShort(monthlyMonetaryValue)}` : '')
  } else if (project?.monthly_revenue) {
    monthlyYieldValue = `${currency ? currency + ' ' : ''}${formatNumber(project.monthly_revenue)}`
    monthlyYieldSubtitle = lang('reports.monthlyRevenue', 'Monthly Revenue')
  } else if (project?.revenue) {
    monthlyYieldValue = `${currency ? currency + ' ' : ''}${formatNumber(project.revenue)}`
    monthlyYieldSubtitle = lang('reports.monthlyRevenue', 'Monthly Revenue')
  } else {
    monthlyYieldValue = '-'
    monthlyYieldSubtitle = isInverterSelected
      ? 'No revenue available for selected inverter'
      : 'No revenue available'
  }

  // Determine total yield
  let totalYieldValue, totalYieldSubtitle
  if (inverterLatestLoading) {
    totalYieldValue = 'Loading...'
    totalYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (totalYieldMetric !== null) {
    totalYieldValue = `${formatEnergyUnit(totalYieldMetric)}`
    let totalMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && totalYieldMetric !== null) {
      totalMonetaryValue = totalYieldMetric * projectPriceKwh
    }
    totalYieldSubtitle = (totalMonetaryValue !== null ? ` • ${lang('reports.totalRevenue')}: ${currency} ${formatShort(totalMonetaryValue)}` : '')
  } else if (!isInverterSelected && project?.project_data?.[0]?.total_energy !== undefined && project?.project_data?.[0]?.total_energy !== null) {
    totalYieldValue = `${formatNumber(project.project_data[0].total_energy)} kWh`
    let totalMonetaryValue = null
    if (projectPriceKwh !== undefined && projectPriceKwh !== null && project.project_data[0].total_energy !== null) {
      totalMonetaryValue = project.project_data[0].total_energy * projectPriceKwh
    }
    totalYieldSubtitle = (totalMonetaryValue !== null ? ` • ${lang('reports.totalRevenue')}: ${currency} ${formatShort(totalMonetaryValue)}` : '')
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
        subtitle={project?.weshare_price_kwh !== undefined ? ` • ${lang('reports.capacityPrice', 'Capacity Price')}: ${currency} ${formatShort(project?.weshare_price_kwh)} ${lang('animated.perkwh', 'Per kWh')} `  : lang('reports.capacityperKWh', 'Capacity price per kWh')}
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
        title={lang('reports.monthlyYield', 'Monthly Yield')}
        value={monthlyYieldValue}
        subtitle={monthlyYieldSubtitle}
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        trend={project?.revenue_trend ?? null}
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
    </div>
  )
}

export default StatCardsGrid
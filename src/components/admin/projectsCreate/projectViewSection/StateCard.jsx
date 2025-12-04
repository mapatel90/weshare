'use client'
import React from 'react'
import { Sun, Zap, TrendingUp, Activity } from 'lucide-react'

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

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: 24,
    border: '1px solid #f3f4f6',
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
          backgroundColor: trend > 0 ? '#dcfce7' : '#fee2e2',
          color: trend > 0 ? '#166534' : '#991b1b'
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{value}</h3>
    <p style={{ fontSize: 14, color: '#6b7280' }}>{title}</p>
    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{subtitle}</p>
  </div>
)

const StatCardsGrid = ({
  project = {},
  contracts = [],
  contractsLoading = false,
  inverterLatest = null,
  inverterLatestLoading = false,
  selectedInverterId = ''
}) => {
  // If an inverter is selected, show its data; otherwise show project-level data
  const isInverterSelected = !!selectedInverterId
  const hasAggregatedData = Array.isArray(inverterLatest)
  const dailyYieldMetric = getAggregatedMetric(inverterLatest, 'daily_yield')
  const totalYieldMetric = getAggregatedMetric(inverterLatest, 'total_yield')
  const contextLabel = isInverterSelected
    ? 'Selected Inverter'
    : hasAggregatedData
      ? 'All Inverters'
      : 'Project'
  
  // Determine daily yield
  let dailyYieldValue, dailyYieldSubtitle
  if (inverterLatestLoading) {
    dailyYieldValue = 'Loading...'
    dailyYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (dailyYieldMetric !== null) {
    dailyYieldValue = `${formatNumber(dailyYieldMetric)} kWh`
    dailyYieldSubtitle = `Energy produced today (${contextLabel})`
  } else if (!isInverterSelected && project?.daily_yield !== undefined && project?.daily_yield !== null) {
    dailyYieldValue = `${formatNumber(project.daily_yield)} kWh`
    dailyYieldSubtitle = 'Energy produced today (Project)'
  } else {
    dailyYieldValue = '-'
    dailyYieldSubtitle = isInverterSelected
      ? 'No data available for selected inverter'
      : 'No data available'
  }

  // Determine total yield
  let totalYieldValue, totalYieldSubtitle
  if (inverterLatestLoading) {
    totalYieldValue = 'Loading...'
    totalYieldSubtitle = `Loading ${isInverterSelected ? 'inverter' : 'project'} data...`
  } else if (totalYieldMetric !== null) {
    totalYieldValue = `${formatNumber(totalYieldMetric)} kWh`
    totalYieldSubtitle = `Lifetime energy produced (${contextLabel})`
  } else if (!isInverterSelected && project?.total_yield !== undefined && project?.total_yield !== null) {
    totalYieldValue = `${formatNumber(project.total_yield)} kWh`
    totalYieldSubtitle = 'Lifetime energy produced (Project)'
  } else {
    totalYieldValue = '-'
    totalYieldSubtitle = isInverterSelected
      ? 'No data available for selected inverter'
      : 'No data available'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
      <StatCard
        icon={Sun}
        title="Total Contracts"
        value={contractsLoading ? 'Loading...' : (Array.isArray(contracts) ? formatNumber(contracts.length) : '-')}
        subtitle="Number of contracts for this project"
        color="linear-gradient(to bottom right, #fbbf24, #f97316)"
        trend={null}
      />
      <StatCard
        icon={Zap}
        title="Daily Yield"
        value={dailyYieldValue}
        subtitle={dailyYieldSubtitle}
        color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
        trend={isInverterSelected ? null : (project?.output_trend ?? null)}
      />
      <StatCard
        icon={Activity}
        title="Total Yield"
        value={totalYieldValue}
        subtitle={totalYieldSubtitle}
        color="linear-gradient(to bottom right, #06b6d4, #0891b2)"
        trend={null}
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
        subtitle="This month (Project Level)"
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        trend={project?.revenue_trend ?? null}
      />
    </div>
  )
}

export default StatCardsGrid
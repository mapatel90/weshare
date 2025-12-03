'use client'
import React from 'react'
import { Sun, Zap, TrendingUp, Activity } from 'lucide-react'

const formatNumber = (v, suffix = '') => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'number') return v.toLocaleString() + suffix
  return String(v) + suffix
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

const StatCardsGrid = ({ project = {}, contracts = [], contractsLoading = false, inverterLatest = null, inverterLatestLoading = false }) => {
  // Prefer the dedicated /latest endpoint result when available; otherwise fall back to inverterData first item or computed latest
  console.log('inverterLatestLoading:', inverterLatestLoading, 'inverterLatest:', inverterLatest);
  const preferredReading = (!inverterLatestLoading && inverterLatest) ? inverterLatest : null

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
        value={
          preferredReading?.daily_yield !== undefined && preferredReading?.daily_yield !== null
            ? `${formatNumber(preferredReading.daily_yield)} kWh`
            : project?.daily_yield
              ? `${formatNumber(project.daily_yield)} kWh`
              : '-'
        }
        subtitle={preferredReading ? `Energy produced today (from latest record)` : 'Energy produced today'}
        color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
        trend={project?.output_trend ?? null}
      />
      <StatCard
        icon={Activity}
        title="Total Yield"
        value={
          preferredReading?.total_yield !== undefined && preferredReading?.total_yield !== null
            ? `${formatNumber(preferredReading.total_yield)} kWh`
            : project?.total_yield
              ? `${formatNumber(project.total_yield)} kWh`
              : '-'
        }
        subtitle={preferredReading ? `Lifetime energy produced (from latest record)` : 'Lifetime energy produced'}
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
        subtitle="This month"
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        trend={project?.revenue_trend ?? null}
      />
    </div>
  )
}

export default StatCardsGrid
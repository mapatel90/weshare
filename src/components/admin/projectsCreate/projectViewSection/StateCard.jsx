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

// helper: pick latest reading from inverterData array (uses createdAt or date)
const getLatestReading = (arr = []) => {
  if (!Array.isArray(arr) || arr.length === 0) return null
  return arr.reduce((latest, item) => {
    const t = new Date(item.createdAt || item.date || null).getTime() || 0
    const lt = new Date(latest.createdAt || latest.date || null).getTime() || 0
    return t > lt ? item : latest
  }, arr[0])
}

const StatCardsGrid = ({ project = {}, inverterData = [], contracts = [], contractsLoading = false }) => {
  // Use the first item in inverterData array (inverterData[0]) as requested
  const firstItem = Array.isArray(inverterData) && inverterData.length > 0 ? inverterData[0] : null
  console.log('StatCardsGrid - project:', inverterData)
  console.log('StatCardsGrid - firstItem:', firstItem)

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
          firstItem?.daily_yield !== undefined && firstItem?.daily_yield !== null
            ? `${formatNumber(firstItem.daily_yield)} kWh`
            : project?.daily_yield
              ? `${formatNumber(project.daily_yield)} kWh`
              : '-'
        }
        subtitle="Energy produced today (from first inverterData item)"
        color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
        trend={project?.output_trend ?? null}
      />
      <StatCard
        icon={Activity}
        title="Total Yield"
        value={
          firstItem?.total_yield !== undefined && firstItem?.total_yield !== null
            ? `${formatNumber(firstItem.total_yield)} kWh`
            : project?.total_yield
              ? `${formatNumber(project.total_yield)} kWh`
              : '-'
        }
        subtitle="Lifetime energy produced (from first inverterData item)"
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
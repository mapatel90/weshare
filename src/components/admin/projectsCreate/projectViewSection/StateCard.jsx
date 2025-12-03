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

const StatCardsGrid = ({ project = {}, contracts = [], contractsLoading = false }) => (
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
      title="Current Output"
      value={
        project?.current_output
          ? `${formatNumber(project.current_output)} kW`
          : project?.current_power
            ? `${formatNumber(project.current_power)} kW`
            : '-'
      }
      subtitle="Real-time power"
      color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
      trend={project?.output_trend ?? null}
    />
    <StatCard
      icon={TrendingUp}
      title="Efficiency"
      value={project?.efficiency ? `${formatNumber(project.efficiency)}%` : '-'}
      subtitle="System performance"
      color="linear-gradient(to bottom right, #22c55e, #059669)"
      trend={project?.efficiency_trend ?? null}
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

export default StatCardsGrid
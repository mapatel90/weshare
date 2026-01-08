'use client'

import React from 'react'
import { Sun, Zap, Activity } from 'lucide-react'
import getSetting from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatShort, formatEnergyUnit } from '@/utils/common'

/* -------------------- HELPERS -------------------- */

const formatNumber = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  return Number.isNaN(num) ? '-' : num.toLocaleString() + suffix
}

const toNumberOrNull = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

const calculateRevenue = (energy, pricePerKwh) => {
  if (energy == null || pricePerKwh == null) return null
  return energy * pricePerKwh
}

/* -------------------- UI COMPONENTS -------------------- */

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  trend,
  isDark
}) => {
  const colors = {
    bg: isDark ? '#121a2d' : '#fff',
    text: isDark ? '#fff' : '#111827',
    muted: '#9ca3af',
    border: isDark ? '#1b2436' : '#f3f4f6',
  }

  return (
    <div
      style={{
        background: colors.bg,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${colors.border}`,
      }}
    >


      {/* VALUE */}
      {React.isValidElement(value) ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '1px 0',
          }}
        >
          {value}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: color,
              }}
            >
              <Icon size={24} color="#fff" />
            </div>
          </div>
          <h3
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: colors.text,
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            {(() => {
              const valueStr = String(value)
              const match = valueStr.match(/^(\d[\d,]*)(\.[\d,]+)?(.*)$/)
              if (match) {
                const integerPart = match[1]
                const fractionalPart = match[2] ?? ''
                const unitPart = match[3] ?? ''
                const unitWithSpace =
                  unitPart && !unitPart.startsWith(' ') ? ` ${unitPart}` : unitPart

                return (
                  <>
                    <span>{integerPart}</span>
                    <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>
                      {fractionalPart}
                      {unitWithSpace}
                    </span>
                  </>
                )
              }
              return value
            })()}
          </h3>
        </>
      )}


      <p style={{ fontSize: 14, color: colors.muted }}>{title}</p>

      {subtitle && (
        <p style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

const CircularProgress = ({ percentage = 0, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#f97316"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fill="#111"
      >
        <tspan x="50%" dy="-10" fontSize="25">
          {percentage}%
        </tspan>

        <tspan x="50%" dy="25" fontSize="15" fontWeight="400">
          Capital
        </tspan>

        <tspan x="50%" dy="15" fontSize="15" fontWeight="400">
          Recovered
        </tspan>
      </text>

    </svg>
  )
}

/* -------------------- MAIN COMPONENT -------------------- */

const StatCardsGrid = ({
  project = {},
  statCardsData = [],
  selectedInverterId = '',
  inverterLatestLoading = false,
  isDark = false,
}) => {
  const { lang } = useLanguage()
  const settings = getSetting()
  const currency = settings?.settings?.finance_currency ?? ''

  const pricePerKwh = toNumberOrNull(project?.weshare_price_kwh)
  const askingPrice = toNumberOrNull(project?.asking_price)

  /* -------- INVERTER DATA -------- */
  let selectedInverter = null
  if (selectedInverterId && project?.project_inverters) {
    selectedInverter = project.project_inverters.find(
      (inv) => String(inv.id) === String(selectedInverterId)
    )
  }

  /* -------- ENERGY VALUES -------- */
  const dailyEnergy = selectedInverter
    ? selectedInverter.day_energy ?? null
    : project?.project_data?.[0]?.day_energy ?? null

  const monthlyEnergy = selectedInverter
    ? selectedInverter.month_energy ?? null
    : project?.project_data?.[0]?.month_energy ?? null

  const totalEnergy = selectedInverter
    ? selectedInverter.total_energy ?? null
    : project?.project_data?.[0]?.total_energy ?? null

  /* -------- REVENUE -------- */

  const dailyRevenue = calculateRevenue(dailyEnergy, pricePerKwh)
  const monthlyRevenue = calculateRevenue(monthlyEnergy, pricePerKwh)
  const totalRevenue = calculateRevenue(totalEnergy, pricePerKwh)

  /* -------- CAPITAL RECOVERY -------- */

  let capitalRecoveredPercent = 0

  if (askingPrice > 0 && totalRevenue > 0) {
    capitalRecoveredPercent = Math.min(
      100,
      Math.round((totalRevenue * 100) / askingPrice)
    )
  }
  /* -------------------- RENDER -------------------- */

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}
    >
      <StatCard
        icon={Sun}
        title={lang('Capacity')}
        value={`${formatNumber(project?.project_size)} kWh`}
        subtitle={`${lang('reports.capacityPrice', 'Capacity Price')}: ${currency} ${formatShort(pricePerKwh)} / kWh`}
        color="linear-gradient(to bottom right, #fbbf24, #f97316)"
        isDark={isDark}
      />

      <StatCard
        icon={Zap}
        title={lang('Daily Yield')}
        value={`${formatNumber(dailyEnergy)} kWh`}
        subtitle={
          dailyRevenue
            ? `${lang('reports.dailyRevenue')}:${currency} ${formatShort(dailyRevenue)}`
            : null
        }
        color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
        isDark={isDark}
      />

      <StatCard
        icon={Activity}
        title={lang('Monthly Yield')}
        value={formatEnergyUnit(monthlyEnergy)}
        subtitle={
          monthlyRevenue
            ? `${lang('reports.monthlyRevenue')}:${currency} ${formatShort(monthlyRevenue)}`
            : null
        }
        color="linear-gradient(to bottom right, #a855f7, #ec4899)"
        isDark={isDark}
      />

      <StatCard
        icon={Activity}
        title={lang('Total Yield')}
        value={formatEnergyUnit(totalEnergy)}
        subtitle={
          totalRevenue
            ? `${lang('reports.totalRevenue')}: ${currency} ${formatShort(totalRevenue)}`
            : null
        }
        color="linear-gradient(to bottom right, #06b6d4, #0891b2)"
        isDark={isDark}
      />

      <StatCard
        style={{ display: 'flex', justifyContent: 'center' }}
        icon={Activity}
        // title="Capital Recovery"
        value={<CircularProgress percentage={capitalRecoveredPercent} />}
        // subtitle={`${currency} ${formatShort(totalRevenue)} / ${formatShort(askingPrice)}`}
        isDark={isDark}
      />
    </div>
  )
}

export default StatCardsGrid

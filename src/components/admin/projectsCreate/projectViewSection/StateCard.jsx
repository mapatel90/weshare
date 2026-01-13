'use client'

import React from 'react'
import { Sun, Zap, Activity } from 'lucide-react'
import getSetting from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatShort, formatEnergyUnit } from '@/utils/common'
import { useFormatPrice } from '@/hooks/useFormatPrice'

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
    textSubtitle: isDark ? "#111827" : "#111827",
    textMuted: isDark ? "#b1b4c0" : "#111827",
    border: isDark ? '#1b2436' : '#f3f4f6',
    boxShadow: isDark
      ? '0 0 20px rgba(14, 32, 56, 0.3)'
      : '0 1px 3px rgba(0,0,0,0.1)',
  }

  return (
    <div
      style={{
        background: colors.bg,
        borderRadius: 10,
        padding: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.boxShadow,
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* VALUE - Special case for CircularProgress */}
      {React.isValidElement(value) ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '1px 0',
            flex: 1,
          }}
        >
          {value}
        </div>
      ) : (
        <>
          {/* Icon + Title in one line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                padding: 6,
                borderRadius: 6,
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={16} color="#fff" />
            </div>
            <p
              style={{
                fontSize: 13,
                color: colors.textMuted,
                fontWeight: 500,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </p>
          </div>

          {/* Value Display */}
          <h3
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: colors.text,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'baseline',
              lineHeight: 1.2,
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
                    <span style={{ fontSize: '0.55em', fontWeight: 'normal', marginLeft: 2 }}>
                      {fractionalPart}
                      {unitWithSpace}
                    </span>
                  </>
                )
              }
              return value
            })()}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontSize: 14,
                color: colors.textSubtitle,
                lineHeight: 1.4,
                marginTop: 'auto',
                opacity: 0.8,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  )
}

const CircularProgress = ({ percentage = 0, size = 100, strokeWidth = 12, isDark }) => {
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
        fill={isDark ? '#fff' : '#111'}
      >
        <tspan x="50%" dy="-10" fontSize="16">
          {percentage}%
        </tspan>

        <tspan x="50%" dy="25" fontSize="10" fontWeight="400">
          Capital
        </tspan>

        <tspan x="50%" dy="15" fontSize="10" fontWeight="400">
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
  const formatPrice = useFormatPrice();
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
  const projectTotalEnergy = project?.project_data?.[0]?.total_energy ?? null
  const project_total_revenue = calculateRevenue(projectTotalEnergy, pricePerKwh)


  let capitalRecoveredPercent = 0

  if (askingPrice > 0 && project_total_revenue > 0) {
    capitalRecoveredPercent = Math.min(
      100,
      Math.round((project_total_revenue  * 100) / askingPrice)
    )
  }
  /* -------------------- RENDER -------------------- */

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}
    >
      <StatCard
        icon={Sun}
        title={lang('Capacity')}
        value={`${formatNumber(project?.project_size)} kWh`}
        subtitle={`${lang('reports.capacityPrice', 'Capacity Price')}:  ${formatPrice(pricePerKwh)} / kWh`}
        color="linear-gradient(to bottom right, #fbbf24, #f97316)"
        isDark={isDark}
      />

      <StatCard
        icon={Zap}
        title={lang('Daily Yield')}
        value={`${formatNumber(dailyEnergy)} kWh`}
        subtitle={
          dailyRevenue
            ? `${lang('reports.dailyRevenue')}: ${formatPrice(dailyRevenue)}`
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
            ? `${lang('reports.monthlyRevenue')}: ${formatPrice(monthlyRevenue)}`
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
            ? `${lang('reports.totalRevenue')}:  ${formatPrice(totalRevenue)}`
            : null
        }
        color="linear-gradient(to bottom right, #06b6d4, #0891b2)"
        isDark={isDark}
      />

      <StatCard
        style={{ display: 'flex', justifyContent: 'center' }}
        icon={Activity}
        // title="Capital Recovery"
        value={<CircularProgress percentage={capitalRecoveredPercent} isDark={isDark} />}
        // subtitle={` ${formatShort(totalRevenue)} / ${formatShort(askingPrice)}`}
        isDark={isDark}
      />
    </div>
  )
}

export default StatCardsGrid

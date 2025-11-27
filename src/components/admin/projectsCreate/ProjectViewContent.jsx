'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Sun, Zap, TrendingUp, Activity, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import { apiGet } from '@/lib/api'

const useLanguage = () => ({
  lang: (key, fallback) => fallback
})

const formatNumber = (v, suffix = '') => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'number') return v.toLocaleString() + suffix
  return String(v) + suffix
}

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '24px',
    border: '1px solid #f3f4f6',
    transition: 'box-shadow 0.3s'
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: color
      }}>
        <Icon style={{ width: '24px', height: '24px', color: '#fff' }} />
      </div>
      {trend && (
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: trend > 0 ? '#dcfce7' : '#fee2e2',
          color: trend > 0 ? '#166534' : '#991b1b'
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{value}</h3>
    <p style={{ fontSize: '14px', color: '#6b7280' }}>{title}</p>
    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{subtitle}</p>
  </div>
)

const InfoCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    transition: 'background-color 0.2s'
  }}>
    <div style={{
      padding: '8px',
      borderRadius: '8px',
      background: color,
      flexShrink: 0
    }}>
      <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '-'}
      </p>
    </div>
  </div>
)

const LineChartComponent = ({ production = [], target = [], consumption = [], months = [] }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if ((!production || !production.length) && (!target || !target.length) && (!consumption || !consumption.length)) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const labels = months && months.length ? months : defaultMonths.slice(0, Math.max(production.length, target.length, consumption.length, 12))

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    labels.forEach((month, i) => {
      const x = padding + (chartWidth / (labels.length - 1 || 1)) * i
      ctx.fillText(month, x, height - 20)
    })

    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = 60000 - (60000 / 5) * i
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4)
    }

    const drawLine = (data, color, isDashed = false) => {
      if (!data || !data.length) return
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 3

      ctx.setLineDash(isDashed ? [5, 5] : [])

      ctx.beginPath()
      data.forEach((value, i) => {
        const x = padding + (chartWidth / (labels.length - 1 || 1)) * i
        const y = padding + chartHeight - (value / 60000) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      ctx.setLineDash([])
      data.forEach((value, i) => {
        const x = padding + (chartWidth / (labels.length - 1 || 1)) * i
        const y = padding + chartHeight - (value / 60000) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    drawLine(production, '#22c55e', true)
    drawLine(target, '#6366f1', true)
    drawLine(consumption, '#f59e0b', true)

  }, [production, target, consumption, months])

  if ((!production || !production.length) && (!target || !target.length) && (!consumption || !consumption.length)) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>No production/consumption/target data available for this project.</div>
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} width={600} height={320} style={{ width: '100%' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
          <span style={{ color: '#6b7280' }}>Production (kWh)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6366f1' }}></div>
          <span style={{ color: '#6b7280' }}>Target (kWh)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
          <span style={{ color: '#6b7280' }}>Consumption (kWh)</span>
        </div>
      </div>
    </div>
  )
}

const BarChartComponent = ({ revenue = [], months = [] }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!revenue || !revenue.length) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const labels = months && months.length ? months : defaultMonths.slice(0, revenue.length || 12)

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    const barWidth = chartWidth / labels.length * 0.6

    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    const maxValue = Math.max(...revenue)
    revenue.forEach((value, i) => {
      const x = padding + (chartWidth / labels.length) * i + (chartWidth / labels.length - barWidth) / 2
      const barHeight = (value / maxValue) * chartHeight
      const y = padding + chartHeight - barHeight

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradient.addColorStop(0, '#6366f1')
      gradient.addColorStop(1, '#4f46e5')

      ctx.fillStyle = gradient
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0])
      else ctx.rect(x, y, barWidth, barHeight)
      ctx.fill()
    })

    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    labels.forEach((month, i) => {
      const x = padding + (chartWidth / labels.length) * i + (chartWidth / labels.length) / 2
      ctx.fillText(month, x, height - 20)
    })

    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = maxValue - (maxValue / 5) * i
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4)
    }

  }, [revenue, months])

  if (!revenue || !revenue.length) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>No revenue data available for this project.</div>
  }

  return <canvas ref={canvasRef} width={600} height={320} style={{ width: '100%' }} />
}

const ProjectViewContent = ({ projectId = '1' }) => {
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)

  // contracts state
  const [contracts, setContracts] = useState([])
  const [contractsLoading, setContractsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiGet(`/api/projects/${projectId}`)
        if (res?.success) setProject(res.data)
      } finally {
        setLoading(false)
      }
    }
    if (projectId) load()
  }, [projectId])

  // load contracts for this project
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setContractsLoading(true)
        const res = await apiGet(`/api/contracts?projectId=${projectId}`)
        if (res?.success) setContracts(res.data || [])
        else setContracts([])
      } catch (e) {
        setContracts([])
      } finally {
        setContractsLoading(false)
      }
    }
    if (projectId) loadContracts()
  }, [projectId])

  // --- demo static data for charts (temporary) ---
  const demoMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const demoProduction = [12000, 18000, 24000, 20000, 22000, 26000] // kWh
  const demoTarget = [15000, 17000, 23000, 21000, 24000, 25000] // kWh
  const demoConsumption = [8000, 9000, 10000, 9500, 11000, 12000] // kWh
  const demoRevenue = [3000, 4200, 5100, 4800, 5300, 6000] // dollars / month
  // --- end demo data ---
  
  if (!project) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280' }}>Project not found</div>
      </div>
    )
  }
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff)', padding: '24px' }}>
      <div style={{ margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{project.project_name}</h1>
              <p style={{ color: '#6b7280' }}>{project.project_type}</p>
            </div>
            <div style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: project.status === 1 ? '#dcfce7' : '#fee2e2',
              color: project.status === 1 ? '#166534' : '#991b1b',
              fontWeight: '600'
            }}>
              {project.status === 1 ? '● Active' : '● Inactive'}
            </div>
          </div>
        </div>

        {/* Stats Cards */} 
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard
            icon={Sun}
            title="Total Contracts"
            value={contractsLoading ? 'Loading...' : (Array.isArray(contracts) ? `${formatNumber(contracts.length)}` : '-')}
            subtitle="Number of contracts for this project"
            color="linear-gradient(to bottom right, #fbbf24, #f97316)"
            trend={null}
          />
          <StatCard
            icon={Zap}
            title="Current Output"
            value={project.current_output ? `${formatNumber(project.current_output)} kW` : (project.current_power ? `${formatNumber(project.current_power)} kW` : '-')}
            subtitle="Real-time power"
            color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
            trend={project.output_trend ?? null}
          />
          <StatCard
            icon={TrendingUp}
            title="Efficiency"
            value={project.efficiency ? `${project.efficiency}%` : '-'}
            subtitle="System performance"
            color="linear-gradient(to bottom right, #22c55e, #059669)"
            trend={project.efficiency_trend ?? null}
          />
          <StatCard
            icon={Activity}
            title="Revenue"
            value={project.monthly_revenue ? `$${formatNumber(project.monthly_revenue)}` : (project.revenue ? `$${formatNumber(project.revenue)}` : '-')}
            subtitle="This month"
            color="linear-gradient(to bottom right, #a855f7, #ec4899)"
            trend={project.revenue_trend ?? null}
          />
        </div>

        {/* Project Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Basic Information */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '9999px', marginRight: '12px' }}></div>
              Basic Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoCard icon={Sun} label="Project Type" value={project.projectType?.type_name} color="#3b82f6" />
              <InfoCard icon={Users} label="Offtaker" value={project.offtaker?.fullName} color="#a855f7" />
              <InfoCard icon={Activity} label="Status" value={project.status === 1 ? 'Active' : 'Inactive'} color={project.status === 1 ? '#22c55e' : '#ef4444'} />
            </div>
          </div>

          {/* Financial Information */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '24px', backgroundColor: '#22c55e', borderRadius: '9999px', marginRight: '12px' }}></div>
              Financial Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoCard icon={DollarSign} label="Investor Profit" value={project.investor_profit} color="#22c55e" />
              <InfoCard icon={DollarSign} label="Weshare Profit" value={project.weshare_profit} color="#059669" />
              <InfoCard icon={TrendingUp} label="Asking Price" value={project.asking_price} color="#3b82f6" />
            </div>
          </div>

          {/* Location Information */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '24px', backgroundColor: '#f97316', borderRadius: '9999px', marginRight: '12px' }}></div>
              Location Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoCard icon={MapPin} label="Country" value={project.country?.name} color="#f97316" />
              <InfoCard icon={MapPin} label="State" value={project.state?.name} color="#ea580c" />
              <InfoCard icon={MapPin} label="City" value={project.city?.name} color="#ef4444" />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '24px', backgroundColor: '#6366f1', borderRadius: '9999px', marginRight: '12px' }}></div>
            Address Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Address Line 1</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.address1 || '-'}</p>
            </div>
            <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #f3e8ff, #fce7f3)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Address Line 2</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.address2 || '-'}</p>
            </div>
            <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #fed7aa, #fef3c7)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Zip Code</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.zipcode || '-'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar style={{ width: '20px', height: '20px', color: '#059669' }} />
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Created At</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.createdAt ? new Date(project.createdAt).toLocaleString() : '-'}</p>
              </div>
            </div>
            <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar style={{ width: '20px', height: '20px', color: '#2563eb' }} />
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Updated At</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meter Information + Contracts (side-by-side) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Meter Information */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '24px', backgroundColor: '#10b981', borderRadius: '9999px', marginRight: '12px' }}></div>
              Meter Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #eef2ff, #e9d5ff)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Meter Name</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.meter_name || '-'}</p>
              </div>
              <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Meter Number</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.meter_number || '-'}</p>
              </div>
              <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Number</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.sim_number || '-'}</p>
              </div>
              <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Start Date</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.sim_start_date ? new Date(project.sim_start_date).toLocaleDateString() : '-'}</p>
              </div>
              <div style={{ padding: '16px', background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SIM Expire Date</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{project.sim_expire_date ? new Date(project.sim_expire_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Contracts */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '9999px', marginRight: '12px' }}></div>
              Contracts
            </h3>
            {contractsLoading ? (
              <div style={{ color: '#6b7280' }}>Loading contracts...</div>
            ) : !contracts || contracts.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No contracts found for this project.</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {contracts.map((c) => (
                  <div key={c.id} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contractTitle || 'Untitled'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {c.offtaker?.fullName ? `Offtaker: ${c.offtaker.fullName}` : ''}
                        {c.investor?.fullName ? ` ${c.offtaker ? '·' : ''} Investor: ${c.investor.fullName}` : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{c.contractDate ? new Date(c.contractDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {c.documentUpload ? (
                        <a href={c.documentUpload.startsWith('/') ? c.documentUpload : `/${c.documentUpload}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
                          View Document
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>No document</span>
                      )}
                      <span style={{ padding: '6px 10px', borderRadius: '9999px', backgroundColor: c.status === 1 ? '#dcfce7' : c.status === 2 ? '#fee2e2' : '#f3f4f6', color: c.status === 1 ? '#166534' : c.status === 2 ? '#991b1b' : '#6b7280', fontWeight: 600, fontSize: '12px' }}>
                        {c.status === 1 ? 'Active' : c.status === 2 ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
          {/* Energy Production */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Energy Production Overview</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
              </div>
            </div>
            {/* pass static demo data */}
            <LineChartComponent
              production={demoProduction}
              target={demoTarget}
              consumption={demoConsumption}
              months={demoMonths}
            />
          </div>

          {/* Monthly Revenue */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Monthly Revenue</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
              </div>
            </div>
            {/* pass static demo revenue */}
            <BarChartComponent revenue={demoRevenue} months={demoMonths} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Reach</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>5,486</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Opened</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>42.75%</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fed7aa', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Clicked</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c' }}>38.68%</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f3e8ff', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Conversion</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#9333ea' }}>16.68%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectViewContent
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Sun, Zap, TrendingUp, Activity, MapPin, Calendar, Users, DollarSign } from 'lucide-react'

// Mock API function - replace with your actual apiGet
const apiGet = async (url) => {
  return {
    success: true,
    data: {
      project_name: 'Solar Farm Project Alpha',
      project_type: 'Commercial Solar Installation',
      offtaker: { fullName: 'Green Energy Corp' },
      status: 1,
      investor_profit: '15%',
      weshare_profit: '8%',
      country: { name: 'India' },
      state: { name: 'Gujarat' },
      city: { name: 'Ahmedabad' },
      zipcode: '380001',
      address1: 'Survey No. 123, GIDC Estate',
      address2: 'Near Industrial Zone',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-11-20T15:45:00Z'
    }
  }
}

const useLanguage = () => ({
  lang: (key, fallback) => fallback
})

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

const LineChartComponent = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const production = [35000, 42000, 38000, 45000, 52000, 58000, 55000, 48000, 42000, 38000, 35000, 32000]
    const target = [40000, 42000, 44000, 46000, 48000, 50000, 52000, 50000, 48000, 46000, 44000, 42000]
    const consumption = [28000, 35000, 32000, 38000, 45000, 50000, 48000, 42000, 36000, 32000, 30000, 28000]

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
    months.forEach((month, i) => {
      const x = padding + (chartWidth / (months.length - 1)) * i
      ctx.fillText(month, x, height - 20)
    })

    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = 60000 - (60000 / 5) * i
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4)
    }

    const drawLine = (data, color, isDashed = false) => {
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 3

      if (isDashed) {
        ctx.setLineDash([5, 5])
      } else {
        ctx.setLineDash([])
      }

      ctx.beginPath()
      data.forEach((value, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i
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
        const x = padding + (chartWidth / (data.length - 1)) * i
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

  }, [])

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

const BarChartComponent = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const revenue = [45000, 32000, 38000, 52000, 28000, 48000, 35000, 55000, 42000, 38000, 48000, 40000]

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    const barWidth = chartWidth / months.length * 0.6

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
      const x = padding + (chartWidth / months.length) * i + (chartWidth / months.length - barWidth) / 2
      const barHeight = (value / maxValue) * chartHeight
      const y = padding + chartHeight - barHeight

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradient.addColorStop(0, '#6366f1')
      gradient.addColorStop(1, '#4f46e5')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0])
      ctx.fill()
    })

    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    months.forEach((month, i) => {
      const x = padding + (chartWidth / months.length) * i + (chartWidth / months.length) / 2
      ctx.fillText(month, x, height - 20)
    })

    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = maxValue - (maxValue / 5) * i
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4)
    }

  }, [])

  return <canvas ref={canvasRef} width={600} height={320} style={{ width: '100%' }} />
}

const ProjectViewContent = ({ projectId = '1' }) => {
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)

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
            title="Total Generation"
            value="1,245 kWh"
            subtitle="Today's Production"
            color="linear-gradient(to bottom right, #fbbf24, #f97316)"
            trend={12.5}
          />
          <StatCard
            icon={Zap}
            title="Current Output"
            value="87.5 kW"
            subtitle="Real-time Power"
            color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
            trend={8.3}
          />
          <StatCard
            icon={TrendingUp}
            title="Efficiency"
            value="94.2%"
            subtitle="System Performance"
            color="linear-gradient(to bottom right, #22c55e, #059669)"
            trend={5.2}
          />
          <StatCard
            icon={Activity}
            title="Revenue"
            value="$45.2K"
            subtitle="This Month"
            color="linear-gradient(to bottom right, #a855f7, #ec4899)"
            trend={-2.1}
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
              <InfoCard icon={Sun} label="Project Type" value={project.project_type} color="#3b82f6" />
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
              <InfoCard icon={TrendingUp} label="Project ID" value={projectId} color="#3b82f6" />
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
            <LineChartComponent />
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
            <BarChartComponent />
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
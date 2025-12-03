'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { Sun, Zap, TrendingUp, Activity, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import { apiGet } from '@/lib/api'
import StatCardsGrid from './projectViewSection/StateCard'
import PowerConsumptionDashboard from './projectViewSection/inverterChart'
import ProjectInformation from './projectViewSection/ProjectInformation'
import MeterInfo from './projectViewSection/MeterInfo'
import MonthlyChart from './projectViewSection/MonthlyChart'

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

  const [inverterData, setInverterData] = useState([])
  const [inverterLoading, setInverterLoading] = useState(true)

  useEffect(() => {
    const loadInverterData = async () => {
      try {
        setInverterLoading(true)
        const res = await apiGet('/api/inverter-data')
        if (res?.success) setInverterData(res.data || [])
        else setInverterData([])
      } catch (error) {
        setInverterData([])
      } finally {
        setInverterLoading(false)
      }
    }
    loadInverterData()
  }, [])

  const filteredInverterData = useMemo(() => {
    if (!projectId) return []
    const numericId = Number(projectId)
    if (Number.isNaN(numericId)) return []
    return inverterData.filter((item) => Number(item.projectId) === numericId)
  }, [inverterData, projectId])

  // --- demo static data for charts (temporary) ---
  const demoMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const demoRevenue = [3000, 4200, 5100, 4800, 5300, 6000] // dollars / month
  // --- end demo data ---
  const revenueSummaryCards = [
    { label: 'Reach', value: '5,486', bgColor: '#dbeafe', valueColor: '#111827' },
    { label: 'Opened', value: '42.75%', bgColor: '#dcfce7', valueColor: '#059669' },
    { label: 'Clicked', value: '38.68%', bgColor: '#fed7aa', valueColor: '#ea580c' },
    { label: 'Conversion', value: '16.68%', bgColor: '#f3e8ff', valueColor: '#9333ea' },
  ]
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading project details...</div>
      </div>
    )
  }

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

        <StatCardsGrid project={project} inverterData={filteredInverterData} contracts={contracts} contractsLoading={contractsLoading} />

        <ProjectInformation project={project} />

        <MeterInfo project={project} contracts={contracts} contractsLoading={contractsLoading} />

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
            <PowerConsumptionDashboard
              projectId={projectId}
              readings={filteredInverterData}
              loading={inverterLoading}
            />
          </div>

          <MonthlyChart revenue={demoRevenue} months={demoMonths} summaryCards={revenueSummaryCards} />
        </div>
      </div>
    </div>
  )
}

export default ProjectViewContent
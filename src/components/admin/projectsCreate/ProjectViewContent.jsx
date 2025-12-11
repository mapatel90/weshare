'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import StatCardsGrid from './projectViewSection/StateCard'
import PowerConsumptionDashboard from './projectViewSection/inverterChart'
import ProjectInformation from './projectViewSection/ProjectInformation'
import MeterInfo from './projectViewSection/MeterInfo'
import MonthlyChart from './projectViewSection/MonthlyChart'

// -------- LANGUAGE HOOK (temporary) ----------
const useLanguage = () => ({
  lang: (key, fallback) => fallback
})

// -------- NUMBER FORMATTER ----------
const formatNumber = (v, suffix = '') => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'number') return v.toLocaleString() + suffix
  return String(v) + suffix
}

const ProjectViewContent = ({ projectId = '' }) => {
  const { lang } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)

  // Contracts
  const [contracts, setContracts] = useState([])
  const [contractsLoading, setContractsLoading] = useState(true)

  // Project Inverters (Dropdown)
  const [projectInverters, setProjectInverters] = useState([])
  const [projectInvertersLoading, setProjectInvertersLoading] = useState(true)
  const [selectedInverterId, setSelectedInverterId] = useState('') // No auto-select

  // Inverter Data (all projects)
  const [inverterData, setInverterData] = useState([])


  const [inverterLoading, setInverterLoading] = useState(true)

  // Latest inverter data for selected inverter
  const [selectedInverterLatest, setSelectedInverterLatest] = useState(null)
  const [selectedInverterLatestLoading, setSelectedInverterLatestLoading] = useState(false)

  // Latest inverter data for this project (default)
  const [inverterChartData, setInverterChartData] = useState(null)
  const [inverterLatestLoading, setInverterLatestLoading] = useState(true)

  // ------------------- Load Project -------------------
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
    load()
  }, [projectId])

  // ------------------- Load Contracts -------------------
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setContractsLoading(true)
        const res = await apiGet(`/api/contracts?projectId=${projectId}`)
        setContracts(res?.success ? res.data : [])
      } finally {
        setContractsLoading(false)
      }
    }
    loadContracts()
  }, [projectId])

  // ------------------- Load Project Inverters -------------------
  useEffect(() => {
    const loadProjectInverters = async () => {
      try {
        setProjectInvertersLoading(true)
        const res = await apiGet(`/api/project-inverters?project_id=${projectId}`)
        const list = res?.success ? res.data : []
        setProjectInverters(list)
        // Do NOT auto-select first inverter
      } finally {
        setProjectInvertersLoading(false)
      }
    }
    loadProjectInverters()
  }, [projectId])

  // ------------------- Load Latest Inverter Data for this project (default) -------------------
  useEffect(() => {
    const loadLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId: selectedInverterId ?? null,
      };
      try {
        setInverterLatestLoading(true)
        const res = await apiPost(`/api/inverter-data/latest`, payload)
        setInverterChartData(res?.success ? res.data : null)
      } finally {
        setInverterLatestLoading(false)
      }
    }
    loadLatest()
  }, [selectedInverterId, projectId])

  console.log("inverterChartData",inverterChartData);


  // Dummy monthly chart data
  const demoMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const demoRevenue = [3000, 4200, 5100, 4800, 5300, 6000]
  const revenueSummaryCards = [
    { label: 'Reach', value: '5,486', bgColor: '#dbeafe', valueColor: '#111827' },
    { label: 'Opened', value: '42.75%', bgColor: '#dcfce7', valueColor: '#059669' },
    { label: 'Clicked', value: '38.68%', bgColor: '#fed7aa', valueColor: '#ea580c' },
    { label: 'Conversion', value: '16.68%', bgColor: '#f3e8ff', valueColor: '#9333ea' },
  ]

  // ------------------- Determine which data to show -------------------
  const displayData = selectedInverterId ? selectedInverterLatest : inverterChartData
  const displayDataLoading = selectedInverterId ? selectedInverterLatestLoading : inverterLatestLoading

  // ------------------- Loading / Not Found UI -------------------
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

  // ------------------- MAIN UI -------------------
  return (
    <div style={{ minHeight: '100vh', height: 'auto', overflowY: 'hidden', background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff)', padding: '24px' }}>
      <div style={{ margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                {project.project_name}
              </h1>
              <p style={{ color: '#6b7280' }}>{project.project_type}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

              {/* ----- INVERTER DROPDOWN ----- */}
              <div>
                {projectInvertersLoading ? (
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading inverters...</div>
                ) : (
                  <select
                    value={selectedInverterId}
                    onChange={(e) => setSelectedInverterId(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      fontSize: '14px',
                      minWidth: '220px'
                    }}
                  >
                    <option value="">Select inverter (Project View)</option>
                    {projectInverters.map((pi) => {
                      const inv = pi.inverter || {}
                      const label = inv.inverterName
                        ? `${inv.inverterName} (Serial: ${pi.inverter_serial_number || 'N/A'})`
                        : `Inverter ID: ${pi.id}`

                      return (
                        <option key={pi.id} value={pi.inverter_id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>

              {/* PROJECT STATUS */}
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
        </div>

        {/* STAT CARDS */}
        <StatCardsGrid
          project={project}
          contracts={contracts}
          contractsLoading={contractsLoading}
          inverterLatest={displayData}
          inverterLatestLoading={displayDataLoading}
          selectedInverterId={selectedInverterId}
        />

        {/* PROJECT DETAILS */}
        <ProjectInformation project={project} />

        {/* METER INFO */}
        <MeterInfo project={project} contracts={contracts} contractsLoading={contractsLoading} inverters={projectInverters} />

        {/* CHART SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>

          {/* PRODUCTION CHART */}
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
              readings={inverterChartData || []}
              loading={inverterLatestLoading}
              selectedInverterId={selectedInverterId}
              projectInverters={projectInverters}
            />
          </div>

          {/* MONTHLY CHART */}
          <MonthlyChart
            revenue={demoRevenue}
            months={demoMonths}
            summaryCards={revenueSummaryCards}
          />

        </div>

      </div>
    </div>
  )
}

export default ProjectViewContent
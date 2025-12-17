'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import StatCardsGrid from './projectViewSection/StateCard'
import PowerConsumptionDashboard from './projectViewSection/inverterChart'
import ProjectInformation from './projectViewSection/ProjectInformation'
import ProjectOverviewChart from './projectViewSection/ProjectOverviewChart'
import MeterInfo from './projectViewSection/MeterInfo'
import MonthlyChart from './projectViewSection/MonthlyChart'
import { FiEdit3 } from 'react-icons/fi'

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
  const [statCardsData, setStatCardsData] = useState([])
  // Latest inverter data for selected inverter
  const [selectedInverterLatest, setSelectedInverterLatest] = useState(null)
  const [selectedInverterLatestLoading, setSelectedInverterLatestLoading] = useState(false)

  // Latest inverter data for this project (default)
  const [projectChartData, setProjectChartData] = useState(null)
  const [projectLatestLoading, setProjectLatestLoading] = useState(true)
  const [inverterChartData, setInverterChartData] = useState(null)
  const [inverterLatestLoading, setInverterLatestLoading] = useState(true)
  const [monthlyChartData, setMonthlyChartData] = useState(null)
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // New: track selected date

  console.log("selectedDate", new Date().toISOString().split("T")[0]);

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
        date: selectedDate ?? null,
      };
      try {
        setInverterLatestLoading(true)
        const res = await apiPost(`/api/inverter-data/chart-data`, payload)
        setInverterChartData(res?.success ? res.data : null)
      } finally {
        setInverterLatestLoading(false)
      }
    }
    loadLatest()
  }, [selectedInverterId, projectId, selectedDate])

  // ------------------- Load Project Overview Chat (default) -------------------
  useEffect(() => {
    const loadLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        date: selectedDate ?? null,
      };
      try {
        setProjectLatestLoading(true)
        const res = await apiPost(`/api/projects/chart-data`, payload)
        setProjectChartData(res?.success ? res.data : null)
      } finally {
        setProjectLatestLoading(false)
      }
    }
    loadLatest()
  }, [projectId, selectedDate])

  // ------------------- Load Count of daily yiled and total yiled -------------------
  useEffect(() => {
    const loadSelectedInverterLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId: selectedInverterId ?? null,
      };
      try {
        setSelectedInverterLatestLoading(true)
        const res = await apiPost(`/api/inverter-data/latest-record`, payload)
        setStatCardsData(res?.success ? res.data : null)
      } finally {
        setSelectedInverterLatestLoading(false)
      }
    }
    loadSelectedInverterLatest()
  }, [selectedInverterId, projectId])

  // ------------------- Load Monthly Chart Data -------------------
  useEffect(() => {
    const loadMonthlyChartData = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId: (selectedInverterId && selectedInverterId.trim() !== '') ? selectedInverterId : null,
      };
      try {
        setMonthlyChartDataLoading(true)
        const res = await apiPost(`/api/inverter-data/monthly-chart`, payload)
        console.log("month data:", res.data);
        setMonthlyChartData(res?.success ? res.data : null)
      } finally {
        setMonthlyChartDataLoading(false)
      }
    }
    loadMonthlyChartData()
  }, [selectedInverterId, projectId])

  // Transform monthly chart data from backend - always show all 12 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Always show all 12 months, fill with 0 if no data
  const monthlyChartMonths = useMemo(() => {
    return monthNames // Always return all 12 months
  }, [])

  const monthlyChartRevenue = useMemo(() => {
    // Create a map of month index to value from backend data
    const dataMap = new Map()
    if (monthlyChartData && Array.isArray(monthlyChartData)) {
      monthlyChartData.forEach(item => {
        dataMap.set(item.month, item.totalGenerateKw || 0)
      })
    }

    // Return array with all 12 months, filling 0 for months without data
    return monthNames.map((_, index) => dataMap.get(index) || 0)
  }, [monthlyChartData])

  // Map month index to inverter details for tooltip
  const monthlyChartInverters = useMemo(() => {
    const inverterMap = new Map()
    if (monthlyChartData && Array.isArray(monthlyChartData)) {
      monthlyChartData.forEach(item => {
        inverterMap.set(item.month, item.inverters || [])
      })
    }

    // Return array with all 12 months, filling empty array for months without data
    return monthNames.map((_, index) => inverterMap.get(index) || [])
  }, [monthlyChartData])

  const revenueSummaryCards = [
    { label: 'Reach', value: '5,486', bgColor: '#dbeafe', valueColor: '#111827' },
    { label: 'Opened', value: '42.75%', bgColor: '#dcfce7', valueColor: '#059669' },
    { label: 'Clicked', value: '38.68%', bgColor: '#fed7aa', valueColor: '#ea580c' },
    { label: 'Conversion', value: '16.68%', bgColor: '#f3e8ff', valueColor: '#9333ea' },
  ]

  // ------------------- Determine which data to show -------------------
  const displayData = selectedInverterId ? inverterChartData : inverterChartData
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

  console.log("setSelectedDate", setSelectedDate);

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
                <FiEdit3 style={{ cursor: 'pointer', marginLeft: '8px', color: '#3b82f6' }} onClick={() => window.location.href = `/admin/projects/edit/${project.id}`} />
              </h1>
              <p style={{ color: '#6b7280' }}>{project.project_type}</p>
            </div>

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
                  <option value="">Select inverter</option>
                  {projectInverters.map((pi) => {
                    console.log("projectInverters",projectInverters);
                    const inv = pi.inverter || {}
                    const label = pi.inverter_name
                      ? `${pi.inverter_name} (Serial: ${pi.inverter_serial_number || 'N/A'})`
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
        statCardsData={statCardsData}
      />

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
          {selectedInverterId ? (
            <PowerConsumptionDashboard
              projectId={projectId}
              readings={inverterChartData || []}
              loading={inverterLatestLoading}
              selectedInverterId={selectedInverterId}
              projectInverters={projectInverters}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              setSelectedDate={setSelectedDate}
            />
          ) : (
            <ProjectOverviewChart
              projectId={projectId}
              readings={projectChartData || []}
              loading={projectLatestLoading}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}

        </div>

        {/* MONTHLY CHART */}
        {/* <MonthlyChart
          revenue={monthlyChartRevenue}
          months={monthlyChartMonths}
          inverters={monthlyChartInverters}
          summaryCards={revenueSummaryCards}
          loading={monthlyChartDataLoading}
        /> */}

      </div>

      {/* PROJECT DETAILS */}
      <ProjectInformation project={project} />

      {/* METER INFO */}
      <MeterInfo project={project} contracts={contracts} contractsLoading={contractsLoading} inverters={projectInverters} />

    </div>
  )
}

export default ProjectViewContent
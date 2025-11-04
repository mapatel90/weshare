'use client'

import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet } from '@/lib/api'
import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import ProjectCard from './ProjectCard'
import MarketSummary from './MarketSummary'
import QuickSimulation from './QuickSimulation'

const ExchangeHub = () => {
  const [activeTab, setActiveTab] = useState('lease')
  const [projects, setProjects] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('roi-high')
  const [filters, setFilters] = useState({
    minROI: '',
    maxROI: '',
    minPrice: '',
    maxPrice: '',
    minCapacity: '',
    maxCapacity: ''
  })
  const { lang } = useLanguage()

  useEffect(() => {
    fetchProjects(1, true)
  }, [activeTab])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchQuery, filters, sortBy, allProjects])

  const fetchProjects = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/projects?page=${pageNum}&limit=50&status=1`, { showLoader: false })
      
      if (response.success && response.data?.projects) {
        if (reset) {
          setAllProjects(response.data.projects)
        } else {
          setAllProjects(prev => [...prev, ...response.data.projects])
        }
        setHasMore(response.data.projects.length === 50)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...allProjects]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.project_name?.toLowerCase().includes(query) ||
        project.project_code?.toLowerCase().includes(query) ||
        project.city?.name?.toLowerCase().includes(query) ||
        project.state?.name?.toLowerCase().includes(query) ||
        project.offtaker?.company_name?.toLowerCase().includes(query)
      )
    }

    // ROI filter
    if (filters.minROI) {
      filtered = filtered.filter(p => parseFloat(p.investor_profit || 0) >= parseFloat(filters.minROI))
    }
    if (filters.maxROI) {
      filtered = filtered.filter(p => parseFloat(p.investor_profit || 0) <= parseFloat(filters.maxROI))
    }

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter(p => parseFloat(p.asking_price || 0) >= parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => parseFloat(p.asking_price || 0) <= parseFloat(filters.maxPrice))
    }

    // Capacity filter
    if (filters.minCapacity) {
      filtered = filtered.filter(p => parseFloat(p.project_size || 0) >= parseFloat(filters.minCapacity))
    }
    if (filters.maxCapacity) {
      filtered = filtered.filter(p => parseFloat(p.project_size || 0) <= parseFloat(filters.maxCapacity))
    }

    // Sorting
    if (sortBy === 'roi-high') {
      filtered.sort((a, b) => parseFloat(b.investor_profit || 0) - parseFloat(a.investor_profit || 0))
    } else if (sortBy === 'roi-low') {
      filtered.sort((a, b) => parseFloat(a.investor_profit || 0) - parseFloat(b.investor_profit || 0))
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => parseFloat(a.asking_price || 0) - parseFloat(b.asking_price || 0))
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => parseFloat(b.asking_price || 0) - parseFloat(a.asking_price || 0))
    } else if (sortBy === 'capacity-high') {
      filtered.sort((a, b) => parseFloat(b.project_size || 0) - parseFloat(a.project_size || 0))
    } else if (sortBy === 'capacity-low') {
      filtered.sort((a, b) => parseFloat(a.project_size || 0) - parseFloat(b.project_size || 0))
    }

    setProjects(filtered)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      minROI: '',
      maxROI: '',
      minPrice: '',
      maxPrice: '',
      minCapacity: '',
      maxCapacity: ''
    })
    setSearchQuery('')
    setSortBy('roi-high')
  }

  const loadMore = () => {
    fetchProjects(page + 1, false)
  }

  return (
    <section className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container-fluid px-4">
        <div className="row">
          {/* Left Side - Projects Section */}
          <div className="col-lg-9 col-12">
            {/* Search and Filter Bar */}
            <SearchBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* Advanced Filters */}
            <FilterPanel
              showFilters={showFilters}
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
              projectCount={projects.length}
              searchQuery={searchQuery}
            />

            {/* Tabs */}
            <div className="mb-4">
              <ul className="nav nav-pills" role="tablist">
                <li className="nav-item me-2" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'lease' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lease')}
                    type="button"
                    style={{
                      backgroundColor: activeTab === 'lease' ? '#FFA500' : 'white',
                      color: activeTab === 'lease' ? '#fff' : '#1a1a2e',
                      border: activeTab === 'lease' ? 'none' : '1px solid #dee2e6',
                      borderRadius: '10px',
                      padding: '10px 24px',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    <span className="me-2" style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: activeTab === 'lease' ? '#fff' : '#FFA500'
                    }}></span>
                    {lang('home.exchangeHub.openForLease')}
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'resale' ? 'active' : ''}`}
                    onClick={() => setActiveTab('resale')}
                    type="button"
                    style={{
                      backgroundColor: activeTab === 'resale' ? '#1e3a5f' : 'white',
                      color: activeTab === 'resale' ? '#fff' : '#1a1a2e',
                      border: activeTab === 'resale' ? 'none' : '1px solid #dee2e6',
                      borderRadius: '10px',
                      padding: '10px 24px',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    <span className="me-2" style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: activeTab === 'resale' ? '#fff' : '#1e3a5f'
                    }}></span>
                    {lang('home.exchangeHub.forResale')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Projects Grid */}
            <div className="tab-content">
              {loading && page === 1 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{lang('home.exchangeHub.loading')}</span>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">{lang('home.exchangeHub.noProjects')}</p>
                </div>
              ) : (
                <>
                  <div className="row">
                    {projects.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        activeTab={activeTab}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="d-block mt-4 text-center">
                      <button 
                        className="btn text-white px-5 py-2"
                        onClick={loadMore}
                        disabled={loading}
                        style={{ backgroundColor: '#FFA500', border: 'none', borderRadius: '8px' }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {lang('home.exchangeHub.loading')}
                          </>
                        ) : (
                          lang('home.exchangeHub.loadMore')
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side - Market Summary & Quick Simulation */}
          <div className="col-lg-3 col-12 mb-4">
            <div className="p-4" style={{ 
              backgroundColor: '#FFF5E6',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {/* Market Summary Section */}
              <div className="mb-5">
                <h5 className="fw-bold mb-4" style={{ 
                  fontSize: '16px', 
                  color: '#000', 
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {lang('home.exchangeHub.marketSummary')}
                </h5>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.totalProjects')}</span>
                    <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>{allProjects.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.totalCapacity')}</span>
                    <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>
                      {allProjects.reduce((sum, p) => sum + parseFloat(p.project_size || 0), 0).toLocaleString()} kWp
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.averageROI')}</span>
                    <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>
                      {allProjects.length > 0 
                        ? (allProjects.reduce((sum, p) => sum + parseFloat(p.investor_profit || 0), 0) / allProjects.length).toFixed(1)
                        : '0.0'}%
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.activeInvestors')}</span>
                    <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>320+</strong>
                  </div>
                </div>
              </div>

              {/* Quick Simulation Section */}
              <div>
                <h5 className="fw-bold mb-4" style={{ 
                  fontSize: '16px', 
                  color: '#000', 
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {lang('home.exchangeHub.quickSimulation')}
                </h5>
                <div className="mb-4">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.ifYouInvest')}</span>
                      <span style={{ fontSize: '20px', color: '#000', fontWeight: '700' }}>$5,000 <span style={{ fontSize: '16px' }}>→</span></span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.youCanEarn')}</span>
                      <span style={{ fontSize: '20px', color: '#000', fontWeight: '700' }}>$900{lang('home.exchangeHub.perYear')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {lang('home.exchangeHub.basedOnROI')}
                    </div>
                  </div>
                </div>
                <button className="btn text-white w-100 mb-3" style={{ 
                  backgroundColor: '#FFA500', 
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {lang('home.exchangeHub.signUpToInvest')}
                </button>
                <button className="btn w-100 d-flex align-items-center justify-content-center" style={{
                  backgroundColor: 'white',
                  border: '2px solid #1a1a2e',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1a1a2e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
                  </svg>
                  {lang('home.exchangeHub.listYourProject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExchangeHub

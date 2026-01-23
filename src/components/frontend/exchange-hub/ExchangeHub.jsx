'use client'

import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet } from '@/lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'
import ProjectCard from './ProjectCard'
import './styles/exchange-hub-custom.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PROJECT_STATUS } from '@/constants/project_status'

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
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  const { lang } = useLanguage()

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'linear'
    })
  }, [])

  // Initialize Bootstrap dropdowns
  useEffect(() => {
    if (typeof window !== 'undefined' && window.bootstrap) {
      const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
      dropdownElementList.forEach((dropdownToggle) => {
        new window.bootstrap.Dropdown(dropdownToggle)
      })
    }
  }, [])

  useEffect(() => {
    fetchProjects(1, true)
  }, [activeTab])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchQuery, filters, sortBy, allProjects])

  // Refresh AOS when projects change
  useEffect(() => {
    if (projects.length > 0) {
      AOS.refresh()
    }
  }, [projects])

  const fetchProjects = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/projects?page=${pageNum}&limit=50&status=${PROJECT_STATUS.UPCOMING},${PROJECT_STATUS.RUNNING}`, { showLoader: false })

      if (response?.success) {
        // API now returns data in "data" (array) plus projectList/offtakerList helpers
        const projectsPayload = Array.isArray(response?.data?.projects)
          ? response.data.projects
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response?.data)
              ? response.data
              : []

        if (reset) {
          setAllProjects(projectsPayload)
        } else {
          setAllProjects((prev) => [...prev, ...projectsPayload])
        }

        const total = response?.data?.pagination?.total ?? response?.pagination?.total
        const limit = response?.data?.pagination?.limit ?? response?.pagination?.limit ?? projectsPayload.length
        const computedHasMore = typeof total === 'number' && typeof limit === 'number'
          ? pageNum * limit < total
          : projectsPayload.length === 50

        setHasMore(computedHasMore)
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

  // Show loader while checking authentication
  // if (authLoading) {

  // }

  return (
    <section className="main-contentBox Exchange-page">
      <div className="container">
        <div className="row">
          {/* Left Side - Projects Section */}
          <div className="col-12 col-md-7 col-lg-8">
            {/* Search and Filter Section */}
            <div className="filterSection">
              <div className="searchBox">
                <input
                  type="search"
                  className="search"
                  placeholder={lang('home.exchangeHub.searchPlaceholder') || 'Search Here...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filterGroupBtn">
                <a
                  href="#"
                  className="filterBtn normalBtn"
                  onClick={(e) => { e.preventDefault(); setShowFilters(!showFilters) }}
                  style={{ gap: 0 }}
                >
                  <img src="/images/icons/Filter-icon.svg" alt="filter" className="me-3" onError={(e) => e.target.style.display = 'none'} />
                  {lang('home.exchangeHub.filter')}
                </a>
                <div className="dropdown d-inline-block">
                  <button
                    className="normalBtn dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <img className="me-3" src="/images/icons/sort-icon.svg" alt="sort" onError={(e) => e.target.style.display = 'none'} />
                    {lang('home.exchangeHub.sortBy')}
                  </button>
                  <ul className="dropdown-menu w-100">
                    <li><button className={`dropdown-item ${sortBy === 'roi-high' ? 'active' : ''}`} style={{ width: '90%' }} type="button" onClick={() => setSortBy('roi-high')}>{lang('home.exchangeHub.sortRoiHigh')}</button></li>
                    <li><button className={`dropdown-item ${sortBy === 'roi-low' ? 'active' : ''}`} style={{ width: '90%' }} type="button" onClick={() => setSortBy('roi-low')}>{lang('home.exchangeHub.sortRoiLow')}</button></li>
                    {/* <li><hr className="dropdown-divider" /></li>
                    <li><button className={`dropdown-item ${sortBy === 'price-low' ? 'active' : ''}`} type="button" onClick={() => setSortBy('price-low')}>{lang('home.exchangeHub.sortPriceLow')}</button></li>
                    <li><button className={`dropdown-item ${sortBy === 'price-high' ? 'active' : ''}`} type="button" onClick={() => setSortBy('price-high')}>{lang('home.exchangeHub.sortPriceHigh')}</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className={`dropdown-item ${sortBy === 'capacity-high' ? 'active' : ''}`} type="button" onClick={() => setSortBy('capacity-high')}>{lang('home.exchangeHub.sortCapacityHigh')}</button></li>
                    <li><button className={`dropdown-item ${sortBy === 'capacity-low' ? 'active' : ''}`} type="button" onClick={() => setSortBy('capacity-low')}>{lang('home.exchangeHub.sortCapacityLow')}</button></li> */}
                  </ul>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">{lang('home.exchangeHub.advancedFilters')}</h6>
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={clearFilters}>
                    {lang('home.exchangeHub.clearAll')}
                  </button>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-600">{lang('home.exchangeHub.roiRange')}</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.min')} value={filters.minROI} onChange={(e) => handleFilterChange('minROI', e.target.value)} />
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.max')} value={filters.maxROI} onChange={(e) => handleFilterChange('maxROI', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-600">{lang('home.exchangeHub.priceRange')}</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.min')} value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} />
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.max')} value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-600">{lang('home.exchangeHub.capacityRange')}</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.min')} value={filters.minCapacity} onChange={(e) => handleFilterChange('minCapacity', e.target.value)} />
                      <input type="number" className="form-control form-control-sm" placeholder={lang('home.exchangeHub.max')} value={filters.maxCapacity} onChange={(e) => handleFilterChange('maxCapacity', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Section with Tabs */}
            <section className="projectSection innnerPagePattern">
              <div className="container px-0">
                <div className="headerSection" data-aos="fade-up" data-aos-easing="linear" data-aos-duration="1000">
                  <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'lease' ? 'active' : ''} ms-0`}
                        id="pills-ProjectsOpen-tab"
                        onClick={() => setActiveTab('lease')}
                        type="button"
                        role="tab"
                        style={{ borderRadius: 0 }}
                      >
                        <span className="circle"></span> {lang('home.exchangeHub.openForLease')}
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'resale' ? 'active' : ''}`}
                        id="pills-projectResale-tab"
                        onClick={() => setActiveTab('resale')}
                        type="button"
                        role="tab"
                        style={{ borderRadius: 0 }}
                      >
                        <span className="circle"></span> {lang('home.exchangeHub.forResale')}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Tab Content - Projects Grid */}
                <div className="tab-content" id="pills-tabContent">
                  <div className={`tab-pane pills-ProjectsOpen fade ${activeTab === 'lease' ? 'show active' : ''}`} id="pills-ProjectsOpen" role="tabpanel">
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
                              className="btn btn-primary-custom px-5 py-2"
                              onClick={loadMore}
                              disabled={loading}
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

                  <div className={`tab-pane fade ${activeTab === 'resale' ? 'show active' : ''}`} id="pills-projectResale" role="tabpanel">
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
                              className="btn btn-primary-custom px-5 py-2"
                              onClick={loadMore}
                              disabled={loading}
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
              </div>
            </section>
          </div>

          {/* Right Side - Market Summary & Quick Simulation */}
          <div className="col-12 col-md-5 col-lg-4">
            <div className="summarySection">
              {/* Market Summary Box */}
              <div className="summaryBox">
                <h3 className="fs-22 fw-600 text-black">{lang('home.exchangeHub.marketSummary') || 'MARKET SUMMARY'}</h3>
                <div className="row mb-1">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.totalProjects')}:</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">{allProjects.length}</p></div>
                </div>
                <div className="row mb-1">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.totalCapacity')}:</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">{allProjects.reduce((sum, p) => sum + parseFloat(p.project_size || 0), 0).toLocaleString()} kWp</p></div>
                </div>
                <div className="row mb-1">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.averageROI')}:</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">
                    {allProjects.length > 0
                      ? (allProjects.reduce((sum, p) => sum + parseFloat(p.investor_profit || 0), 0) / allProjects.length).toFixed(1)
                      : '0.0'}%
                  </p></div>
                </div>
                <div className="row mb-3">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.activeInvestors')}:</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">320+</p></div>
                </div>
              </div>

              <hr />

              {/* Quick Simulation Box */}
              <div className="summaryBox">
                <h3 className="fs-22 fw-600 text-black">{lang('home.exchangeHub.quickSimulation') || 'QUICK SIMULATION'}</h3>
                <div className="row mb-3">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.ifYouInvest') || 'If you invest'}</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">$5,000 →</p></div>
                </div>
                <div className="row mb-3">
                  <div className="col-7"><p className="fw-300 text-black">{lang('home.exchangeHub.youCanEarn') || 'You can earn approx.'}</p></div>
                  <div className="col-5"><p className="text-end text-black fw-600 fs-18">$900/year</p></div>
                </div>
                <div className="row mb-3">
                  <div className="col-12"><small className="text-black fw-300 w-100 d-block text-end">{lang('home.exchangeHub.basedOnROI') || '(based on 18% avg ROI)'}</small></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="buttons flex-column gap-3 mt-5">
                {user ? (
                  <></>
                ) : (
                  <button className="btn btn-primary-custom w-100" onClick={() => router.push('/register')}>{lang('home.exchangeHub.signUpToInvest') || 'Sign Up to Invest'}</button>
                )}
                <button className="btn btn-primary-custom transparentBtn tc-102C41 border-1 w-100">
                  <img className="me-2" src="/images/icon/reports-grey.svg" alt="arrow" onError={(e) => e.target.style.display = 'none'} />
                  {lang('home.exchangeHub.listYourProject') || 'List Your Project'}
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

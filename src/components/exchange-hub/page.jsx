'use client'


const ExchangeHub = () => {
  const [activeTab, setActiveTab] = useState('lease')
  const [projects, setProjects] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('roi')
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
    <>
      {/* Navbar */}
      <HomeNavbar />

      {/* Main Content */}
      <section className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="container-fluid px-4">
          <div className="row">
            {/* Left Side - Projects Section */}
            <div className="col-lg-9 col-12">
              {/* Search and Filter Bar */}
              <div className="bg-white rounded-3 shadow-sm p-3 mb-4">
                <div className="row align-items-center">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#dee2e6' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#6c757d" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                      </span>
                      <input 
                        type="text" 
                        className="form-control border-start-0" 
                        placeholder="Search Here..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ borderColor: '#dee2e6' }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-2 justify-content-md-end">
                      <button 
                        className="btn px-4 py-2 d-flex align-items-center" 
                        style={{ backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '6px' }}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                          <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/>
                        </svg>
                        Filter
                      </button>
                      <div className="dropdown">
                        <button 
                          className="btn px-4 py-2 d-flex align-items-center dropdown-toggle" 
                          style={{ backgroundColor: 'white', color: '#1a1a2e', border: '1px solid #1a1a2e', borderRadius: '6px' }}
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
                          </svg>
                          Sort by
                        </button>
                        <ul className="dropdown-menu">
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('roi-high') }}>ROI: High to Low</a></li>
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('roi-low') }}>ROI: Low to High</a></li>
                          <li><hr className="dropdown-divider" /></li>
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('price-low') }}>Price: Low to High</a></li>
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('price-high') }}>Price: High to Low</a></li>
                          <li><hr className="dropdown-divider" /></li>
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('capacity-high') }}>Capacity: High to Low</a></li>
                          <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('capacity-low') }}>Capacity: Low to High</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Advanced Filters</h6>
                    <button className="btn btn-sm btn-link text-decoration-none" onClick={clearFilters}>
                      Clear All
                    </button>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-600">ROI Range (%)</label>
                      <div className="d-flex gap-2">
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Min" 
                          value={filters.minROI}
                          onChange={(e) => handleFilterChange('minROI', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Max" 
                          value={filters.maxROI}
                          onChange={(e) => handleFilterChange('maxROI', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-600">Price Range ($)</label>
                      <div className="d-flex gap-2">
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Min" 
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Max" 
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-600">Capacity Range (kWp)</label>
                      <div className="d-flex gap-2">
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Min" 
                          value={filters.minCapacity}
                          onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          placeholder="Max" 
                          value={filters.maxCapacity}
                          onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      Showing {projects.length} project{projects.length !== 1 ? 's' : ''} 
                      {searchQuery && ` matching "${searchQuery}"`}
                    </small>
                  </div>
                </div>
              )}

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
                      Projects Open for Lease
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
                      Project For Resale
                    </button>
                  </li>
                </ul>
              </div>

              {/* Projects Grid */}
              <div className="tab-content">
                {loading && page === 1 ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">{lang('home.projects.noProjects') || 'No projects available'}</p>
                  </div>
                ) : (
                  <>
                    <div className="row">
                      {projects.map((project, index) => {
                        const cityName = project.city?.name || ''
                        const stateName = project.state?.name || ''
                        const location = [cityName, stateName].filter(Boolean).join(', ') || 'Location Not Available'
                        const projectImage = project.project_image || '/images/projects/project-img1.png'
                        const badgeColor = activeTab === 'lease' ? '#4CAF50' : '#FF9800'
                        const badgeText = activeTab === 'lease' ? 'For Lease' : 'For Resale'
                        
                        return (
                          <div key={project.id} className="col-12 col-md-6 col-xl-4 mb-4">
                            <div className="bg-white overflow-hidden h-100" style={{ border: '1px solid #e8e8e8', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                              {/* Project Image */}
                              <div className="position-relative">
                                <Image 
                                  src={projectImage} 
                                  alt={project.project_name} 
                                  className="img-fluid w-100" 
                                  width={400} 
                                  height={220}
                                  style={{ objectFit: 'cover', height: '220px' }}
                                  onError={(e) => {
                                    e.target.src = '/images/projects/project-img1.png'
                                  }}
                                />
                                <span 
                                  className="position-absolute px-3 py-1 text-white small fw-500"
                                  style={{ 
                                    backgroundColor: badgeColor,
                                    top: '12px',
                                    right: '12px',
                                    borderRadius: '20px',
                                    fontSize: '12px'
                                  }}
                                >
                                  {badgeText}
                                </span>
                              </div>

                              {/* Project Details */}
                              <div className="p-3">
                                {/* Title and ID */}
                                <h5 className="fw-bold mb-1" style={{ fontSize: '17px', color: '#1a1a2e' }}>{project.project_name}</h5>
                                <p className="text-muted small mb-1" style={{ fontSize: '12px' }}>ID: {project.project_code || `SE-${project.id}`}</p>
                                <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                                  Offtaker: {project.offtaker?.company_name || project.offtaker?.contact_person || 'N/A'}
                                </p>

                                {/* Stats Grid */}
                                <div className="row g-2 mb-3">
                                  <div className="col-4 text-center">
                                    <div style={{ 
                                      border: '1px solid #e8e8e8',
                                      borderRadius: '8px',
                                      padding: '12px 8px',
                                      backgroundColor: '#fafafa'
                                    }}>
                                      <h6 className="fw-bold mb-0" style={{ color: '#FFA500', fontSize: '18px' }}>
                                        {project.project_size || '0'}
                                      </h6>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>System</small>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>Size</small>
                                      <small className="d-block fw-600" style={{ fontSize: '11px', color: '#1a1a2e', marginTop: '2px' }}>kWp</small>
                                    </div>
                                  </div>
                                  <div className="col-4 text-center">
                                    <div style={{ 
                                      border: '1px solid #e8e8e8',
                                      borderRadius: '8px',
                                      padding: '12px 8px',
                                      backgroundColor: '#fafafa'
                                    }}>
                                      <h6 className="fw-bold mb-0" style={{ color: '#FFA500', fontSize: '18px' }}>
                                        {project.accumulative_generation || 'N/A'}
                                      </h6>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>Accumulative</small>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>Generation</small>
                                      <small className="d-block fw-600" style={{ fontSize: '11px', color: '#1a1a2e', marginTop: '2px' }}>kWh</small>
                                    </div>
                                  </div>
                                  <div className="col-4 text-center">
                                    <div style={{ 
                                      border: '1px solid #e8e8e8',
                                      borderRadius: '8px',
                                      padding: '12px 8px',
                                      backgroundColor: '#fafafa'
                                    }}>
                                      <h6 className="fw-bold mb-0" style={{ color: '#FFA500', fontSize: '18px' }}>
                                        {project.investor_profit || '0'}%
                                      </h6>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>&nbsp;</small>
                                      <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>&nbsp;</small>
                                      <small className="d-block fw-600" style={{ fontSize: '11px', color: '#1a1a2e', marginTop: '2px' }}>ROI</small>
                                    </div>
                                  </div>
                                </div>

                                {/* Lease Terms */}
                                <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '12px', marginBottom: '12px' }}>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <small className="text-muted" style={{ fontSize: '12px' }}>Lease Term Remaining</small>
                                    <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>{project.lease_term || '7 Years'}</small>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <small className="text-muted" style={{ fontSize: '12px' }}>Cumulative Revenue</small>
                                    <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>${project.cumulative_revenue || project.asking_price || '155,000'}</small>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted" style={{ fontSize: '12px' }}>
                                      Asking Price <span style={{ color: '#FFA500', fontWeight: '500' }}>(Negotiable)</span>
                                    </small>
                                    <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>${project.asking_price || '128,000'}</small>
                                  </div>
                                </div>

                                {/* Chart Placeholder */}
                                <div className="my-3" style={{ 
                                  height: '70px', 
                                  background: '#fafafa', 
                                  borderRadius: '8px', 
                                  display: 'flex', 
                                  alignItems: 'flex-end', 
                                  padding: '8px', 
                                  gap: '2px',
                                  border: '1px solid #f0f0f0'
                                }}>
                                  {[30, 45, 35, 50, 40, 55, 45, 60, 50, 65, 55, 70].map((height, idx) => (
                                    <div key={idx} style={{ 
                                      flex: 1, 
                                      background: 'linear-gradient(to top, #FFB84D 0%, #FFDBA3 100%)',
                                      height: `${height}%`, 
                                      borderRadius: '3px 3px 0 0'
                                    }}></div>
                                  ))}
                                </div>

                                {/* Buttons */}
                                <div className="d-flex gap-2">
                                  <button className="btn text-white fw-500 flex-fill" style={{ 
                                    backgroundColor: '#FFA500', 
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    fontSize: '14px'
                                  }}>
                                    Buy Now
                                  </button>
                                  <button className="btn flex-fill d-flex align-items-center justify-content-center" style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    fontSize: '14px',
                                    color: '#1a1a2e'
                                  }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                      <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
                                      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
                                    </svg>
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="d-block mt-4 text-center">
                        <button 
                          className="btn btn-primary px-5 py-2"
                          onClick={loadMore}
                          disabled={loading}
                          style={{ backgroundColor: '#FFA500', border: 'none' }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Loading...
                            </>
                          ) : (
                            'Load More Projects'
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
              {/* Market Summary */}
              <div className="p-4 mb-4" style={{ 
                backgroundColor: '#FFF9ED',
                borderRadius: '12px',
                border: '1px solid #FFE8C5'
              }}>
                <h5 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#1a1a2e', letterSpacing: '0.5px' }}>MARKET SUMMARY</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small style={{ fontSize: '13px', color: '#666' }}>Total Projects:</small>
                    <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>250</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small style={{ fontSize: '13px', color: '#666' }}>Total Capacity:</small>
                    <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>27,500 kWp</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small style={{ fontSize: '13px', color: '#666' }}>Average ROI:</small>
                    <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>10.8%</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small style={{ fontSize: '13px', color: '#666' }}>Active Investors:</small>
                    <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>320+</strong>
                  </div>
                </div>
              </div>

              {/* Quick Simulation */}
              <div className="p-4" style={{ 
                backgroundColor: '#FFF9ED',
                borderRadius: '12px',
                border: '1px solid #FFE8C5'
              }}>
                <h5 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#1a1a2e', letterSpacing: '0.5px' }}>QUICK SIMULATION</h5>
                <div className="mb-3">
                  <div className="mb-3">
                    <small className="d-block mb-2" style={{ fontSize: '12px', color: '#666' }}>If you invest</small>
                    <strong className="d-block" style={{ fontSize: '26px', color: '#1a1a2e' }}>$5,000 →</strong>
                  </div>
                  <div className="mb-3">
                    <small className="d-block mb-2" style={{ fontSize: '12px', color: '#666' }}>You can earn approx.</small>
                    <strong className="d-block" style={{ fontSize: '26px', color: '#1a1a2e' }}>$500/year</strong>
                    <small style={{ fontSize: '11px', color: '#999' }}>(based on 10% avg ROI)</small>
                  </div>
                </div>
                <button className="btn text-white w-100 mb-2" style={{ 
                  backgroundColor: '#FFA500', 
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Sign up to Invest
                </button>
                <button className="btn w-100 d-flex align-items-center justify-content-center" style={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
                  </svg>
                  List Your Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </>
  )
}

export default ExchangeHub
import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const SearchBar = ({ searchQuery, setSearchQuery, showFilters, setShowFilters, setSortBy }) => {
  const { lang } = useLanguage()

  return (
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
              placeholder={lang('home.exchangeHub.searchPlaceholder')}
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
              {lang('home.exchangeHub.filter')}
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
                {lang('home.exchangeHub.sortBy')}
              </button>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('roi-high') }}>{lang('home.exchangeHub.sortRoiHigh')}</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('roi-low') }}>{lang('home.exchangeHub.sortRoiLow')}</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('price-low') }}>{lang('home.exchangeHub.sortPriceLow')}</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('price-high') }}>{lang('home.exchangeHub.sortPriceHigh')}</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('capacity-high') }}>{lang('home.exchangeHub.sortCapacityHigh')}</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortBy('capacity-low') }}>{lang('home.exchangeHub.sortCapacityLow')}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchBar

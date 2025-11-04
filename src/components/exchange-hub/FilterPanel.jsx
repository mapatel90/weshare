import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const FilterPanel = ({ showFilters, filters, handleFilterChange, clearFilters, projectCount, searchQuery }) => {
  const { lang } = useLanguage()

  if (!showFilters) return null

  return (
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
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.min')}
              value={filters.minROI}
              onChange={(e) => handleFilterChange('minROI', e.target.value)}
            />
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.max')}
              value={filters.maxROI}
              onChange={(e) => handleFilterChange('maxROI', e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-600">{lang('home.exchangeHub.priceRange')}</label>
          <div className="d-flex gap-2">
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.min')}
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.max')}
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-600">{lang('home.exchangeHub.capacityRange')}</label>
          <div className="d-flex gap-2">
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.min')}
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
            />
            <input 
              type="number" 
              className="form-control form-control-sm" 
              placeholder={lang('home.exchangeHub.max')}
              value={filters.maxCapacity}
              onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <small className="text-muted">
          {lang('home.exchangeHub.showing')} {projectCount} {projectCount !== 1 ? lang('home.exchangeHub.projects') : lang('home.exchangeHub.project')}
          {searchQuery && ` ${lang('home.exchangeHub.matching')} "${searchQuery}"`}
        </small>
      </div>
    </div>
  )
}

export default FilterPanel

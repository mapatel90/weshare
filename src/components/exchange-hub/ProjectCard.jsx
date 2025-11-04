import React from 'react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

const ProjectCard = ({ project, activeTab }) => {
    console.log("Project Details:", project);
    const { lang } = useLanguage()
    const cityName = project.city?.name || ''
    const stateName = project.state?.name || ''
    const location = [cityName, stateName].filter(Boolean).join(', ') || 'Location Not Available'
    const projectImage = project.project_image || '/images/projects/project-img1.png'
    const badgeColor = activeTab === 'lease' ? '#4CAF50' : '#FF9800'
    const badgeText = activeTab === 'lease' ? lang('home.exchangeHub.forLeaseBadge') : lang('home.exchangeHub.forResaleBadge')

    return (
        <div className="col-12 col-md-6 col-xl-4 mb-4">
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
                    <h5 className="fw-bold mb-1" style={{ fontSize: '17px', color: '#1a1a2e' }}>{project?.project_name}</h5>
                    <p className="text-muted small mb-1" style={{ fontSize: '12px' }}>{lang('home.exchangeHub.id')} {project?.product_code || `SE-${project?.id}`}</p>
                    <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                        {lang('home.exchangeHub.offtaker')} {project?.offtaker?.fullName || 'N/A'}
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
                                <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>{lang('home.exchangeHub.systemSize')}</small>
                                <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>&nbsp;</small>
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
                                <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>{lang('home.exchangeHub.accumulative')}</small>
                                <small className="text-muted d-block" style={{ fontSize: '9px', lineHeight: '1.2' }}>{lang('home.exchangeHub.generation')}</small>
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
                                <small className="d-block fw-600" style={{ fontSize: '11px', color: '#1a1a2e', marginTop: '2px' }}>{lang('home.exchangeHub.roi')}</small>
                            </div>
                        </div>
                    </div>

                    {/* Lease Terms */}
                    <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '12px', marginBottom: '12px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted" style={{ fontSize: '12px' }}>{lang('home.exchangeHub.leaseTermRemaining')}</small>
                            <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>  {project?.lease_term ? `${project.lease_term} ${lang('home.exchangeHub.years')}` : `7 ${lang('home.exchangeHub.years')}`}</small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted" style={{ fontSize: '12px' }}>{lang('home.exchangeHub.cumulativeRevenue')}</small>
                            <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>${project?.cumulative_revenue || project?.asking_price || '155,000'}</small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted" style={{ fontSize: '12px' }}>
                                {lang('home.exchangeHub.askingPrice')} <span style={{ color: '#FFA500', fontWeight: '500' }}>({lang('home.exchangeHub.negotiable')})</span>
                            </small>
                            <small className="fw-600" style={{ fontSize: '12px', color: '#1a1a2e' }}>${project?.asking_price || '128,000'}</small>
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
                            {lang('home.exchangeHub.buyNow')}
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
                                <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z" />
                                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1" />
                            </svg>
                            {lang('home.exchangeHub.viewDetails')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectCard

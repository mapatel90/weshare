import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import './styles/exchange-hub-custom.css'

const ProjectCard = ({ project, activeTab }) => {
    const { lang } = useLanguage()
    const router = useRouter()

    // Safety check
    if (!project) {
        console.error('ProjectCard: No project data provided')
        return null
    }

    // Determine reliability badge based on ROI
    const getReliabilityBadge = () => {
        const roi = parseFloat(project.investor_profit || 0)
        if (roi >= 12) return {
            text: lang('home.exchangeHub.highReliability') || 'High Reliability',
            icon: '🟢',
            class: 'badge-high'
        }
        if (roi >= 8) return {
            text: lang('home.exchangeHub.moderateReliability') || 'Moderate Reliability',
            icon: '🟡',
            class: 'badge-moderate'
        }
        return {
            text: lang('home.exchangeHub.premiumReliability') || 'Premium Reliability',
            icon: '🔵',
            class: 'badge-premium'
        }
    }

    const badge = getReliabilityBadge()

    // Format numbers
    const formatNumber = (num) => {
        if (!num) return '0'
        return parseFloat(num).toLocaleString('en-US')
    }

    // Calculate accumulative generation with fallback
    const accumulative = project.accumulative_generation ||
        (parseFloat(project.project_size || 0) * 1500).toFixed(0)

    // Debug log
    console.log('ProjectCard rendering:', {
        id: project?.id,
        name: project?.project_name,
        size: project?.project_size
    })

    return (
        <div className="col-12 col-md-6 col-lg-6 mb-4" data-aos="fade-up" data-aos-easing="linear" data-aos-duration="1000">
            <div className="solar-card">
                {/* Card Header - Title & Badge */}
                <div className="card-header">
                    <h3>{project?.project_name || 'Solar Project'}</h3>
                    <span className={`badge ${badge.class}`}>
                        <span className="badge-icon">{badge.icon}</span>
                        {badge.text}
                    </span>
                </div>

                {/* ID */}
                <p className="id">ID: {project?.product_code || project?.project_code || `SE-${project?.id}`}</p>

                {/* Offtaker */}
                <p className="offtaker">
                    {lang('home.exchangeHub.offtaker') || 'Offtaker'}: {project?.offtaker?.fullName || project?.offtaker?.company_name || 'Greenfield Academy'}
                </p>

                {/* Stats - 3 Columns */}
                <div className="stats">
                    <div className="stat">
                        <h4>{formatNumber(project.project_size || 1200)} kWp</h4>
                        <p>{lang('home.exchangeHub.systemSize') || 'System Size'}</p>
                    </div>
                    <div className="stat">
                        <h4 className="text-secondary-color">
                            {formatNumber(accumulative)} kWh
                        </h4>
                        <p>{lang('home.exchangeHub.accumulativeGeneration') || 'Accumulative'}<br />{lang('home.exchangeHub.generation') || 'Generation'}</p>
                    </div>
                    <div className="stat">
                        <h4 className="text-secondary-color">{project.investor_profit || '11.2'}%</h4>
                        <p>{lang('home.exchangeHub.roi') || 'ROI'}</p>
                    </div>
                </div>

                {/* Details Section - Gray Background */}
                <div className="details">
                    <p>
                        <span>{lang('home.exchangeHub.leaseTermRemaining') || 'Lease Term Remaining'}</span>
                        <span className="fw-600 text-black">
                            {project?.lease_term || '7'} {lang('home.exchangeHub.years') || 'Years'}
                        </span>
                    </p>
                    <p>
                        <span>{lang('home.exchangeHub.cumulativeRevenue') || 'Cumulative Revenue'}</span>
                        <span className="fw-500 text-black">
                            ${formatNumber(project?.cumulative_revenue || '155000')}
                        </span>
                    </p>
                    <p>
                        <span>
                            {lang('home.exchangeHub.askingPrice') || 'Asking Price'}
                            <span className="text-secondary-color fw-300"> ({project?.price_type || lang('home.exchangeHub.negotiable') || 'negotiable'})</span>
                        </span>
                        <span className="fw-500 text-black">
                            ${formatNumber(project?.asking_price || '128000')}
                        </span>
                    </p>
                </div>

                {/* Chart - Line Graph */}
                <div className="chart">
                    <svg width="100%" height="80" viewBox="0 0 350 80" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={`gradient-${project.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#FFB84D" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#FFB84D" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>
                        {/* Line path */}
                        <path
                            d="M 0,60 Q 50,50 80,45 T 130,35 Q 160,30 190,25 T 250,20 Q 280,22 310,18 T 350,15"
                            fill="none"
                            stroke="#F6A623"
                            strokeWidth="2"
                        />
                        {/* Area under line */}
                        <path
                            d="M 0,60 Q 50,50 80,45 T 130,35 Q 160,30 190,25 T 250,20 Q 280,22 310,18 T 350,15 L 350,80 L 0,80 Z"
                            fill={`url(#gradient-${project.id})`}
                        />
                    </svg>
                </div>

                {/* Action Buttons */}
                <div className="buttons">
                    <button className="btn btn-primary-custom">
                        {lang('home.exchangeHub.buyNow') || 'Buy Now'}
                    </button>
                    <button 
                        className="btn btn-secondary-custom"
                        onClick={() => router.push(`/exchange-hub/${project.id}`)}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z" />
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1" />
                        </svg>
                        {lang('home.exchangeHub.viewDetails') || 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProjectCard

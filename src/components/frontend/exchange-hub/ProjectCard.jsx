'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import './styles/exchange-hub-custom.css'
import './styles/responsive.css'
import { getFullImageUrl } from '@/utils/common'
import { getPrimaryProjectImage } from '@/utils/projectUtils'
import { useDropzone } from 'react-dropzone'

const ProjectCard = ({ project, activeTab }) => {
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
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

    const getDefaultImageUrl = () => {
        if (preview) return preview;
        const cover = getPrimaryProjectImage(project);
        return cover ? getFullImageUrl(cover) : '/images/general/solar-card.jpg';
    }

    // Dropzone logic
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            // TODO: Upload file to backend here, set uploading true while uploading
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/*' });

    // Different card design for lease vs resale
    if (activeTab === 'lease') {
        // LEASE CARD - With Image (Figma Style)
        return (
            <div className="col-12 col-md-12 col-lg-6 mb-3" data-aos="fade-up" data-aos-easing="linear" data-aos-duration="1000">
                <div className="solar-card-with-image">
                    {/* Dropzone for image upload */}
                    <div {...getRootProps()} className="dropzone" style={{ border: '2px dashed #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer', textAlign: 'center' }}>
                        <input {...getInputProps()} />
                        {isDragActive ? (
                            <p>Drop the image here ...</p>
                        ) : (
                            <p>Drag & drop image here, or click to select</p>
                        )}
                        {uploading && <p>Uploading...</p>}
                    </div>
                    {/* Solar Panel Image */}
                    <div className="card-image-container">
                        <img
                            src={getLeaseCardImageSrc()}
                            alt={project?.project_name || 'Solar Project'}
                            width={500}
                            height={250}
                            className="card-image"
                            loading="lazy"
                            onError={(event) => {
                                event.currentTarget.onerror = null
                                event.currentTarget.src = '/images/general/solar-card.jpg'
                            }}
                        />
                        {/* Reliability Badge */}
                        <div className={`upcoming-badge ${badge.class}`} style={{ backgroundColor: '#FFF3DF', margin: '2%' }}>
                            {/* <span className="badge-icon">{badge.icon}</span> */}
                            {/* {badge.text} */}
                            Upcoming
                        </div>
                    </div>
                    {/* ...existing code... */}
                    <div className="card-content-with-image">
                        {/* ...existing code... */}
                        <div className="card-header-image">
                            <h3 style={{
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                minHeight: '65px',
                                lineHeight: '1.4',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                wordBreak: 'break-word'
                            }}>{project?.project_name || 'Solar Farm A'}</h3>
                            <div className="rating">
                                <span className="text-rating">{lang('home.exchangeHub.ratings') || 'Ratings'}:</span>
                                <div className="stars">
                                    {'⭐'.repeat(4)}{'☆'.repeat(1)}
                                </div>
                            </div>
                        </div>
                        {/* ...existing code... */}
                        <p className="id-image">
                            ID: {project?.product_code || project?.project_code || `PJT-${project?.id || '238'}`}
                        </p>
                        {/* ...existing code... */}
                        <p className="offtaker-image">
                            {lang('home.exchangeHub.offtaker') || 'Offtaker'}: {project?.offtaker?.fullName || project?.offtaker?.company_name || 'Greenfield Academy'}
                        </p>
                        {/* ...existing code... */}
                        <div className="stats-image">
                            <div className="stat-image">
                                <h4>${formatNumber(project.asking_price || project.target_investment || 1450000)}</h4>
                                <p>{lang('home.exchangeHub.targetInvestment') || 'Target Investment'}</p>
                            </div>
                            <div className="stat-image">
                                <h4 className="text-secondary-color">
                                    {formatNumber(accumulative || (parseFloat(project.project_size || 1800) * 1000))} kWh/year
                                </h4>
                                <p>{lang('home.exchangeHub.expectedGeneration') || 'Expected Generation'}</p>
                            </div>
                            <div className="stat-image">
                                <h4 className="text-secondary-color">{project.investor_profit || '20'}%</h4>
                                <p>{lang('home.exchangeHub.expectedROI') || 'Expected ROI'}</p>
                            </div>
                        </div>
                        {/* ...existing code... */}
                        <div className="details-row-image">
                            <div className="detail-item">
                                <span className="label">{lang('home.exchangeHub.paybackPeriod') || 'Payback Period'}</span>
                                <span className="value">{project?.payback_period || '8'} {lang('home.exchangeHub.years') || 'years'}</span>
                            </div>
                            <div className="detail-divider"></div>
                            <div className="detail-item">
                                <span className="label">{lang('home.exchangeHub.leaseTerm') || 'Lease Term'}</span>
                                <span className="value">{project?.lease_term || '15'} {lang('home.exchangeHub.years') || 'years'}</span>
                            </div>
                        </div>
                        {/* ...existing code... */}
                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-label">
                                    {lang('home.exchangeHub.fundProgress') || 'Fund Progress'}: <strong className="text-secondary-color">{project?.fund_progress || '45'}%</strong>
                                </span>
                                <span className="time-left">
                                    {lang('home.exchangeHub.timeLeft') || 'Time left'}: {project?.time_left || '3 Month'}
                                </span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${project?.fund_progress || 45}%` }}
                                ></div>
                            </div>
                        </div>
                        {/* ...existing code... */}
                        <p className="note-text">
                            {lang('home.exchangeHub.assumptionNote') || 'Note: This is an Assumption data*'}
                        </p>
                        {/* ...existing code... */}
                        <div className="buttons-image">
                            <button className="btn btn-primary-custom" style={{ padding: '14px 0px' }}>
                                {lang('home.exchangeHub.investEarly') || 'Invest Early'}
                            </button>
                            <button
                                className="btn btn-secondary-custom"
                                onClick={() => router.push(`/frontend/exchange-hub/${project.project_slug}`)}
                                style={{ padding: '14px 0px' }}
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
            </div>
        )
    }

    // RESALE CARD - Without Image (Original Design)
    return (
        <div className="col-12 col-md-12 col-lg-6 mb-4" data-aos="fade-up" data-aos-easing="linear" data-aos-duration="1000">
            <div className="solar-card">
                {/* Card Header - Title & Badge */}
                <div className="card-header">
                    <h3 style={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textOverflow: 'ellipsis',
                        minHeight: '60px',
                        lineHeight: '1.4',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        wordBreak: 'break-word'
                    }}>{project?.project_name || 'Solar Project'}</h3>
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
                        onClick={() => router.push(`/frontend/exchange-hub/${project.project_slug}`)}
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

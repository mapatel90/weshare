'use client'

import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet } from '@/lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './styles/exchange-hub-custom.css'

const ProjectDetail = ({ projectId }) => {
    const { lang } = useLanguage()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'linear'
        })
    }, [])

    useEffect(() => {
        if (projectId) {
            fetchProjectDetail()
        }
    }, [projectId])

    const fetchProjectDetail = async () => {
        try {
            setLoading(true)
            console.log('Fetching project:', projectId)
            const response = await apiGet(`/api/projects/${projectId}`, { 
                showLoader: false,
                includeAuth: false 
            })
            
            console.log('API Response:', response)
            
            if (response.success && response.data) {
                setProject(response.data)
            } else {
                console.error('Project not found or invalid response:', response)
            }
        } catch (error) {
            console.error('Error fetching project details:', error)
        } finally {
            setLoading(false)
        }
    }

    // Format numbers
    const formatNumber = (num) => {
        if (!num) return '0'
        return parseFloat(num).toLocaleString('en-US')
    }

    // Determine reliability badge based on ROI
    const getReliabilityBadge = () => {
        if (!project) return { text: 'Loading...', icon: '⚪', class: 'badge-moderate' }
        
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

    if (loading) {
        return (
            <section className="main-contentBox Exchange-page mb-80">
                <div className="container">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (!project) {
        return (
            <section className="main-contentBox Exchange-page mb-80">
                <div className="container">
                    <div className="text-center py-5">
                        <h3 className="text-muted mb-3">Project not found</h3>
                        <p className="text-muted">
                            The project you're looking for (ID: {projectId}) doesn't exist or is not available.
                        </p>
                        <a href="/exchange-hub" className="btn btn-primary-custom mt-3">
                            Back to Exchange Hub
                        </a>
                    </div>
                </div>
            </section>
        )
    }

    const badge = getReliabilityBadge()
    const accumulative = project.accumulative_generation || 
        (parseFloat(project.project_size || 0) * 1500).toFixed(0)

    return (
        <main>
            <section className="main-contentBox Exchange-page mb-80">
                <div className="container">
                    <div className="sectionWraper">
                        {/* Left Section */}
                        <div className="left-card">
                            {/* Image Box */}
                            <div className="imageBox">
                                <img 
                                    src={project.banner_image || "/images/projects/default-project.jpg"} 
                                    alt={project.project_name} 
                                    className="main-img"
                                    onError={(e) => { e.target.src = "/images/projects/default-project.jpg" }}
                                />
                                <span className={`badge imageTag ${badge.class}`}>
                                    <img className="ms-1" src="/img/Check-prem.svg" alt="check" onError={(e) => e.target.style.display = 'none'} /> 
                                    {badge.text}
                                </span>
                            </div>

                            {/* Header */}
                            <div className="inner-header">
                                <div className="title d-flex gap-3">
                                    <h2 className="mb-0">{project.project_name}<span className="ms-1">|</span></h2>
                                    <p>ID: {project.product_code || project.project_code || `SE-${project.id}`}</p>
                                </div>
                                <span>
                                    <img src="/img/Location-1.png" className="me-2" alt="" onError={(e) => e.target.style.display = 'none'} />
                                    {project.city?.name || project.location}, {project.state?.name || project.state_name}
                                </span>
                            </div>

                            {/* Project Overview */}
                            <div className="overview">
                                <h3>{lang('home.exchangeHub.projectOverview') || 'Project Overview'}:</h3>
                                <p>
                                    {project.description || `This ${formatNumber(project.project_size)} kWp solar power project stands as a reliable and high-performing renewable energy asset, generating approximately ${formatNumber(accumulative)} kWh annually. With a strong ROI of ${project.investor_profit}% and ${project.lease_term || 'several'} years remaining on its lease term, it continues to deliver consistent financial returns while supporting clean energy adoption. Backed by a trusted offtaker ${project.offtaker?.company_name || project.offtaker?.fullName || ''}, the project ensures steady revenue flow and long-term stability.`}
                                </p>
                            </div>

                            {/* Stats View */}
                            <div className="stats-view">
                                <div className="leftStatsBox">
                                    <div>
                                        <p>{lang('home.exchangeHub.installedCapacity') || 'Installed Capacity'}:</p>
                                        <h4>{formatNumber(project.project_size)} kWp</h4>
                                    </div>
                                    <div>
                                        <p>{lang('home.exchangeHub.roi') || 'ROI'}:</p>
                                        <h4>{project.investor_profit || '0'}%</h4>
                                    </div>
                                    <div>
                                        <p>{lang('home.exchangeHub.cumulativeRevenue') || 'Cumulative Revenue'}:</p>
                                        <h4>${formatNumber(project.cumulative_revenue || '0')}</h4>
                                    </div>
                                </div>
                                <div className="rightStatsBox">
                                    <div>
                                        <p>{lang('home.exchangeHub.annualGeneration') || 'Annual Generation'}:</p>
                                        <h4>{formatNumber(accumulative)} kWh</h4>
                                    </div>
                                    <div>
                                        <p>{lang('home.exchangeHub.leaseTermRemaining') || 'Lease Term Remaining'}:</p>
                                        <h4>{project.lease_term || '0'} {lang('home.exchangeHub.years') || 'Years'}</h4>
                                    </div>
                                    <div>
                                        <p>{lang('home.exchangeHub.askingPrice') || 'Asking Price'}:</p>
                                        <h4>
                                            ${formatNumber(project.asking_price || '0')} 
                                            <span> ({project.price_type || lang('home.exchangeHub.negotiable') || 'Negotiable'})</span>
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* Analytics */}
                            <div className="analytics">
                                <h3>{lang('home.exchangeHub.analytics') || 'Analytics'}:</h3>
                                <p>KWh & Revenue</p>
                                <div className="chart-placeholder">
                                    <img src="/img/Chart-bar.png" alt="bar chart" onError={(e) => e.target.style.display = 'none'} />
                                </div>

                                <p>ROI Trend</p>
                                <div className="chart-placeholder">
                                    <img src="/img/Chart-line.png" alt="line chart" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            </div>

                            {/* Index Section */}
                            <div className="indexSection">
                                <div className="indexBox">
                                    <h4 className="fs-24 fw-600 text-black">
                                        {lang('home.exchangeHub.offtakerReliability') || 'Offtaker Reliability Index'}
                                    </h4>
                                    <img src="/img/chart-semicircle.png" alt="" onError={(e) => e.target.style.display = 'none'} />
                                    <div className="values">
                                        {project.offtaker_reliability_score || '92'}%
                                    </div>
                                    <p>{badge.text}</p>
                                </div>
                                
                                <div className="ownership-section">
                                    <h4>{lang('home.exchangeHub.transactionHistory') || 'Transaction & Ownership History'}</h4>
                                    {project.ownership_history ? (
                                        JSON.parse(project.ownership_history).map((item, index) => (
                                            <div className="row mb-2" key={index}>
                                                <div className="col-3"><p className="fw-600 text-secondary-color">{item.year}</p></div>
                                                <div className="col-9"><p className="text-black fw-500">{item.event}</p></div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="row mb-2">
                                                <div className="col-3"><p className="fw-600 text-secondary-color">2019</p></div>
                                                <div className="col-9"><p className="text-black fw-500">Initial Investment</p></div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-3"><p className="fw-600 text-secondary-color">2024</p></div>
                                                <div className="col-9"><p className="text-black fw-500">Listed for Resale</p></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="right-card border-0">
                            {/* Investor Box */}
                            <div className="investor-box">
                                <h3>{lang('home.exchangeHub.seekingInvestor') || 'Seeking Investor'}</h3>
                                <div className="middileContend">
                                    <p className="mb-0 text-secondary-color">
                                        {lang('home.exchangeHub.targetInvestment') || 'Target Investment'}
                                    </p>
                                    <h2>${formatNumber(project.asking_price || '0')}</h2>
                                </div>
                                <button className="btn btn-primary-custom">
                                    {lang('home.exchangeHub.investNow') || 'Invest Now'}
                                </button>
                            </div>

                            {/* Testimonials */}
                            <div className="testimonial-rightBox">
                                <h3>{lang('home.exchangeHub.testimonials') || 'Offtaker & Investor Testimonials'}</h3>

                                {/* Offtaker Testimonial */}
                                <div className="testi-card">
                                    <img 
                                        src={project.offtaker?.profile_image || "/img/test-img1.png"} 
                                        alt="testimonial" 
                                        onError={(e) => { e.target.src = "/img/test-img1.png" }}
                                    />
                                    <h4>{project.offtaker?.company_name || project.offtaker?.fullName || 'Greenfield Holdings'}</h4>
                                    <div className="designation">{lang('home.exchangeHub.offtaker') || 'Offtaker'}</div>
                                    <p>
                                        "Partnering with this solar project has significantly reduced our energy expenses while ensuring a stable and eco-friendly power supply. The system's consistent performance has made it a dependable asset for our operations."
                                    </p>
                                </div>

                                {/* Investor Testimonials */}
                                <div className="testi-card">
                                    <img src="/img/test-img.png" alt="testimonial" onError={(e) => { e.target.src = "/img/test-img1.png" }} />
                                    <h4>Sarah Johnson</h4>
                                    <div className="designation">{lang('home.exchangeHub.investor') || 'Investor'}</div>
                                    <p>
                                        "Investing in this project has been a rewarding decision. The ROI has steadily improved each year, and the transparency in performance tracking gives me complete confidence in the asset's long-term value."
                                    </p>
                                </div>

                                <div className="testi-card">
                                    <img src="/img/test-img1.png" alt="testimonial" onError={(e) => { e.target.src = "/img/test-img.png" }} />
                                    <h4>Cameron Williamson</h4>
                                    <div className="designation">{lang('home.exchangeHub.investor') || 'Investor'}</div>
                                    <p>
                                        "This solar project offers excellent returns with minimal risk. The professional management and reliable offtaker make it a standout investment in my renewable energy portfolio."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default ProjectDetail

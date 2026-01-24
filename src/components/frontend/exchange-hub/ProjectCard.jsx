import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import './styles/exchange-hub-custom.css'
import './styles/responsive.css'
import { formatEnergyUnit, formatShort, getFullImageUrl, getTimeLeft } from '@/utils/common'
import { getPrimaryProjectImage } from '@/utils/projectUtils'
import { PROJECT_STATUS } from '@/constants/project_status'
import { useAuth } from '@/contexts/AuthContext'
import InvestDialog from './InvestDialog'
import { apiPost } from '@/lib/api'
import { showSuccessToast } from '@/utils/topTost'


const ProjectCard = ({ project, activeTab }) => {
    const { lang } = useLanguage()
    const router = useRouter()
    const { user, logout, loading: authLoading } = useAuth()
    // Added missing states for invest modal & form
    const [showInvestModal, setShowInvestModal] = useState(false);
    const [investFullName, setInvestFullName] = useState("");
    const [investEmail, setInvestEmail] = useState("");
    const [investPhone, setInvestPhone] = useState("");
    const [investNotes, setInvestNotes] = useState("");
    const [submittingInvest, setSubmittingInvest] = useState(false);

    // Safety check
    if (!project) {
        console.error('ProjectCard: No project data provided')
        return null
    }

    const hasAlreadyInvested = project?.interested_investors?.some(
        (investor) => investor?.user_id === user?.id
    );

    // Determine reliability badge based on ROI
    const getReliabilityBadge = () => {
        const status = project?.project_status_id;

        if (status === PROJECT_STATUS.UPCOMING) {
            return {
                text: lang('project_status.upcoming') || 'Upcoming',
                icon: '🟡',
                class: 'badge-upcoming'
            };
        }

        if (status === PROJECT_STATUS.RUNNING) {
            return {
                text: lang('project_status.running') || 'Running',
                icon: '🟢',
                class: 'badge-running'
            };
        }

        if (status === PROJECT_STATUS.PENDING) {
            return {
                text: lang('project_status.pending') || 'Pending',
                icon: '🔵',
                class: 'badge-pending'
            };
        }

        return {
            text: 'Unknown',
            icon: '⚪',
            class: 'badge-default'
        };
    }

    const badge = getReliabilityBadge()

    // Format numbers
    const formatNumber = (num) => {
        if (!num) return '0'
        return parseFloat(num).toLocaleString('en-US')
    }

    // Calculate accumulative generation with fallback
    const accumulative = formatEnergyUnit(project.project_size) || 0

    const getDefaultImageUrl = () => {
        const cover = getPrimaryProjectImage(project)
        if (!cover) return getFullImageUrl('/uploads/general/noimage_2.png')
        return getFullImageUrl(cover) || getFullImageUrl('/uploads/general/noimage_2.png')
    }

    // Populate form when modal opens or when user changes
    useEffect(() => {
        if (!showInvestModal || !user) return;

        const fullName =
            user.full_name ||
            user.fullName ||
            user.name ||
            (user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : "") ||
            "";

        setInvestFullName(fullName);
        setInvestEmail(user.email || user.userEmail || "");
        setInvestPhone(user.phone || user.mobile || user.contact_number || "");
        setInvestNotes(""); // leave empty by default
    }, [showInvestModal, user]);

    const handleInvestClick = () => {
        setShowInvestModal(true);
    };

    const closeInvestModal = () => {
        if (submittingInvest) return;
        setShowInvestModal(false);
    };

    const handleInvestSubmit = async (e) => {
        e.preventDefault();
        if (!project) return;
        setSubmittingInvest(true);
        try {
            const payload = {
                projectId: project.id,
                userId: user?.id ?? null,
                fullName: investFullName,
                email: investEmail,
                phoneNumber: investPhone,
                notes: investNotes,
                created_by: user?.id,
            };

            const res = await apiPost("/api/investors", payload);

            if (res && res.success) {
                showSuccessToast("Investment intent submitted successfully");
                router.refresh();
                setShowInvestModal(false);
            } else {
                throw new Error(res?.message || "Submission failed");
            }

            setSubmittingInvest(false);
        } catch (err) {
            console.error("Error submitting investment:", err);
            setSubmittingInvest(false);
        }
    };

    // Different card design for lease vs resale
    if (activeTab === 'lease') {
        // LEASE CARD - With Image (Figma Style)
        return (
            <div className="col-12 col-md-12 col-lg-6 mb-3" data-aos="fade-up" data-aos-easing="linear" data-aos-duration="1000">
                <div className="solar-card-with-image">
                    {/* Solar Panel Image */}
                    <div className="card-image-container">
                        <Image
                            src={getDefaultImageUrl()}
                            alt={project?.project_name || 'Solar Project'}
                            width={500}
                            height={250}
                            className="card-image"
                        />
                        {/* Reliability Badge */}
                        <div className={`upcoming-badge ${badge.class}`} style={{ backgroundColor: '#FFF3DF', margin: '2%' }}>
                            <span className="badge-icon">{badge.icon}</span>
                            {badge.text}
                            {/* Upcoming */}
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-content-with-image">
                        {/* Title and Rating */}
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

                        {/* ID */}
                        <p className="id-image">
                            ID: {project?.product_code || project?.project_code || `PJT-${project?.id || '238'}`}
                        </p>

                        {/* Offtaker */}
                        <p className="offtaker-image">
                            {lang('home.exchangeHub.offtaker') || 'Offtaker'}: {project?.offtaker?.full_name || project?.offtaker?.company_name || 'Greenfield Academy'}
                        </p>

                        {/* Stats - 3 Columns */}
                        <div className="stats-image">
                            <div className="stat-image">
                                <h4>{formatShort(project.asking_price || project.target_investment || 1450000).toLocaleString()}</h4>
                                <p>{lang('home.exchangeHub.targetInvestment') || 'Target Investment'}</p>
                            </div>
                            <div className="stat-image">
                                <h4 className="text-secondary-color">
                                    {accumulative ? accumulative : project?.project_size}
                                </h4>
                                <p>{lang('home.exchangeHub.expectedGeneration') || 'Expected Generation'}</p>
                            </div>
                            <div className="stat-image">
                                <h4 className="text-secondary-color">{project.investor_profit || '20'}%</h4>
                                <p>{lang('home.exchangeHub.expectedROI') || 'Expected ROI'}</p>
                            </div>
                        </div>

                        {/* Additional Details */}
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

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-label">
                                    {lang('home.exchangeHub.fundProgress') || 'Fund Progress'}: <strong className="text-secondary-color">{project?.fund_progress || '45'}%</strong>
                                </span>
                                <span className="time-left">
                                    {lang('home.exchangeHub.timeLeft') || 'Time left'}: {getTimeLeft(project?.project_close_date)}
                                </span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${project?.fund_progress || 45}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Note */}
                        <p className="note-text">
                            {lang('home.exchangeHub.assumptionNote') || 'Note: This is an Assumption data*'}
                        </p>

                        {/* Action Buttons */}
                        <div className="buttons-image">
                            {project?.project_status_id === PROJECT_STATUS.UPCOMING && !hasAlreadyInvested && getTimeLeft(project?.project_close_date) !== 'Expired' ? (
                                <button className="btn btn-primary-custom" style={{ padding: '14px 0px' }} onClick={handleInvestClick}>
                                    {lang('home.exchangeHub.investEarly') || 'Invest Early'}
                                </button>
                            ) : null}
                            {/* Invest Dialog */}
                            <InvestDialog
                                open={!!showInvestModal}
                                onClose={closeInvestModal}
                                lang={lang}
                                submitting={submittingInvest}
                                fullName={investFullName}
                                setFullName={setInvestFullName}
                                email={investEmail}
                                setEmail={setInvestEmail}
                                phone={investPhone}
                                setPhone={setInvestPhone}
                                notes={investNotes}
                                setNotes={setInvestNotes}
                                onSubmit={handleInvestSubmit}
                            />

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
                    {lang('home.exchangeHub.offtaker') || 'Offtaker'}: {project?.offtaker?.full_name || project?.offtaker?.company_name || 'Greenfield Academy'}
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

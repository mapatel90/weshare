'use client'

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet } from '@/lib/api';

// React Icons
import { FiUsers, FiCpu } from "react-icons/fi";
import { MdSolarPower, MdDocumentScanner, MdVerifiedUser, MdTrendingUp } from "react-icons/md";
import usePermissions from '@/hooks/usePermissions';


const StatsCardOverview = () => {
    const { lang } = useLanguage();
    const { canView } = usePermissions();
    const statsConfig = [
        ...(canView("projects") ? [{ key: 'projects', title: lang('navigation.projects', 'Projects'), icon: <MdSolarPower size={26} /> }] : []),
        ...(canView("users") ? [{ key: 'users', title: lang('navigation.users', 'Users'), icon: <FiUsers size={26} /> }] : []),
        ...(canView("project_inverters") ? [{ key: 'project_inverters', title: lang('inverter.project_inverter', 'Project Inverters'), icon: <FiCpu size={26} /> }] : []),
        ...(canView("contracts") ? [{ key: 'contracts', title: lang('offtaker_login.sidebar.contracts', 'Contracts'), icon: <MdDocumentScanner size={26} /> }] : []),
        ...(canView("lease_requests") ? [{ key: 'lease_request', title: lang('leaseRequest.title', 'Lease Requests'), icon: <MdVerifiedUser size={26} /> }] : []),
        ...(canView("interested_investors") ? [{ key: 'interested_investors', title: lang('home.exchangeHub.investor'), icon: <MdTrendingUp size={26} /> }] : []),
    ];
    const [stats, setStats] = useState({
        projects: 0,
        users: 0,
        project_inverters: 0,
        contracts: 0,
        lease_request: 0,
        interested_investors: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiGet('/api/dashboard/statscount');
                if (res.data) setStats(res.data);
                else setError('Failed to fetch stats');
            } catch (err) {
                setError('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="col-12">
            <div className="card stretch stretch-full">
                <div className="card-body">

                    {/* Header */}
                    <div className="hstack justify-content-between mb-4">
                        <div>
                            <h5 className="mb-1">
                                {lang('header.statsOverview', 'Stats Overview')}
                            </h5>
                            <span className="fs-12 text-muted">
                                {lang('header.statsDescription', 'Overview of stats')}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="row">
                        {loading ? (
                            <div className="text-center py-5">Loading...</div>
                        ) : error ? (
                            <div className="text-danger text-center py-5">{error}</div>
                        ) : (
                            statsConfig.map(({ key, title, icon }, index) => {
                                const colors = [
                                    'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                                    'linear-gradient(to bottom right, #10b981, #059669)',
                                    'linear-gradient(to bottom right, #8b5cf6, #7c3aed)',
                                    'linear-gradient(to bottom right, #f59e0b, #d97706)',
                                    'linear-gradient(to bottom right, #ec4899, #db2777)',
                                    'linear-gradient(to bottom right, #06b6d4, #0891b2)'
                                ];
                                return (
                                    <div key={key} className="col-xxl-2 col-lg-4 col-md-6">
                                        <div
                                            className="card"
                                            style={{
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                                padding: "16px",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                                transition: "all 0.25s ease",
                                                background: "#ffffff",
                                                cursor: "pointer",
                                                minHeight: "130px",
                                                display: "flex",
                                                flexDirection: "column"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-4px)";
                                                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)";
                                                e.currentTarget.style.borderColor = "#d1d5db";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0px)";
                                                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                                                e.currentTarget.style.borderColor = "#e5e7eb";
                                            }}
                                        >
                                            {/* Icon + Title in one line */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    marginBottom: "12px"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: "6px",
                                                        borderRadius: "6px",
                                                        background: colors[index % colors.length],
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                        fontSize: "16px",
                                                        color: "#fff"
                                                    }}
                                                >
                                                    {React.cloneElement(icon, { size: 16 })}
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#6b7280",
                                                        fontWeight: "500",
                                                        margin: 0,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis"
                                                    }}
                                                >
                                                    {title}
                                                </p>
                                            </div>

                                            {/* Number/Value */}
                                            <div
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "700",
                                                    marginBottom: "8px",
                                                    lineHeight: "1.2"
                                                }}
                                            >
                                                {stats[key]}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCardOverview;

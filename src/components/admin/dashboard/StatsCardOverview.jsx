'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet } from '@/lib/api';


const statsConfig = [
    { key: 'projects', title: 'Projects', color: 'primary', icon: 'bi bi-kanban' },
    { key: 'users', title: 'Users', color: 'success', icon: 'bi bi-people' },
    { key: 'inverters', title: 'Inverters', color: 'warning', icon: 'bi bi-cpu' },
    { key: 'contracts', title: 'Contracts', color: 'info', icon: 'bi bi-file-earmark-text' },
    { key: 'lease_request', title: 'Lease Requests', color: 'secondary', icon: 'bi bi-file-earmark-text' },
    { key: 'interested_investors', title: 'Interested Investors', color: 'danger', icon: 'bi bi-people-fill' },
];

const StatsCardOverview = () => {
    const { lang } = useLanguage();
    const [stats, setStats] = useState({ projects: 0, users: 0, inverters: 0, contracts: 0, lease_request: 0, interested_investors: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiGet('/api/dashboard/statscount');
                if (res.data) {
                    setStats(res.data);
                } else {
                    setError('Failed to fetch stats');
                }
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
                    <div className="hstack justify-content-between mb-4 pb-">
                        <div>
                            <h5 className="mb-1">{lang('dashboard.statsOverview', 'Stats Overview')}</h5>
                            <span className="fs-12 text-muted">{lang('dashboard.statsDescription', 'Overview of stats')}</span>
                        </div>
                        {/* <Link href="#" className="btn btn-light-brand">{lang('common.viewAll', 'View All')}</Link> */}
                    </div>
                    <div className="row">
                        {loading ? (
                            <div className="text-center py-5">Loading...</div>
                        ) : error ? (
                            <div className="text-danger text-center py-5">{error}</div>
                        ) : (
                            statsConfig.map(({ key, title, color, icon }) => (
                                <div key={key} className="col-xxl-2 col-lg-4 col-md-6 email-overview-card">
                                    <div className="card stretch stretch-full border border-dashed border-gray-5">
                                        <div className="card-body rounded-3 text-center">
                                            <i className={`fs-3 text-${color} ${icon}`}></i>
                                            <div className="fs-4 fw-bolder text-dark mt-3 mb-1">{stats[key]}</div>
                                            <p className="fs-12 fw-medium text-muted text-spacing-1 mb-0 text-truncate-1-line">{title}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCardOverview
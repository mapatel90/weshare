'use client';
import React from 'react';
import '../../../assets/portal/offtaker.css';
import ProjectsTable from './sections/ProjectsTable';
import OverViewCards from './sections/OverViewCards';
import BillingCard from './sections/BillingCard';
import DocumentsCard from './sections/DocumentsCard';
import KriLineChart from './sections/KriLineChart';
import PayoutCard from './sections/PayoutCard';

function DashboardView() {
    const [showProjectsDropdown, setShowProjectsDropdown] = React.useState(false);
    const [showInverterDropdown, setShowInverterDropdown] = React.useState(false);

    // Optional: Close dropdown when clicking outside
    React.useEffect(() => {
        function handleClick(e) {
            const projectsBtn = document.getElementById('projects-dropdown-btn');
            const inverterBtn = document.getElementById('inverter-dropdown-btn');
            const projectsDropdown = document.getElementById('projects-dropdown-menu');
            const inverterDropdown = document.getElementById('inverter-dropdown-menu');
            // Close Projects dropdown if click outside
            if (showProjectsDropdown && projectsBtn && !projectsBtn.contains(e.target) && (!projectsDropdown || !projectsDropdown.contains(e.target))) {
                setShowProjectsDropdown(false);
            }
            // Close Inverter dropdown if click outside
            if (showInverterDropdown && inverterBtn && !inverterBtn.contains(e.target) && (!inverterDropdown || !inverterDropdown.contains(e.target))) {
                setShowInverterDropdown(false);
            }
        }
        if (showProjectsDropdown || showInverterDropdown) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [showProjectsDropdown, showInverterDropdown]);

    return (
        // <>
        <div>
            <div className='d-flex justify-content-end gap-2 mb-3' style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                        className={`btn theme-btn-blue-color${showProjectsDropdown ? ' active' : ''}`}
                        id="projects-dropdown-btn"
                        onClick={() => {
                            setShowProjectsDropdown((prev) => !prev);
                            setShowInverterDropdown(false);
                        }}
                        style={{ background: showProjectsDropdown ? '#e5e7eb' : undefined }}
                    >
                        Projects ▼
                    </button>
                    {showProjectsDropdown && (
                        <div
                            id="projects-dropdown-menu"
                            style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: '160px' }}
                        >
                            <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Project 1</li>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Project 2</li>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Project 3</li>
                            </ul>
                        </div>
                    )}
                </div>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                        className={`btn theme-btn-blue-color${showInverterDropdown ? ' active' : ''}`}
                        id="inverter-dropdown-btn"
                        onClick={() => {
                            setShowInverterDropdown((prev) => !prev);
                            setShowProjectsDropdown(false);
                        }}
                        style={{ background: showInverterDropdown ? '#e5e7eb' : undefined }}
                    >
                        Inverter ▼
                    </button>
                    {showInverterDropdown && (
                        <div
                            id="inverter-dropdown-menu"
                            style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: '160px' }}
                        >
                            <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Inverter Type A</li>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Inverter Type B</li>
                                <li style={{ padding: '8px 16px', cursor: 'pointer' }}>Inverter Type C</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <OverViewCards />

            {/* Dashboard */}
            <div className="dashboard-row">
                <div className="chart-card">
                    <div className="card-header">
                        <div className="card-title">
                            Monthly Savings Tracker
                        </div>
                        <div className="tabs">
                            <button className="tab">Daily</button>
                            <button className="tab">Monthly</button>
                            <button className="tab active">Comparison</button>
                        </div>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Compare your WeChain bills vs EVN
                        baseline rates</p>

                    <div className="legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: '#fbbf24' }}></div>
                            <span>WeChain Bill</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: '#1f2937' }}></div>
                            <span>EVN Equivalent</span>
                        </div>
                    </div>

                    <div className="chart-container">
                        <div className="bar-chart">
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '160px' }}></div>
                                    <div className="bar dark" style={{ height: '50px' }}></div>
                                </div>
                                <div className="month-label">JAN</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '110px' }}></div>
                                    <div className="bar dark" style={{ height: '120px' }}></div>
                                </div>
                                <div className="month-label">FEB</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '80px' }}></div>
                                    <div className="bar dark" style={{ height: '140px' }}></div>
                                </div>
                                <div className="month-label">MAR</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '130px' }}></div>
                                    <div className="bar dark" style={{ height: '115px' }}></div>
                                </div>
                                <div className="month-label">APR</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '200px' }}></div>
                                    <div className="bar dark" style={{ height: '50px' }}></div>
                                </div>
                                <div className="month-label">JUN</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '70px' }}></div>
                                    <div className="bar dark" style={{ height: '130px' }}></div>
                                </div>
                                <div className="month-label">JUL</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '170px' }}></div>
                                    <div className="bar dark" style={{ height: '100px' }}></div>
                                </div>
                                <div className="month-label">AUG</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '130px' }}></div>
                                    <div className="bar dark" style={{ height: '110px' }}></div>
                                </div>
                                <div className="month-label">SEP</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '40px' }}></div>
                                    <div className="bar dark" style={{ height: '90px' }}></div>
                                </div>
                                <div className="month-label">OCT</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '60px' }}></div>
                                    <div className="bar dark" style={{ height: '70px' }}></div>
                                </div>
                                <div className="month-label">NOV</div>
                            </div>
                            <div className="bar-group">
                                <div className="bars">
                                    <div className="bar orange" style={{ height: '110px' }}></div>
                                    <div className="bar dark" style={{ height: '0px' }}></div>
                                </div>
                                <div className="month-label">DEC</div>
                            </div>
                        </div>
                    </div>

                    <div className="chart-stats">
                        <div className="chart-stat">
                            <div className="chart-stat-value" style={{ color: '#fbbf24' }}>đ937K</div>
                            <div className="chart-stat-label">Total Savings (2024)</div>
                        </div>
                        <div className="chart-stat">
                            <div className="chart-stat-value" style={{ color: '#f59e0b' }}>34.2%</div>
                            <div className="chart-stat-label">Avg Discount vs EVN</div>
                        </div>
                        <div className="chart-stat">
                            <div className="chart-stat-value">12</div>
                            <div className="chart-stat-label">Months of Savings</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="chart-card" style={{ marginBottom: '20px' }}>
                        <div className="circle-stats">
                            <div className="circle-stat">
                                <div className="circle orange">
                                    <span>56%</span>
                                </div>
                                <div className="circle-label">Upcoming Projects</div>
                            </div>
                            <div className="circle-stat">
                                <div className="circle green">
                                    <span>77%</span>
                                </div>
                                <div className="circle-label">Under Installation Projects</div>
                            </div>
                        </div>
                    </div>
                    <div className="chart-card">
                        <div className="card-title" style={{ marginBottom: '20px' }}>
                            🌱 Environmental Impact
                        </div>
                        <div className="impact-grid">
                            <div className="impact-card">
                                <div style={{ fontSize: '35px' }}>🍃</div>
                                <div className="impact-value">4.2 tons</div>
                                <div className="impact-label">CO₂ Avoided This Year</div>
                            </div>
                            <div className="impact-card">
                                <div style={{ fontSize: '35px' }}>💡</div>
                                <div className="impact-value">12.8K kWh</div>
                                <div className="impact-label">Clean Energy Consumed</div>
                            </div>
                            <div className="impact-card" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '35px' }}>🌳</div>
                                <div className="impact-value">18 trees</div>
                                <div className="impact-label">Equivalent planted</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Table */}
            <ProjectsTable />
            <div className="chart-card" style={{ margin: '30px 0' }}>
                <div className="card-title" style={{ marginBottom: '20px' }}>
                    Kw Generated (every minute)
                </div>
                <KriLineChart />
            </div>

            {/* Bottom Row */}
            <div className="bottom-row">
                {/* Billing Card */}
                <PayoutCard />
                {/* Documents Card */}
                {/* <DocumentsCard /> */}
            </div>
        </div>
        // </>
    );
}

export default DashboardView;
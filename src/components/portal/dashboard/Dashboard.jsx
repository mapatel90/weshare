'use client';
import React from 'react';
import '../../../assets/portal/offtaker.css';
import ProjectsTable from './sections/ProjectsTable';
import BillingCard from './sections/BillingCard';
import DocumentsCard from './sections/DocumentsCard';

function DashboardView() {

    return (
        <>
            <div className='d-flex justify-content-end gap-2 mb-3'>
                <button className="btn theme-btn-blue-color">Projects ▼</button>
                <button className="btn theme-btn-blue-color">Investor ▼</button>
            </div>
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-value">52.4 kWh</div>
                    <div className="stat-label">Daily Generation</div>
                    <div className="stat-change">↗ +4.2% vs yesterday</div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">🏠</div>
                    <div className="stat-value">40.7 kWh</div>
                    <div className="stat-label">Daily Consumption</div>
                    <div className="stat-change negative">↘ -1.7% vs yesterday</div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">36.8 %</div>
                    <div className="stat-label">Savings vs EVN</div>
                    <div className="stat-change">📈 Improving efficiency</div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">💵</div>
                    <div className="stat-value">đ3,124 K</div>
                    <div className="stat-label">Solar Savings</div>
                    <div className="stat-change">🔄 Updated daily</div>
                </div>
            </div>

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

            {/* Bottom Row */}
            <div className="bottom-row">
                {/* Billing Card */}
                <BillingCard />
                {/* Documents Card */}
                <DocumentsCard />
            </div>

        </>
    );
}

export default DashboardView;
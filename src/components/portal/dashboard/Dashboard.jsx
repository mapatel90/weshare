import React from 'react';
import '../../../assets/portal/offtaker.css';

function DashboardView() {

    return (
        <>
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
            <div className="projects-section">
                <div className="projects-table">
                    <div className="card-header">
                        <div className="card-title">💼 Latest Projects</div>
                    </div>
                    <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PROJECT NAME</th>
                            <th>STATUS</th>
                            <th>EXPECTED ROI (%)</th>
                            <th>TARGET INVESTMENT</th>
                            <th>PAYBACK PERIOD</th>
                            <th>START DATE</th>
                            <th>END DATE</th>
                            <th>EXPECTED GENERATION</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#SF1201</td>
                            <td>Solar Farm A</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>20%</td>
                            <td>₫150,000,000</td>
                            <td>5</td>
                            <td>2024-06-01</td>
                            <td>2024-06-15</td>
                            <td>1,200,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#GP2305</td>
                            <td>GreenRay Plant</td>
                            <td><span className="status-badge status-installation">Under Installation</span></td>
                            <td>22%</td>
                            <td>₫210,000,000</td>
                            <td>4.8</td>
                            <td>2024-07-01</td>
                            <td>2024-07-20</td>
                            <td>1,450,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#SB1120</td>
                            <td>SunBeam Project</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>21%</td>
                            <td>₫175,000,000</td>
                            <td>5.2</td>
                            <td>2024-07-10</td>
                            <td>2024-08-01</td>
                            <td>1,320,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#HG0987</td>
                            <td>HelioGrid</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>23%</td>
                            <td>₫240,000,000</td>
                            <td>4.5</td>
                            <td>2024-06-05</td>
                            <td>2024-06-25</td>
                            <td>1,600,000</td>
                            <td>...</td>
                        </tr>
                        <tr>
                            <td>#NS5678</td>
                            <td>Nova Solar Park</td>
                            <td><span className="status-badge status-upcoming">Upcoming</span></td>
                            <td>25%</td>
                            <td>₫280,000,000</td>
                            <td>4</td>
                            <td>2024-07-18</td>
                            <td>2024-08-05</td>
                            <td>1,850,000</td>
                            <td>...</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="bottom-row">
                <div className="billing-card">
                    <div className="card-header">
                        <div className="card-title">💳 Pending Billing & Payments</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>INVOICE</th>
                                <th>PERIOD</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>INV-2024-005</td>
                                <td>January 2025</td>
                                <td>đ149.23K</td>
                                <td><span className="status-badge status-upcoming">Pending</span></td>
                                <td>...</td>
                            </tr>
                            <tr>
                                <td>INV-2024-004</td>
                                <td>December 2024</td>
                                <td>đ158.87K</td>
                                <td><span className="status-badge status-installation">Paid</span></td>
                                <td>...</td>
                            </tr>
                            <tr>
                                <td>INV-2024-003</td>
                                <td>November 2024</td>
                                <td>đ145.67K</td>
                                <td><span className="status-badge status-upcoming">Pending</span></td>
                                <td>...</td>
                            </tr>
                            <tr>
                                <td>INV-2024-002</td>
                                <td>October 2024</td>
                                <td>đ134.25K</td>
                                <td><span className="status-badge status-upcoming">Pending</span></td>
                                <td>...</td>
                            </tr>
                            <tr>
                                <td>INV-2024-001</td>
                                <td>September 2024</td>
                                <td>đ167.83K</td>
                                <td><span className="status-badge status-upcoming">Pending</span></td>
                                <td>...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="documents-card">
                    <div className="card-header">
                        <div className="card-title">📄 Documents & Reports</div>
                        <button className="btn"
                            style={{background: '#fbbf24', color: 'white', fontSize: '12px', padding: '8px 16px'}}>📥 Download
                            All</button>
                    </div>

                    <div className="document-item">
                        <div className="document-info">
                            <div className="document-icon">📄</div>
                            <div>
                                <div style={{fontWeight: '600', fontSize: '13px'}}>Contract Renewal Notice</div>
                                <div style={{fontSize: '11px', color: '#6b7280'}}>Review contract renewal for November 2024
                                </div>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="action-btn">👁️</button>
                            <button className="action-btn">→</button>
                        </div>
                    </div>

                    <div className="document-item">
                        <div className="document-info">
                            <div className="document-icon">📄</div>
                            <div>
                                <div style={{fontWeight: '600', fontSize: '13px'}}>Solar Lease Agreement</div>
                                <div style={{fontSize: '11px', color: '#6b7280'}}>20-year lease: Installation and terms</div>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="action-btn">👁️</button>
                            <button className="action-btn">↓</button>
                        </div>
                    </div>

                    <div className="document-item">
                        <div className="document-info">
                            <div className="document-icon">📄</div>
                            <div>
                                <div style={{fontWeight: '600', fontSize: '13px'}}>Solar Lease Agreement</div>
                                <div style={{fontSize: '11px', color: '#6b7280'}}>20-year lease: Installation and terms</div>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="action-btn">👁️</button>
                            <button className="action-btn">↓</button>
                        </div>
                    </div>

                    <div className="document-item">
                        <div className="document-info">
                            <div className="document-icon">📄</div>
                            <div>
                                <div style={{fontWeight: '600', fontSize: '13px'}}>Meister Service Agreement</div>
                                <div style={{fontSize: '11px', color: '#6b7280'}}>25-year lease: Installation and terms</div>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="action-btn">👁️</button>
                            <button className="action-btn">↓</button>
                        </div>
                    </div>

                    <div className="document-item">
                        <div className="document-info">
                            <div className="document-icon">📄</div>
                            <div>
                                <div style={{fontWeight: '600', fontSize: '13px'}}>Solar Lease Agreement</div>
                                <div style={{fontSize: '11px', color: '#6b7280'}}>20-year lease: Installation and terms</div>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="action-btn">👁️</button>
                            <button className="action-btn">↓</button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}

export default DashboardView;
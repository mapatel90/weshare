'use client'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FiZap, FiActivity, FiTrendingUp, FiDollarSign, FiCalendar, FiMoreVertical } from 'react-icons/fi'

export default function OfftakerAnalytics() {
  const { user } = useAuth()

  const statsCards = [
    {
      title: 'Daily Generation',
      value: '52.4 kWh',
      icon: <FiZap size={24} />,
      color: 'info',
      change: '+12% vs Yesterday',
      bgColor: '#e3f2fd',
      iconColor: '#2196f3'
    },
    {
      title: 'Daily Consumption',
      value: '40.7 kWh',
      icon: <FiActivity size={24} />,
      color: 'primary',
      change: '-12% vs yesterday',
      bgColor: '#e8eaf6',
      iconColor: '#3f51b5'
    },
    {
      title: 'Savings vs FVN',
      value: '35.9 %',
      icon: <FiTrendingUp size={24} />,
      color: 'success',
      change: 'Trending efficiency',
      bgColor: '#e8f5e9',
      iconColor: '#4caf50'
    },
    {
      title: 'Total Savings',
      value: '₹9,124 K',
      icon: <FiDollarSign size={24} />,
      color: 'warning',
      change: 'Updated daily',
      bgColor: '#fff3e0',
      iconColor: '#ff9800'
    }
  ]

  const projectsData = [
    {
      id: '#EF1201',
      name: 'Solar Farm A',
      status: 'Waiting',
      roi: '> 20%',
      investment: '₹10,00,000',
      period: '5',
      startDate: '2024-08-01',
      endDate: '2024-09-19',
      generation: '1,200,000'
    },
    {
      id: '#GB 2205',
      name: 'GreenDay Plant',
      status: 'Under Installation',
      roi: '22%',
      investment: '₹23,20,000',
      period: '4.8',
      startDate: '2024-07-01',
      endDate: '2024-07-20',
      generation: '1,450,000'
    },
    {
      id: '#AB1101',
      name: 'Sunbeam Project',
      status: 'Waiting',
      roi: '21%',
      investment: '₹1,95,20,000',
      period: '5.2',
      startDate: '2024-07-10',
      endDate: '2024-08-01',
      generation: '1,320,000'
    }
  ]

  const invoicesData = [
    { invoice: 'INV-2024-1015', period: 'January 2025', amount: '₹149,23K', status: 'Pending' },
    { invoice: 'INV-2024-1004', period: 'December 2024', amount: '₹155,57K', status: 'Paid' },
    { invoice: 'INV-2024-1003', period: 'November 2024', amount: '₹145,97K', status: 'Pending' },
    { invoice: 'INV-2024-1002', period: 'October 2024', amount: '₹134,25K', status: 'Pending' }
  ]

  const documentsData = [
    { title: 'Contract Renewal Notice', date: '12th December 2024', views: 245 },
    { title: 'Solar Lease Agreement', date: '11th Nov 2024', views: 189 },
    { title: 'Energy Service Agreement', date: '11th Nov 2024', views: 156 },
    { title: 'Solar Lease Agreement', date: '11th Nov 2024', views: 142 }
  ]

  return (
    <div className="offtaker-analytics">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div>
          <h2 className="page-title mb-1">Energy Dashboard</h2>
          <p className="text-muted">Monitor your solar energy consumption and savings</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline-primary me-2">Projects</button>
          <button className="btn btn-primary">Investor</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="col-12 col-sm-6 col-xl-3">
            <div className="stats-card">
              <div className="stats-icon" style={{ backgroundColor: stat.bgColor, color: stat.iconColor }}>
                {stat.icon}
              </div>
              <div className="stats-content">
                <p className="stats-title">{stat.title}</p>
                <h3 className="stats-value">{stat.value}</h3>
                <span className="stats-change">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Summary Section */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1">📊 Monthly Savings Tracker</h5>
                <p className="text-muted small mb-0">Compare your Average Daily vs FVN baseline rates</p>
              </div>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-secondary">Daily</button>
                <button className="btn btn-sm btn-outline-secondary active">Monthly</button>
                <button className="btn btn-sm btn-warning text-white">Summary</button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-placeholder" style={{ height: '280px' }}>
                <div className="text-center text-muted py-5">
                  <FiActivity size={48} className="mb-2 opacity-25" />
                  <p>Monthly Savings Chart</p>
                </div>
              </div>
              <div className="row text-center mt-3">
                <div className="col-4">
                  <h4 className="text-warning mb-0">₹937K</h4>
                  <small className="text-muted">Total Savings (2024)</small>
                </div>
                <div className="col-4">
                  <h4 className="text-success mb-0">34.2%</h4>
                  <small className="text-muted">Avg Discount vs FVN</small>
                </div>
                <div className="col-4">
                  <h4 className="text-primary mb-0">12</h4>
                  <small className="text-muted">Months of Savings</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="row g-3">
            {/* Ongoing Projects */}
            <div className="col-12">
              <div className="card text-center">
                <div className="card-body py-4">
                  <div className="circular-progress mb-2">
                    <h2 className="text-success mb-0">56%</h2>
                  </div>
                  <p className="mb-0 fw-semibold">Ongoing Projects</p>
                </div>
              </div>
            </div>

            {/* Waste Reduction Report */}
            <div className="col-12">
              <div className="card text-center">
                <div className="card-body py-4">
                  <div className="circular-progress mb-2">
                    <h2 className="text-success mb-0">77%</h2>
                  </div>
                  <p className="mb-0 fw-semibold">Waste Reduction Report</p>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">🌱 Environmental Impact</h6>
                </div>
                <div className="card-body">
                  <div className="impact-item mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <span className="impact-icon">🍃</span>
                      <h5 className="mb-0 ms-2">4.2 tons</h5>
                    </div>
                    <small className="text-muted">CO₂ Avoided | This Year</small>
                  </div>
                  <div className="impact-item mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <span className="impact-icon">💡</span>
                      <h5 className="mb-0 ms-2">12.8K kWh</h5>
                    </div>
                    <small className="text-muted">Clean energy Consumed</small>
                  </div>
                  <div className="impact-item">
                    <div className="d-flex align-items-center mb-1">
                      <span className="impact-icon">🌳</span>
                      <h5 className="mb-0 ms-2">18 trees</h5>
                    </div>
                    <small className="text-muted">Equivalent planted</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Projects */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">💡 Latest Projects</h5>
              <button className="btn btn-sm btn-link"><FiMoreVertical /></button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>PROJECT NAME</th>
                      <th>STATUS</th>
                      <th>EXPECTED ROI (%)</th>
                      <th>TARGET INVESTMENT</th>
                      <th>PAYBACK PERIOD (YEARS)</th>
                      <th>START DATE</th>
                      <th>END DATE</th>
                      <th>EXPECTED GENERATION (kWh/Year)</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsData.map((project, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{project.id}</td>
                        <td className="fw-semibold">{project.name}</td>
                        <td><span className={`badge ${project.status === 'Waiting' ? 'bg-warning' : 'bg-info'}`}>{project.status}</span></td>
                        <td>{project.roi}</td>
                        <td>{project.investment}</td>
                        <td>{project.period}</td>
                        <td>{project.startDate}</td>
                        <td>{project.endDate}</td>
                        <td>{project.generation}</td>
                        <td><button className="btn btn-sm btn-link">•••</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Billing & Documents */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">💰 Pending Billing & Payments</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
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
                    {invoicesData.map((invoice, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{invoice.invoice}</td>
                        <td>{invoice.period}</td>
                        <td className="fw-semibold">{invoice.amount}</td>
                        <td><span className={`badge ${invoice.status === 'Paid' ? 'bg-success' : 'bg-warning'}`}>{invoice.status}</span></td>
                        <td><button className="btn btn-sm btn-link">•••</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">📄 Documents & Reports</h5>
              <button className="btn btn-sm btn-warning text-white">View More</button>
            </div>
            <div className="card-body">
              {documentsData.map((doc, idx) => (
                <div key={idx} className="document-item d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{doc.title}</h6>
                    <small className="text-muted">{doc.date}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">{doc.views} 👁️</small>
                    <button className="btn btn-sm btn-link">📥</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .offtaker-analytics {
          width: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1d1f;
        }

        .header-actions .btn {
          padding: 0.5rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 6px;
        }

        .stats-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid #e9ecef;
          display: flex;
          gap: 1rem;
          align-items: center;
          transition: all 0.3s ease;
          height: 100%;
        }

        .stats-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stats-content {
          flex: 1;
        }

        .stats-title {
          font-size: 0.813rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
          font-weight: 400;
        }

        .stats-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #1a1d1f;
        }

        .stats-change {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 400;
        }

        .card {
          border-radius: 12px;
          border: 1px solid #e9ecef;
          background: white;
          height: 100%;
        }

        .card-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 1rem 1.5rem;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1d1f;
        }

        .card-body {
          padding: 1.5rem;
        }

        .chart-placeholder {
          background: #f8f9fa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .circular-progress {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(#4caf50 0% 56%, #e9ecef 56% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          position: relative;
        }

        .circular-progress::before {
          content: '';
          position: absolute;
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: white;
        }

        .circular-progress h2 {
          position: relative;
          z-index: 1;
        }

        .impact-item {
          padding: 0.5rem 0;
        }

        .impact-icon {
          font-size: 1.5rem;
        }

        .table {
          margin-bottom: 0;
          font-size: 0.875rem;
        }

        .table thead th {
          border-bottom: 2px solid #e9ecef;
          font-weight: 600;
          color: #6c757d;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.75rem;
          white-space: nowrap;
        }

        .table tbody td {
          vertical-align: middle;
          padding: 0.875rem 0.75rem;
          color: #495057;
        }

        .badge {
          padding: 0.375rem 0.75rem;
          font-weight: 500;
          font-size: 0.75rem;
          border-radius: 6px;
        }

        .btn-group .btn {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
        }

        .document-item:last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            width: 48%;
          }

          .stats-card {
            padding: 1rem;
          }

          .stats-value {
            font-size: 1.25rem;
          }

          .table {
            font-size: 0.813rem;
          }
        }
      `}</style>
    </div>
  )
}

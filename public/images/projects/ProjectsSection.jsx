'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const ProjectsSection = () => {
  const [activeTab, setActiveTab] = useState('open')

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  const projects = [
    {
      image: '/images/projects/project-img1.png',
      title: 'Sunrise Residential Complex',
      location: 'Austin, TX',
      capacity: '125.5kWp',
      generated: '847.2K',
      roi: '9.2%',
      revenue: '$67.8K'
    },
    {
      image: '/images/projects/project-img2.png',
      title: 'Green Valley Business Park',
      location: 'Dallas, TX',
      capacity: '200.0kWp',
      generated: '1.2M',
      roi: '12.5%',
      revenue: '$95.0K'
    },
    {
      image: '/images/projects/project-img1.png',
      title: 'Eco Community Housing',
      location: 'Houston, TX',
      capacity: '150.8kWp',
      generated: '950.5K',
      roi: '10.8%',
      revenue: '$78.5K'
    }
  ]

  return (
    <section className="projectSection">
      <div className="container">
        <div className="headerSection mb-40" data-aos="fade-up">
          <ul className="nav nav-pills mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'open' ? 'active' : ''}`}
                onClick={() => setActiveTab('open')}
                type="button"
              >
                <span className="circle"></span> Projects Open for Lease
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'resale' ? 'active' : ''}`}
                onClick={() => setActiveTab('resale')}
                type="button"
              >
                <span className="circle"></span> Projects for Resale
              </button>
            </li>
          </ul>
        </div>

        <div className="tab-content">
          <div className="row">
            {projects.map((project, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0" data-aos="fade-up" data-aos-duration={1000 + index * 200}>
                <div className="project-card shadow-sm overflow-hidden">
                  <div className="project-items">
                    <Image src={project.image} alt={project.title} className="img-fluid project-img" width={400} height={250} />
                  </div>

                  <div className="pt-3">
                    <h5 className="fw-600 mb-2 text-title">{project.title}</h5>
                    <div className="d-flex align-items-center text-muted small mb-3 fw-300">
                      <span className="me-1">
                        <Image src="/images/icons/location.svg" alt="location" width={16} height={16} />
                      </span>
                      {project.location}
                      <span className="mx-2"></span>
                      <span className="me-1">
                        <Image src="/images/icons/light.svg" alt="capacity" width={16} height={16} />
                      </span>
                      {project.capacity}
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                      <div className="w-45 caterogy-items">
                        <h6 className="mb-0 fw-600 text-title">{project.generated}</h6>
                        <small className="text-muted">kWh Generated</small>
                      </div>
                      <div className="w-45 caterogy-items items-2">
                        <h6 className="mb-0 fw-600 text-title secondaryTextColor">{project.roi}</h6>
                        <small className="text-muted">ROI</small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <p className="fw-300 mb-0 text-black">Expected Annual Revenue</p>
                      <span className="fw-600 text-secondary-color">{project.revenue}</span>
                    </div>

                    <button className="btn btn-primary-custom mt-4 w-100">
                      <Image className="me-2" src="/images/icons/reports-icon.svg" alt="view" width={20} height={20} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-block mt-40 text-center" data-aos="fade-up" data-aos-duration="1500">
            <button className="btn btn-primary-custom mt-3 transparentBtn text-primary border-1">
              Load More Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProjectsSection

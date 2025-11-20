'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet } from '@/lib/api'
import { getFullImageUrl } from '@/utils/common'

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [testimonials, setTestimonials] = useState([])
  // track which nav button is active after click: 'prev' | 'next' | null
  const [activeNav, setActiveNav] = useState(null)
  console.log(testimonials)
  const [loading, setLoading] = useState(true)
  const { lang } = useLanguage()

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await apiGet(`/api/testimonials`)
      console.log(response)
      console.log("response",getFullImageUrl);
      if (response) {
        const data = await response
        // Transform API data to match component structure
        const transformedData = data.map(item => ({
          id: item.id,
          name: item.offtaker?.fullName || 'Anonymous',
          role: item.project?.project_name || 'Customer',
          text: item.description || '',
          rating: item.review_status || 5,
          image: item.offtaker?.user_image || item.image || '/images/avatar/user-img.png'
        }))
        console.log("transformedData",transformedData);
        setTestimonials(transformedData.length > 0 ? transformedData : getDefaultTestimonials())
      } else {
        console.log('test')
        // setTestimonials(getDefaultTestimonials())
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      // setTestimonials(getDefaultTestimonials())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTestimonials = () => [
    {
      name: 'Cameron Williamson',
      role: 'Investor',
      text: 'What I loved about WeShare is the transparency — every project detail, every report was accessible. It feels great to be part of something that\'s both profitable and purposeful.',
      rating: 4,
      image: '/images/avatar/user-img.png'
    },
    {
      name: 'Sarah Johnson',
      role: 'Offtaker',
      text: 'Installing solar through WeShare was seamless. No upfront costs, immediate savings on my electricity bills, and I\'m helping the environment. It\'s a win-win!',
      rating: 5,
      image: '/images/avatar/user-img.png'
    }
  ]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
    setActiveNav('prev')
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
    setActiveNav('next')
  }

  if (loading) {
    return (
      <section className="testimonial-section position-relative" style={{ padding: '80px 0', backgroundColor: '#FFFCF5' }}>
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="testimonial-section position-relative" style={{ padding: '80px 0', backgroundColor: '#FFFCF5' }}>
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="mb-3" style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#1A1A1A',
            lineHeight: '1.2'
          }}>
            {lang('home.testimonial.title')} <span style={{ color: '#F9A825' }}>{lang('home.testimonial.titleSpan')}</span>
          </h2>
          <p style={{
            fontSize: '18px',
            fontWeight: '400',
            color: '#6B6B6B',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            {lang('home.testimonial.subtitle')}
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="position-relative" data-aos="fade-up">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`testimonial-card ${index === currentIndex ? 'd-block' : 'd-none'}`}
                style={{
                  backgroundColor: '#FFF9F0',
                  borderRadius: '20px',
                  padding: '0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="row g-0 align-items-stretch">
                  {/* Image Section */}
                  <div className="col-lg-5">
                    <div style={{
                      position: 'relative',
                      height: '100%',
                      minHeight: '500px',
                      padding: '20px'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}>
                        <Image
                          src={getFullImageUrl(testimonial?.image)}
                          alt={testimonial.name}
                          fill
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="col-lg-7">
                    <div className='testimonials-res' style={{ padding: '50px 60px' }}>
                      {/* Quote Icon */}
                      <div className="mb-4">
                        <img src={getFullImageUrl('/images/Image [svg-img].svg')} alt="Testimonial logo" />
                      </div>

                      {/* Name and Role */}
                      <h3 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: '10px',
                        lineHeight: '1.2'
                      }}>
                        {testimonial.name}
                      </h3>
                      <p style={{
                        fontSize: '20px',
                        fontWeight: '500',
                        color: '#757575',
                        marginBottom: '28px'
                      }}>
                        {testimonial.role}
                      </p>

                      {/* Testimonial Text */}
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '400',
                        color: '#424242',
                        lineHeight: '1.75',
                        marginBottom: '30px'
                      }}>
                        {testimonial.text}
                      </p>

                      {/* Star Rating and Navigation */}
                      <div className="d-flex align-items-center justify-content-between">
                        {/* Star Rating */}
                        <div className="d-flex align-items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill={i < testimonial.rating ? "#F9A825" : "#E0E0E0"}
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          ))}
                        </div>

                        {/* Navigation Arrows (show only when more than 1 testimonial) */}
                        {testimonials.length > 1 && (
                          <div className="d-flex gap-3">
                            <button
                              onClick={handlePrev}
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: activeNav === 'prev' ? '#F57C00' : '#F9A825',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(249, 168, 37, 0.3)'
                              }}
                              aria-label="Previous testimonial"
                              onMouseEnter={(e) => { if (activeNav !== 'prev') e.currentTarget.style.backgroundColor = '#F57C00' }}
                              onMouseLeave={(e) => { if (activeNav !== 'prev') e.currentTarget.style.backgroundColor = '#F9A825' }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                <path d="M15 18l-6-6 6-6" />
                              </svg>
                            </button>
                            <button
                              onClick={handleNext}
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: activeNav === 'next' ? '#F57C00' : '#FFFFFF',
                                border: activeNav === 'next' ? '2px solid transparent' : '2px solid #E0E0E0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              aria-label="Next testimonial"
                              onMouseEnter={(e) => {
                                if (activeNav !== 'next') {
                                  e.currentTarget.style.backgroundColor = '#F5F5F5'
                                  e.currentTarget.style.borderColor = '#BDBDBD'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (activeNav !== 'next') {
                                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                                  e.currentTarget.style.borderColor = '#E0E0E0'
                                }
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeNav === 'next' ? 'white' : '#424242'} strokeWidth="3" strokeLinecap="round">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialSection

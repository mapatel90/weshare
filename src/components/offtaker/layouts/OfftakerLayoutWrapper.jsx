'use client'
import React, { useState, useEffect, useLayoutEffect } from 'react'
import OfftakerHeader from './OfftakerHeader'
import OfftakerSidebar from './OfftakerSidebar'
import { usePathname } from 'next/navigation'
import { useSideBar } from './SideBarProvider'

const OfftakerLayoutWrapper = ({ children }) => {
    const { sidebarOpen, setSidebarOpen } = useSideBar()
    const [isMobile, setIsMobile] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const pathname = usePathname()

    // Check mobile/desktop
    useEffect(() => {
        const checkBreakpoint = () => {
            const width = window.innerWidth
            const mobile = width <= 1024
            setIsMobile(mobile)
            
            // Auto-open sidebar on desktop, close on mobile
            if (width >= 1025) {
                setSidebarOpen(true)
            } else {
                setSidebarOpen(false)
            }
        }

        checkBreakpoint()
        window.addEventListener('resize', checkBreakpoint)

        return () => window.removeEventListener('resize', checkBreakpoint)
    }, [setSidebarOpen])

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile && sidebarOpen) {
            setSidebarOpen(false)
        }
    }, [pathname, isMobile])

    // Set body layout data attribute
    useLayoutEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.dataset.layout = 'offtaker-layout'
            
            return () => {
                delete document.body.dataset.layout
            }
        }
    }, [])

    // Mount check for hydration
    useLayoutEffect(() => {
        setIsMounted(true)
    }, [])

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    if (!isMounted) return null

    return (
        <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Sidebar */}
            <OfftakerSidebar isOpen={sidebarOpen} />
            
            {/* Main Content Area */}
            <div className="app-content">
                {/* Header */}
                <OfftakerHeader toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                
                {/* Page Content */}
                <main className="main-content">
                    <div className="content-wrapper">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={toggleSidebar}
                    role="button"
                    aria-label="Close sidebar"
                />
            )}

            <style jsx>{`
                .app-layout {
                    display: flex;
                    min-height: 100vh;
                    background: var(--bs-body-bg, #f8f9fa);
                }

                .app-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    transition: margin-left 0.3s ease;
                }

                .sidebar-open .app-content {
                    margin-left: 280px;
                }

                .sidebar-closed .app-content {
                    margin-left: 80px;
                }

                .main-content {
                    flex: 1;
                    padding: 2rem;
                    margin-top: 70px;
                    overflow-x: hidden;
                }

                .content-wrapper {
                    max-width: 100%;
                    margin: 0 auto;
                }

                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 998;
                    cursor: pointer;
                }

                /* Mobile Responsive */
                @media (max-width: 1024px) {
                    .app-content {
                        margin-left: 0 !important;
                    }

                    .main-content {
                        padding: 1.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 1rem;
                    }
                }

                @media (max-width: 576px) {
                    .main-content {
                        padding: 0.75rem;
                    }
                }

                /* Dark mode support */
                :global(.app-skin-dark) .app-layout {
                    background: #1a1d1f;
                }

                :global(.app-skin-dark) .main-content {
                    color: #e9ecef;
                }
            `}</style>
        </div>
    )
}

export default OfftakerLayoutWrapper

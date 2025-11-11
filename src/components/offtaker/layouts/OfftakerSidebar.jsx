'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
    FiHome, 
    FiGrid, 
    FiZap, 
    FiFileText, 
    FiDollarSign, 
    FiSettings, 
    FiChevronDown,
    FiChevronRight,
    FiShoppingCart,
    FiBarChart2,
    FiUsers,
    FiMail
} from 'react-icons/fi'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useLanguage } from '@/contexts/LanguageContext'
import useSettings from '@/hooks/useSettings'

const OfftakerSidebar = ({ isOpen }) => {
    const pathname = usePathname()
    const { lang } = useLanguage()
    const { settings } = useSettings()
    const [expandedMenus, setExpandedMenus] = useState({})

    const toggleMenu = (menuKey) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }))
    }

    const isActive = (path) => pathname === path

    const menuItems = [
        {
            title: 'Dashboard',
            icon: <FiHome size={20} />,
            path: '/offtaker/dashboard',
        },
        {
            title: 'Energy Projects',
            icon: <FiZap size={20} />,
            key: 'projects',
            subItems: [
                { title: 'All Projects', path: '/offtaker/projects' },
                { title: 'Active Projects', path: '/offtaker/projects/active' },
                { title: 'Completed Projects', path: '/offtaker/projects/completed' },
            ]
        },
        {
            title: 'Orders',
            icon: <FiShoppingCart size={20} />,
            key: 'orders',
            subItems: [
                { title: 'All Orders', path: '/offtaker/orders' },
                { title: 'Pending Orders', path: '/offtaker/orders/pending' },
                { title: 'Order History', path: '/offtaker/orders/history' },
            ]
        },
        {
            title: 'Invoices',
            icon: <FiFileText size={20} />,
            path: '/offtaker/invoices',
        },
        {
            title: 'Payments',
            icon: <FiDollarSign size={20} />,
            key: 'payments',
            subItems: [
                { title: 'Payment History', path: '/offtaker/payments' },
                { title: 'Pending Payments', path: '/offtaker/payments/pending' },
                { title: 'Payment Methods', path: '/offtaker/payments/methods' },
            ]
        },
        {
            title: 'Analytics',
            icon: <FiBarChart2 size={20} />,
            path: '/offtaker/analytics',
        },
        {
            title: 'Support',
            icon: <FiMail size={20} />,
            key: 'support',
            subItems: [
                { title: 'Contact Support', path: '/offtaker/support' },
                { title: 'Tickets', path: '/offtaker/support/tickets' },
                { title: 'FAQs', path: '/offtaker/support/faqs' },
            ]
        },
        {
            title: 'Settings',
            icon: <FiSettings size={20} />,
            path: '/offtaker/settings',
        },
    ]

    return (
        <aside className={`offtaker-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <div className="sidebar-header">
                <Link href="/offtaker/dashboard" className="brand-logo">
                    {isOpen ? (
                        <img 
                            src={settings?.site_image || '/images/logo-full.png'} 
                            alt="Sunshare" 
                            className="logo-full"
                            width={140}
                            height={40}
                        />
                    ) : (
                        <img 
                            src={settings?.site_favicon || '/images/logo-abbr.png'} 
                            alt="S" 
                            className="logo-mini"
                            width={40}
                            height={40}
                        />
                    )}
                </Link>
            </div>

            <div className="sidebar-content">
                <PerfectScrollbar>
                    <nav className="sidebar-nav">
                        {isOpen && (
                            <div className="nav-section-title">
                                <span>{lang('navigation.menu', 'MENU')}</span>
                            </div>
                        )}
                        
                        <ul className="nav-list">
                            {menuItems.map((item, index) => (
                                <li key={index} className="nav-item">
                                    {item.subItems ? (
                                        <>
                                            <button
                                                className={`nav-link ${expandedMenus[item.key] ? 'active' : ''}`}
                                                onClick={() => toggleMenu(item.key)}
                                            >
                                                <span className="nav-icon">{item.icon}</span>
                                                {isOpen && (
                                                    <>
                                                        <span className="nav-text">{item.title}</span>
                                                        <span className="nav-arrow">
                                                            {expandedMenus[item.key] ? 
                                                                <FiChevronDown size={16} /> : 
                                                                <FiChevronRight size={16} />
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                            {expandedMenus[item.key] && isOpen && (
                                                <ul className="nav-submenu">
                                                    {item.subItems.map((subItem, subIndex) => (
                                                        <li key={subIndex}>
                                                            <Link 
                                                                href={subItem.path}
                                                                className={`nav-sublink ${isActive(subItem.path) ? 'active' : ''}`}
                                                            >
                                                                {subItem.title}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link 
                                            href={item.path}
                                            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                                            title={!isOpen ? item.title : ''}
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            {isOpen && <span className="nav-text">{item.title}</span>}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </PerfectScrollbar>
            </div>

            <style jsx>{`
                .offtaker-sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    background: var(--bs-white);
                    border-right: 1px solid var(--bs-border-color);
                    transition: width 0.3s ease;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-open {
                    width: 280px;
                }

                .sidebar-closed {
                    width: 80px;
                }

                .sidebar-header {
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-bottom: 1px solid var(--bs-border-color);
                    padding: 1rem;
                }

                .brand-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                }

                .logo-full {
                    max-width: 140px;
                    height: auto;
                }

                .logo-mini {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                }

                .sidebar-content {
                    flex: 1;
                    overflow: hidden;
                }

                .sidebar-nav {
                    padding: 1rem 0;
                }

                .nav-section-title {
                    padding: 0.5rem 1.5rem;
                    margin-bottom: 0.5rem;
                }

                .nav-section-title span {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--bs-secondary);
                    letter-spacing: 0.5px;
                }

                .nav-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .nav-item {
                    margin-bottom: 0.25rem;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    color: var(--bs-body-color);
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    width: 100%;
                    text-align: left;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .sidebar-closed .nav-link {
                    justify-content: center;
                    padding: 0.75rem;
                }

                .nav-link:hover {
                    background: var(--bs-light);
                }

                .nav-link.active {
                    background: var(--bs-primary-bg-subtle);
                    color: var(--bs-primary);
                    font-weight: 600;
                }

                .nav-link.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--bs-primary);
                }

                .nav-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 24px;
                }

                .nav-text {
                    flex: 1;
                    margin-left: 1rem;
                    font-size: 0.9rem;
                }

                .nav-arrow {
                    display: flex;
                    align-items: center;
                    margin-left: auto;
                }

                .nav-submenu {
                    list-style: none;
                    padding: 0.5rem 0 0.5rem 3.5rem;
                    margin: 0;
                }

                .nav-sublink {
                    display: block;
                    padding: 0.5rem 1rem;
                    color: var(--bs-secondary);
                    text-decoration: none;
                    font-size: 0.85rem;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .nav-sublink:hover {
                    background: var(--bs-light);
                    color: var(--bs-body-color);
                }

                .nav-sublink.active {
                    background: var(--bs-primary-bg-subtle);
                    color: var(--bs-primary);
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .offtaker-sidebar {
                        transform: translateX(-100%);
                    }

                    .sidebar-open {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </aside>
    )
}

export default OfftakerSidebar

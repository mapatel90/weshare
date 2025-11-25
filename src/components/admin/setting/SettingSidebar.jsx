'use client'
import React, { useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiX } from 'react-icons/fi'
import PerfectScrollbar from 'react-perfect-scrollbar'
import getIcon from '@/utils/getIcon'
import { SettingSidebarContext } from '@/contentApi/settingSideBarProvider'
import { useLanguage } from '@/contexts/LanguageContext'

const navItems = [
    { label: "menu.general", path: "/admin/settings/general", icon: "feather-airplay" },
    { label: "menu.seo", path: "/admin/settings/seo", icon: "feather-search" },
    { label: "menu.rolesmanagement", path: "/admin/settings/role", icon: "feather-shield" },
    // { label: "menu.tags", path: "/admin/settings/tags", icon: "feather-tag" },
    { label: "menu.email", path: "/admin/settings/email", icon: "feather-mail" },
    // { label: "menu.tasks", path: "/admin/settings/tasks", icon: "feather-check-circle" },
    // { label: "menu.leads", path: "/admin/settings/leads", icon: "feather-crosshair" },
    // { label: "menu.support", path: "/admin/settings/support", icon: "feather-life-buoy" },
    { label: "menu.finance", path: "/admin/settings/finance", icon: "feather-dollar-sign" },
    { label: "menu.gateways", path: "/admin/settings/gateways", icon: "feather-git-branch" },
    { label: "menu.customers", path: "/admin/settings/customers", icon: "feather-users" },
    { label: "menu.localization", path: "/admin/settings/localization", icon: "feather-globe" },
    { label: "menu.recaptcha", path: "/admin/settings/recaptcha", icon: "feather-shield" },
    { label: "menu.miscellaneous", path: "/admin/settings/miscellaneous", icon: "feather-cast" }
]

const SettingSidebar = () => {
    const { lang } = useLanguage()
    const { sidebarOpen, setSidebarOpen } = useContext(SettingSidebarContext)
    const pathName = usePathname()

    return (
        <div className={`content-sidebar content-sidebar-md ${sidebarOpen ? "app-sidebar-open" : ""} `}>
            <PerfectScrollbar>
                <div className="content-sidebar-header bg-white sticky-top hstack justify-content-between">
                    <h4 className="fw-bolder mb-0">{lang('header.settings')}</h4>
                    <a href="#" className="app-sidebar-close-trigger d-flex" onClick={() => setSidebarOpen(false)}>
                        <FiX size={16} />
                    </a>
                </div>
                <div className="content-sidebar-body">
                    <ul className="nav flex-column nxl-content-sidebar-item">
                        {
                            navItems.map(({ label, path, icon }, index) => (
                                <li key={index} className="nav-item">
                                    <Link className={`nav-link ${pathName === path ? "active" : ""} `} href={path}>
                                        <i className='lh-1 fs-16'>{getIcon(icon)} </i>
                                        <span>{lang(label)}</span>
                                    </Link>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </PerfectScrollbar>
        </div>

    )
}

export default SettingSidebar
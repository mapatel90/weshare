'use client'

import Image from 'next/image'
import React, { Fragment } from 'react'
import { FiActivity, FiBell, FiChevronRight, FiDollarSign, FiLogOut, FiSettings, FiUser } from "react-icons/fi"
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { getFullImageUrl } from '@/utils/common'

const activePosition = ["Active", "Always", "Bussy", "Inactive", "Disabled", "Cutomization"]
const subscriptionsList = ["Plan", "Billings", "Referrals", "Payments", "Statements", "Subscriptions"]
const ProfileModal = () => {
    const { user, logout } = useAuth()
    const { lang } = useLanguage()
    
    const handleLogout = (e) => {
        e.preventDefault()
        logout()
    }
    return (
        <div className="dropdown nxl-h-item">
            <a href="#" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside">
                {/* Replace image with default user icon */}
                <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0f0f0' }}>
                    <FiUser size={24} color="#555" />
                </span>
            </a>
            <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown">
                <div className="dropdown-header">
                    <div className="d-flex align-items-center">
                        {user?.avatar ? (
                            <Image width={40} height={40} src={getFullImageUrl(user?.avatar)} alt="user-image" className="img-fluid user-avtar" />
                        ) : (
                            <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0f0f0', marginRight: '12px' }}>
                                <FiUser size={24} color="#555" />
                            </span>
                        )}
                        <div>
                            {/* <h6 className="text-dark mb-0">{user?.name || 'User'} <span className="badge bg-soft-success text-success ms-1">{user?.userRole?.toUpperCase() || 'USER'}</span></h6> */}
                            <h6 className="text-dark mb-0">{user?.name || 'User'}</h6>
                            <span className="fs-12 fw-medium text-muted">{user?.email || 'user@example.com'}</span>
                        </div>
                    </div>
                </div>
                {/* <div className="dropdown">
                    <a href="#" className="dropdown-item" data-bs-toggle="dropdown">
                        <span className="hstack">
                            <i className="wd-10 ht-10 border border-2 border-gray-1 bg-success rounded-circle me-2"></i>
                            <span>Active</span>
                        </span>
                        <i className="ms-auto me-0"><FiChevronRight /></i>
                    </a>
                    <div className="dropdown-menu user-active">
                        {
                            activePosition.map((item, index) => {
                                return (
                                    <Fragment key={index}>
                                        {index === activePosition.length - 1 && <div className="dropdown-divider"></div>}
                                        <a href="#" className="dropdown-item">
                                            <span className="hstack">
                                                <i className={`wd-10 ht-10 border border-2 border-gray-1 rounded-circle me-2 ${getColor(item)}`}></i>
                                                <span>{item}</span>
                                            </span>
                                        </a>
                                    </Fragment>
                                )
                            })
                        }
                    </div>
                </div> */}
                {/* <div className="dropdown-divider"></div> */}
                {/* <div className="dropdown">
                    <a href="#" className="dropdown-item" data-bs-toggle="dropdown">
                        <span className="hstack">
                            <i className=" me-2"><FiDollarSign /></i>
                            <span>Subscriptions</span>
                        </span>
                        <i className="ms-auto me-0"><FiChevronRight /></i>
                    </a>
                    <div className="dropdown-menu">
                        {
                            subscriptionsList.map((item, index) => {
                                return (
                                    <Fragment key={index}>
                                        {index === activePosition.length - 1 && <div className="dropdown-divider"></div>}
                                        <a href="#" className="dropdown-item">
                                            <span className="hstack">
                                                <i className="wd-5 ht-5 bg-gray-500 rounded-circle me-3"></i>
                                                <span>{item}</span>
                                            </span>
                                        </a>
                                    </Fragment>
                                )
                            })
                        }

                    </div>
                </div> */}
                {/* <div className="dropdown-divider"></div> */}
                <a href="/admin/users/profile" className="dropdown-item">
                    <i><FiUser /></i>
                    <span>{lang('header.profile')}</span>
                </a>
                {/* <a href="#" className="dropdown-item">
                    <i ><FiActivity /></i>
                    <span>Activity Feed</span>
                </a> */}
                {/* <a href="#" className="dropdown-item">
                    <i ><FiDollarSign /></i>
                    <span>Billing Details</span>
                </a>
                <a href="#" className="dropdown-item">
                    <i><FiBell /></i>
                    <span>Notifications</span>
                </a>
                <a href="#" className="dropdown-item">
                    <i><FiSettings /></i>
                    <span>Account Settings</span>
                </a> */}
                <Link href="/admin/users/changepassword" className="dropdown-item">
                    <i><FiSettings /></i>
                    <span>{lang('header.changepassword')}</span>
                </Link>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={handleLogout}>
                    <i> <FiLogOut /></i>
                    <span>{lang('header.logout')}</span>
                </a>
            </div>

            {/* ChangePassword is now a separate page at /account/change-password */}
        </div>
    )
}

export default ProfileModal

const getColor = (item) => {
    switch (item) {
        case "Always":
            return "always_clr"
        case "Bussy":
            return "bussy_clr"
        case "Inactive":
            return "inactive_clr"
        case "Disabled":
            return "disabled_clr"
        case "Cutomization":
            return "cutomization_clr"
        default:
            return "active-clr";
    }
}
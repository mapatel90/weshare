'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi"
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { buildUploadUrl } from '@/utils/common'
import { Avatar } from '@mui/material'


const ProfileModal = () => {
    const { user, logout } = useAuth()
    const { lang } = useLanguage()

    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        const handleOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('touchstart', handleOutside)

        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('touchstart', handleOutside)
        }
    }, [])

    const handleLogout = (e) => {
        e.preventDefault()
        setOpen(false)
        logout()
    }

    // changed: do not preventDefault so click/tap fires immediately
    const toggle = (e) => {
        setOpen(prev => !prev)
    }

    return (
        <div className="dropdown nxl-h-item" ref={wrapperRef}>
            <button
                type="button"
                className="nxl-head-link"
                style={{ margin: 0, padding: 0, border: 'none', background: 'none' }}
                aria-expanded={open}
                onClick={toggle}
            >
                {/* Replace image with default user icon */}
                <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0f0f0' }}>
                    {/* <FiUser size={24} color="#555" /> */}
                    {user?.avatar ? (
                        <Avatar src={buildUploadUrl(user?.avatar)} alt="user-image" sx={{ width: 40, height: 40 }} />
                    ) : (
                        <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0f0f0' }}>
                            <FiUser size={24} color="#555" />
                        </span>
                    )}
                </span>
            </button>

            <div className={`dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown ${open ? 'show' : ''}`}>
                <div className="dropdown-header">
                    <div className="d-flex align-items-center">
                        {user?.avatar ? (
                            <Avatar width={40} height={40} src={buildUploadUrl(user?.avatar)} alt="user-image" className="img-fluid user-avtar" />
                        ) : (
                            <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0f0f0', marginRight: '12px' }}>
                                <FiUser size={24} color="#555" />
                            </span>
                        )}
                        <div>
                            <h6 className="text-dark mb-0">{user?.name || 'User'}</h6>
                            <span className="fs-12 fw-medium text-muted">{user?.email || 'user@example.com'}</span>
                        </div>
                    </div>
                </div>

                <a href="/admin/users/profile" className="dropdown-item" onClick={() => setOpen(false)}>
                    <i><FiUser /></i>
                    <span>{lang('header.profile')}</span>
                </a>

                <Link href="/admin/users/changepassword" className="dropdown-item" onClick={() => setOpen(false)}>
                    <i><FiSettings /></i>
                    <span>{lang('header.changepassword')}</span>
                </Link>

                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={handleLogout}>
                    <i> <FiLogOut /></i>
                    <span>{lang('header.logout')}</span>
                </a>
            </div>
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
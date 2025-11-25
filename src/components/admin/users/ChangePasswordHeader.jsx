'use client'
import React from 'react'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'

const ChangePasswordHeader = () => {
  const { lang } = useLanguage()
  return (
    <div className="page-header">
      <div className="page-header-left d-flex align-items-center">
        {/* small-screen back button (visible only on mobile) */}
        <div className="d-block d-md-none">
          <Link href="/admin/users/list" className="btn btn-light">
            <FiArrowLeft size={16} className="me-2" />
            {lang('usersView.backToUser')}
          </Link>
        </div>
        {/* <div className="page-header-title">
          <h5 className="m-b-10">Create User</h5>
        </div>
        <ul className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link href="/admin/users/list">Users</Link></li>
          <li className="breadcrumb-item">Create</li>
        </ul> */}
      </div>
      {/* <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link href="/admin/users/list" className="btn btn-light">
              <FiArrowLeft size={16} className="me-2" />
              {lang('usersView.backToUser')}
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default ChangePasswordHeader
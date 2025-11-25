'use client'

import React from 'react'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'

const UsersViewHeader = () => {
  const { lang } = useLanguage()
  return (
    <div className="page-header">
      {/* <div className="page-header-left d-flex align-items-center">
        <div className="page-header-title">
          <h5 className="m-b-10">User Details</h5>
        </div>
        <ul className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link href="/admin/users/list">Users</Link></li>
          <li className="breadcrumb-item">View</li>
        </ul>
      </div> */}
      <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link href="/admin/users/list" className="btn btn-light">
              <FiArrowLeft size={16} className="me-2" />
              {lang('usersView.backToUser')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersViewHeader
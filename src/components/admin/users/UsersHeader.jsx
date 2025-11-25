'use client'

import React from 'react'
import Link from 'next/link'
import { FiPlus, FiDownload, FiUpload, FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@mui/material'

const UsersHeader = () => {
  const { lang } = useLanguage()
  return (
    <div className="page-header">
      <div className="page-header-left d-flex align-items-center">
        {/* small-screen back button (visible only on mobile) */}
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            {/* <Link href="/admin/users/create" className="btn btn-primary">
              <FiPlus size={16} className="me-2" />
              {lang('usersView.CreateUser')}
            </Link> */}
            <Button
              component={Link}
              href="/admin/users/create"
              variant="contained"
              className="common-orange-color"
              startIcon={<FiPlus size={16} />}
            >
              {lang('usersView.CreateUser')}
            </Button>
          </div>
      </div>
      {/* <div className="page-header-left d-flex align-items-center">
        <div className="page-header-title">
          <h5 className="m-b-10">Users Management</h5>
        </div>
        <ul className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
          <li className="breadcrumb-item">Users</li>
        </ul>
      </div> */}
      <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
          {/* <div className="d-flex d-md-none">
            <a href="javascript:void(0)" className="page-header-right-close-toggle">
              <i className="feather-arrow-left me-2"></i>
              <span>Back</span>
            </a>
          </div> */}
          {/* <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link href="/admin/users/create" className="btn btn-primary">
              <FiPlus size={16} className="me-2" />
              {lang('usersView.CreateUser')}
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default UsersHeader
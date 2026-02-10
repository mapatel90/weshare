'use client'
import React from 'react'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@mui/material'

const UsersCreateHeader = () => {
  const { lang } = useLanguage()
  return (
    <div className="page-header">
      <div className="page-header-left d-flex align-items-center">
      </div>
      <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Button
              component={Link}
              href="/admin/users/list"
              variant="contained"
              className="common-orange-color"
              startIcon={<FiArrowLeft size={16} />}
            >
              {lang('usersView.backToUser')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersCreateHeader
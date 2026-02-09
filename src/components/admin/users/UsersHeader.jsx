'use client'

import React from 'react'
import Link from 'next/link'
import { FiPlus, FiDownload, FiUpload, FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@mui/material'
import usePermissions from '@/hooks/usePermissions'

const UsersHeader = () => {
  const { lang } = useLanguage()
  const { canCreate } = usePermissions();
  return (
    <div className="">
      <div className="page-header-left d-flex align-items-center">
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
          {canCreate("users") && (
            <Button
              component={Link}
              href="/admin/users/create"
              variant="contained"
              className="common-orange-color"
              startIcon={<FiPlus size={16} />}
            >
              {lang('usersView.CreateUser')}
            </Button>
          )}
        </div>
      </div>
      <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
        </div>
      </div>
    </div>
  )
}

export default UsersHeader
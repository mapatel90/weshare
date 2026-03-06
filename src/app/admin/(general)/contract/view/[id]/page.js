"use client"
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ContractDetails from '@/components/admin/contract/ContractDetails'
import DynamicTitle from '@/components/common/DynamicTitle'
import { Button } from '@mui/material'
import { useLanguage } from '@/contexts/LanguageContext'
import { Link } from 'lucide-react'
import { FiArrowLeft } from 'react-icons/fi'

const page = ({ params }) => {
  const { id } = params
  const { lang } = useLanguage()
  return (
    <>
      <DynamicTitle titleKey="contract.contract" />
      <PageHeader>
        {/* You can add a header component later if needed */}
        <div className="page-header">
          <div className="page-header-left d-flex align-items-center">
          </div>
          <div className="page-header-right ms-auto">
            <div className="page-header-right-items">
              <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                <Button
                  href="/admin/contract/list"
                  variant="contained"
                  className="common-orange-color"
                  startIcon={<FiArrowLeft size={16} />}
                >
                  {lang('contract.backToContract', 'Contracts')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <ContractDetails id={id} />
        </div>
      </div>
    </>
  )
}

export default page


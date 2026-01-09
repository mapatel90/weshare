"use client"

import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import InvoiceViewContant from '@/components/admin/invoice/InvoiceViewContant'

const page = ({ params }) => {
  const { id } = params
  return (
    <>
      <DynamicTitle titleKey="invoice.viewinvoice" />
      <PageHeader>
        {/* You can add a header component later if needed */}
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <InvoiceViewContant invoiceId={id} />
        </div>
      </div>
    </>
  )
}

export default page
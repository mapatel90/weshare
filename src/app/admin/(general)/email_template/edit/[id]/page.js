"use client"
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import EmailCreateHeader from '@/components/admin/email_template/EmailCreateHeader'
import SettingsEmailTemplate from '@/components/admin/email_template/EmailTemplate'

const page = ({ params }) => {
  const { id } = params
  return (
    <>
      <DynamicTitle titleKey="email.edittemplate" />
      <PageHeader>
        <EmailCreateHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <SettingsEmailTemplate Id={id} />
        </div>
      </div>
    </>
  )
}

export default page
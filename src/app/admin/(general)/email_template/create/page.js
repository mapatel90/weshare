import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import SettingsEmailTemplate from '@/components/admin/email_template/EmailTemplate'
import EmailCreateHeader from '@/components/admin/email_template/EmailCreateHeader'

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="email.createtemplate" />
      <PageHeader>
        <EmailCreateHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
            <SettingsEmailTemplate />
        </div>
      </div>

    </>
  )
}

export default page
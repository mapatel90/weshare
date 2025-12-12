import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ContractDetails from '@/components/admin/contract/ContractDetails'
import DynamicTitle from '@/components/common/DynamicTitle'

export const metadata = { title: 'WeShare | View Project' }

const page = ({ params }) => {
  const { id } = params
  return (
    <>
      <DynamicTitle titleKey="projects.viewproject" />
      <PageHeader>
        {/* You can add a header component later if needed */}
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


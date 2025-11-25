import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProjectCreateContent from '@/components/admin/projectsCreate/ProjectCreateContent'
import ProjectCreateHeader from '@/components/admin/projectsCreate/ProjectCreateHeader'
import DynamicTitle from '@/components/common/DynamicTitle'

export const metadata = { title: 'WeShare | Create Project' }

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="projects.createproject" />
      <PageHeader>
        <ProjectCreateHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <ProjectCreateContent />
        </div>
      </div>

    </>
  )
}

export default page
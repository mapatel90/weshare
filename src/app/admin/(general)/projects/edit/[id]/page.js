import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProjectCreateHeader from '@/components/projectsCreate/ProjectCreateHeader'
import ProjectEditContent from '@/components/projectsCreate/ProjectEditContent'
import DynamicTitle from '@/components/common/DynamicTitle'

export const metadata = { title: 'WeShare | Edit Project' }

const page = ({ params }) => {
  const { id } = params
  return (
    <>
      <DynamicTitle titleKey="projects.editproject" />
      <PageHeader>
        <ProjectCreateHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <ProjectEditContent projectId={id} />
        </div>
      </div>
    </>
  )
}

export default page


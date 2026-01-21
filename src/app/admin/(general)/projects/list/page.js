'use client'
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProjectsListHeader from '@/components/admin/projectsCreate/ProjectsListHeader'
import ProjectTable from '@/components/admin/projectsCreate/ProjectTable'
import { usePageTitle } from '@/contexts/PageTitleContext';

const page = () => {
    usePageTitle('page_title.projectList');
    return (
        <>
            <PageHeader>
                <ProjectsListHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ProjectTable />
                </div>
            </div>
        </>
    )
}

export default page
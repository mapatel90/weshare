'use client'
import React from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext';
import ProjectTypePage from '@/components/admin/projectsCreate/ProjectType'

const page = () => {
    usePageTitle('projects.projecttype');
    return (
        <>
            <div className='main-content'>
                <div className='row'>
                    <ProjectTypePage />
                </div>
            </div>
        </>
    )
}

export default page
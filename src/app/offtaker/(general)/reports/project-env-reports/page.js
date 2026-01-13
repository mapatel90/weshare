"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import ProjectEnvReport from '@/components/portal/reports/ProjectEnvReport'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
               <ProjectEnvReport />
            </div>
        </>
    )
}

export default page
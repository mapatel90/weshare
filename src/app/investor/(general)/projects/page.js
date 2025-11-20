"use client"
import React from 'react'
import SolarProjectTable from '@/components/portal/projects/ProjectTable'
import AddModal from '@/components/portal/projects/AddModal'
import DynamicTitle from '@/components/common/DynamicTitle'
import ProjectTable from '@/components/portal/investor_projects/ProjectTable'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
                <AddModal />
                <ProjectTable />
            </div>
        </>
    )
}

export default page
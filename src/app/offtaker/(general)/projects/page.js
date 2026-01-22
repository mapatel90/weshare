"use client"
import React from 'react'
import SolarProjectTable from '@/components/portal/projects/ProjectTable'
import AddModal from '@/components/portal/projects/AddModal'
import { usePageTitle } from '@/contexts/PageTitleContext';

const page = () => {
    usePageTitle('page_title.projectList');
    
    return (
        <div className='row'>
            <AddModal />
            <SolarProjectTable />
        </div>
    )
}

export default page
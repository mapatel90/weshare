"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import SavingReports from '@/components/portal/reports/SavingReports'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
               <SavingReports />
            </div>
        </>
    )
}

export default page
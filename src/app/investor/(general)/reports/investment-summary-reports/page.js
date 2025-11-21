"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import SavingReports from '@/components/portal/reports/SavingReports'
import RoiReports from '@/components/portal/reports/RoiReports'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
               <RoiReports />
            </div>
        </>
    )
}

export default page
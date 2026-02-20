"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import RoiReports from '@/components/portal/reports/RoiReports'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.roiReports" />
            <div className='row'>
               <RoiReports />
            </div>
        </>
    )
}

export default page
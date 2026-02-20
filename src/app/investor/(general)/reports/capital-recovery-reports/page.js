"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle' 
import CapitalRecoverReport from '@/components/portal/reports/CapitalRecoverReport'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.capitalRecoveryReports" />
            <div className='row'>
               <CapitalRecoverReport />
            </div>
        </>
    )
}

export default page
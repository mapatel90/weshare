"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import SavingReports from '@/components/portal/reports/SavingReports'
import CashFlowReports from '@/components/portal/reports/CashFlowReports'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
               <CashFlowReports />
            </div>
        </>
    )
}

export default page
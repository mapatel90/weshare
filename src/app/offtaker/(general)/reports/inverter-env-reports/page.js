"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import InverterEnvReport from '@/components/portal/reports/InverterEnvReport'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="projects.projectlist" />
            <div className='row'>
               <InverterEnvReport />
            </div>
        </>
    )
}

export default page
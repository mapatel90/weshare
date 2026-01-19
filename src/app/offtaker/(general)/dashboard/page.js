import React from 'react'
import DashboardView from '@/components/portal/dashboard/OfftakerDashboard'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="dashboard.dashboard" />
            <div className='row'>
                <DashboardView />
            </div>
        </>
    )
}

export default page
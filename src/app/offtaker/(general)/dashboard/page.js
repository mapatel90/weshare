import React from 'react'
import DashboardView from '@/components/portal/dashboard/OfftakerDashboard'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="menu.dashboards" />
            <div className='row'>
                <DashboardView />
            </div>
        </>
    )
}

export default page
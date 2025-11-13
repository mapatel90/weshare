import React from 'react'
import EmailOverview from '@/components/EmailOverview'
import DashboardView from '@/components/portal/dashboard/Dashboard'


const page = () => {
    return (
        <>
            <div className='row'>
                <DashboardView />
            </div>
        </>
    )
}

export default page
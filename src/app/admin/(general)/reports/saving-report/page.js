import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'
import ProjectDayReport from '@/components/admin/reports/ProjectDayReport'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="reports.reports" />
            <PageHeader>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ProjectDayReport />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
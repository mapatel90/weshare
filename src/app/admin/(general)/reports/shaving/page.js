import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import SavingReports from '@/components/reports/SavingReportTable'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="reports.reports" />
            <PageHeader>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <SavingReports />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
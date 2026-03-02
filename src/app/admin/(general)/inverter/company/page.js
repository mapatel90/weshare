import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'
import CompanyTable from '@/components/admin/inverter/company/CompanyTable'
import CompanyHeader from '@/components/admin/inverter/company/CompanyHeader'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.company" />
            <PageHeader>
                <CompanyHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <CompanyTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
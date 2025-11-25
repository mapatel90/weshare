import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import InverterHeader from '@/components/admin/inverter/InverterHeader'
import InverterTable from '@/components/admin/inverter/InverterTable'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="inverter.inverterlist" />
            <PageHeader>
                <InverterHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <InverterTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
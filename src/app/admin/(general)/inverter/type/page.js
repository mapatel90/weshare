'use client'
import React from 'react'
import Footer from '@/components/shared/Footer'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import InverterTypeHeader from '@/components/inverter/InverterTypeHeader'
import InverterTypeTable from '@/components/inverter/InverterTypeTable'
import DynamicTitle from '@/components/common/DynamicTitle'
const page = () => {
    return (
        <>
            <DynamicTitle titleKey="inverter.invertertype" />
            <PageHeader>
                <InverterTypeHeader />
            </PageHeader>

            <div className='main-content'>
                <div className='row'>
                    <InverterTypeTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
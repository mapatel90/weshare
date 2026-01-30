'use client'
import React from 'react'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'
import PayoutsPage from '@/components/admin/payouts/Payouts'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import PayoutsHeader from '@/components/admin/payouts/PayoutsHeader'
import AddPayout from '@/components/admin/payouts/AddPayout'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.payouts" />
            <PageHeader>
                <PayoutsHeader />
            </PageHeader>
            <AddPayout />
            <div className='main-content'>
                <div className='row'>
                    <PayoutsPage />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
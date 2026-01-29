"use client"

import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import PayoutView from '@/components/admin/payouts/PayoutView'

const page = ({ params }) => {
    const { id } = params
    return (
        <>
            <DynamicTitle titleKey="payouts.viewPayout" />
            <PageHeader>
                {/* You can add a header component later if needed */}
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PayoutView payout_id={id} />
                </div>
            </div>
        </>
    )
}

export default page
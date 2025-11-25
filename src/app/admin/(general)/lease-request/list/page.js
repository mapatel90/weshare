"use client";
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import LeaseTable from '@/components/admin/lease_request/LeaseTable';
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="leaseRequest.title" />
            <PageHeader>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <LeaseTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page
'use client'
import React from 'react'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'
import PaymentsPage from '@/components/admin/payments/payment'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.payments" />
            <PaymentsPage />
            <Footer />
        </>
    )
}

export default page
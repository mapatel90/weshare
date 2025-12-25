import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import InvoiceTable from '@/components/admin/invoice/InvoiceTable'
import InvoiceHeader from '@/components/admin/invoice/InvoiceHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import PaymentsPage from '@/components/admin/payments/payment'

const page = () => {
    return (
        <>
            <PaymentsPage />
            <Footer />
        </>
    )
}

export default page
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import InvoicePage from '@/components/portal/billings/InvoicePage'

const page = ({ params }) => {
    const invoiceId = params?.id || null;

    return (
        <>
            <DynamicTitle titleKey="billings.billings" />
            <div className='row'>
                <InvoicePage invoiceId={invoiceId} />
            </div>
        </>
    )
}

export default page
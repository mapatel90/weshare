import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import InvoicePage from '@/components/portal/billings/InvoicePage'


const page = () => {
    return (
        <>
            <DynamicTitle titleKey="billings.billinglist" />
            <div className='row'>
                <InvoicePage />
            </div>
        </>
    )
}

export default page
'use client';

import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import Payments from '@/components/portal/payments/Payment'


const page = () => {
    return (
        <>
            <DynamicTitle titleKey="payments.paymentlist" />
            <div className='row'>
                <Payments />
            </div>
        </>
    )
}

export default page
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import Billings from '@/components/portal/billings/Billings'


const page = () => {
    return (
        <>
            <DynamicTitle titleKey="billings.billings" />
            <div className='row'>
                <Billings />
            </div>
        </>
    )
}

export default page
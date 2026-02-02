import React from 'react'
import ContractsView from '@/components/portal/contracts/ContractsView'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="contract.contract" />
            <div className='row'>
                <ContractsView />
            </div>
        </>
    )
}

export default page
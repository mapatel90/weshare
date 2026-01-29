import React from 'react';
import DynamicTitle from '@/components/common/DynamicTitle';
import ContractsDetails from '@/components/portal/contracts/ContractsDetails';
import PayoutView from '@/components/portal/payouts/PayoutView';

const page = ({ params }) => {
    const { id } = params;
    return (
        <>
            <DynamicTitle titleKey="payouts.viewPayout" />
            <>
                <PayoutView payout_id={id} />
            </>

        </>
    );
};

export default page;
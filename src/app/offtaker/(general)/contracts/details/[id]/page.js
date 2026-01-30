import React from 'react';
import DynamicTitle from '@/components/common/DynamicTitle';
import ContractsDetails from '@/components/portal/contracts/ContractsDetails';

const page = ({ params }) => {
  const { id } = params;
  return (
    <>
      <DynamicTitle titleKey="contract.viewcontract" />
      <>
          <ContractsDetails contractId={id} />
      </>

    </>
  );
};

export default page;
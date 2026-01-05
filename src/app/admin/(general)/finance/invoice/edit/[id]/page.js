import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import InvoiceCreateHeader from "@/components/admin/invoice/InvoiceCreateHeader";
import InvoiceCreateForm from "@/components/admin/invoice/InvoiceCreateForm";
import DynamicTitle from "@/components/common/DynamicTitle";

const page = ({ params }) => {
  const invoiceId = params?.id;

  return (
    <>
        <DynamicTitle titleKey="invoice.updateInvoice" />
        <PageHeader>
            <InvoiceCreateHeader />
        </PageHeader>
        <div className='main-content'>
            <div className='row'>
                <InvoiceCreateForm invoiceId={invoiceId} />
            </div>
        </div>
    </>
  )
}

export default page
"use client";
import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";
import ContractAdminTable from "@/components/admin/contract/ContractAdminTable";
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="contract.contract" />
            <PageHeader>
            </PageHeader>
            <div className="main-content">
                <div className="row">
                    {/* ContractAdminTable component should be placed here */}
                    <ContractAdminTable />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default page;
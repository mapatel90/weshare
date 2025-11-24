import React from "react";
import ContractsDetails from "@/components/portal/contracts/ContractsDetails";

export default function ContractDetailsPage({ params }) {
    // Next.js app router passes params as a prop
    const { id } = params;
    return <ContractsDetails contractId={id} />;
}

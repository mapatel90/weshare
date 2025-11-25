import React from "react";
import RoleTable from "@/components/admin/role/RoleTable";
import DynamicTitle from "@/components/common/DynamicTitle";

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <RoleTable />
        </>
    )
}

export default page 
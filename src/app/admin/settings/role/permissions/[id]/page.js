"use client";
import React from "react";
import RolePermissions from "@/components/admin/role/RolePermissions";
import DynamicTitle from "@/components/common/DynamicTitle";

const PermissionsPage = ({ params }) => {
  const { id } = params;
  
  return (
    <>
      <DynamicTitle titleKey="roles.managePermissions" />
      <div className="content-area" data-scrollbar-target="#psScrollbarInit">
        <div className="content-area-body">
          <RolePermissions roleId={id} />
        </div>
      </div>
    </>
  );
};

export default PermissionsPage;


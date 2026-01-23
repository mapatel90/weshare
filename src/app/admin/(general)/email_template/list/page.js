"use client";
import React from "react";
import EmailHeader from "@/components/admin/email_template/EmailHeader";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";
import DynamicTitle from "@/components/common/DynamicTitle";
import EmailTemplateTable from "@/components/admin/email_template/EmailTemplateTable";

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="email.templates" />
      <PageHeader>
        <EmailHeader />
      </PageHeader>
      <div className="main-content">
        <div className="row">
            <EmailTemplateTable />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default page;

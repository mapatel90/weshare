import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";
import DynamicTitle from "@/components/common/DynamicTitle";
import CapitalRecoverReport from "@/components/admin/reports/CapitalRecoverReport";

const Page = () => {
  return (
    <>
      <DynamicTitle titleKey="menu.capital-recovery-reports" />
      <PageHeader></PageHeader>
      <div className="main-content">
        <div className="row">
          <CapitalRecoverReport />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Page;
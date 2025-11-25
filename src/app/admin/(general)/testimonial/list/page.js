import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import TestimonialHeader from "@/components/admin/testimonial/TestimonialHeader";
import TestimonialTable from "@/components/admin/testimonial/TestimonialTable";
import Footer from "@/components/shared/Footer";
import DynamicTitle from "@/components/common/DynamicTitle";

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="testimonial.title" />
      <PageHeader>
        <TestimonialHeader />
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <TestimonialTable />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default page;

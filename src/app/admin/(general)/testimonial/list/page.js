import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import TestimonialHeader from "@/components/testimonial/TestimonialHeader";
import TestimonialTable from "@/components/testimonial/TestimonialTable";
import Footer from "@/components/shared/Footer";

const page = () => {
  return (
    <>
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

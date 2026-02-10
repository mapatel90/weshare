'use client';
import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";
import usePermissions from "@/hooks/usePermissions";

const TestimonialHeader = () => {
  const { lang } = useLanguage();
  const { canCreate } = usePermissions();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("testimonial:open-edit", { detail: { item: null } })
      );
    }
  };

  return (
    <div className="d-flex align-items-center">
      {canCreate("testimonials") && (
        <Button
          variant="contained"
          className="common-orange-color"
          onClick={openAddModal}
          startIcon={<FiPlus size={17} />}
        >
          {lang("testimonial.add") || "Add Testimonial"}
        </Button>
      )}
    </div>
  );
};

export default TestimonialHeader;

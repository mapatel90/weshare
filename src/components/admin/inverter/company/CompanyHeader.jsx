'use client';

import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
// import { Button } from "bootstrap/dist/js/bootstrap.bundle.min";
import { Button } from "@mui/material";

const CompanyHeader = () => {
  const { lang } = useLanguage();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      // Open as 'add' mode by resetting with no item passed
      window.dispatchEvent(
        new CustomEvent("inverter:open-edit", { detail: { item: null } })
      );
    }
  };

  return (
    <div className="d-flex align-items-center">
      <Button
        variant="contained"
        className="common-orange-color"
        onClick={openAddModal}
        startIcon={<FiPlus size={17} />}
      >
        {lang("inverter.add_company")}
      </Button>
    </div>
  );
};

export default CompanyHeader;

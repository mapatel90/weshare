'use client';

import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
// import { Button } from "bootstrap/dist/js/bootstrap.bundle.min";
import { Button } from "@mui/material";

const InverterTypeHeader = () => {
  const { lang } = useLanguage();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inverterType:open-edit", { detail: { item: null } }));
    }
  };

  return (
    <div className="d-flex align-items-center">
      {/* <button className="btn btn-primary" type="button" onClick={openAddModal}>
        <FiPlus className="me-2" size={17} />
        {lang("inverterType.addType")}
      </button> */}
      <Button variant="contained" className="common-orange-color" onClick={openAddModal} startIcon={<FiPlus size={17} />}>
        {lang("inverterType.addType")}
      </Button>
    </div>
  );
};

export default InverterTypeHeader;



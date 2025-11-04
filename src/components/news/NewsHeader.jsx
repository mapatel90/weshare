'use client';
import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
// import { Button } from "bootstrap/dist/js/bootstrap.bundle.min";
import { Button } from "@mui/material";

const NewsHeader = () => {
  const { lang } = useLanguage();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      // Open as 'add' mode by resetting with no item passed
      window.dispatchEvent(
        new CustomEvent("news:open-edit", { detail: { item: null } })
      );
    }
  };

  return (
    <div className="d-flex align-items-center">
      {/* <button className="btn btn-primary" type="button" onClick={openAddModal}>
        <FiPlus className="me-2" size={17} />
        {lang("inverter.addInverter")}
      </button> */}
      <Button
        variant="contained"
        className="common-orange-color"
        onClick={openAddModal}
        startIcon={<FiPlus size={17} />}
      >
        {lang("news.addNews")}
      </Button>
    </div>
  );
};

export default NewsHeader;
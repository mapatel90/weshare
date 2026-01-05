"use client";
import React from "react";
import { FiFilter, FiLayers, FiPlus, FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";

const InvoiceCreateHeader = () => {
  const router = useRouter();
  const { lang } = useLanguage();

  return (
    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
      <Button
        variant="contained"
        onClick={() => router.push("/admin/finance/invoice")}
        startIcon={<FiArrowLeft size={16} />}
        className="common-orange-color"
      >
        {lang("common.back", "Back")} {lang("navigation.invoices", "Invoices")}
      </Button>
    </div>
  );
};

export default InvoiceCreateHeader;

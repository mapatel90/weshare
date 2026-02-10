"use client";
import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";
import usePermissions from "@/hooks/usePermissions";

const InvoiceHeader = () => {
  const { lang } = useLanguage();
  const { canCreate } = usePermissions();
  return (
    <div className="d-flex align-items-center">
      {canCreate("invoices") && (
        <Button
          variant="contained"
          className="common-orange-color"
          href="/admin/finance/invoice/create"
          startIcon={<FiPlus size={17} />}
        >
          {lang("invoice.addInvoice")}
        </Button>
      )}
    </div>
  );
};

export default InvoiceHeader;


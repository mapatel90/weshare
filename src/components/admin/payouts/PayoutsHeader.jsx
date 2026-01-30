"use client";
import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/constants/roles";

const PayoutsHeader = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("payout:open-edit", { detail: { item: null } }));
    }
  };

  return (
    <div className="d-flex align-items-center">
      {user?.role === ROLES.SUPER_ADMIN && (
        <Button
          variant="contained"
          className="common-orange-color"
          onClick={openAddModal}
          startIcon={<FiPlus size={17} />}
        >
          {lang("payouts.addPayout")}
        </Button>
      )}
    </div>
  );
};

export default PayoutsHeader;


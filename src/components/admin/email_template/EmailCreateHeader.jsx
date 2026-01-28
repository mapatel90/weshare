'use client';
import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { Button } from "@mui/material";
import { useLanguage } from "@/contexts/LanguageContext";

const EmailCreateHeader = () => {
  const { lang } = useLanguage();
  return (
    <div className="d-flex align-items-center">
      <Link href="/admin/email_template/list">
        <Button
          variant="outlined"
          startIcon={<FiArrowLeft size={17} />}
        >
          {lang("common.back") || "Back"}
        </Button>
      </Link>
    </div>
  );
};

export default EmailCreateHeader;

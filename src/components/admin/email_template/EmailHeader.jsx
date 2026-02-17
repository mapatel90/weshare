'use client';
import React from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";
import usePermissions from "@/hooks/usePermissions";

const EmailHeader = () => {
  const { lang } = useLanguage();
  const { canCreate } = usePermissions();
  return (
    <div className="d-flex align-items-center">
      {canCreate("email_templates") && (
        <Link href="/admin/email_template/create">
          <Button
            variant="contained"
            className="common-orange-color"
            startIcon={<FiPlus size={17} />}
          >
            {lang("email.addTemplate")}
          </Button>
        </Link>
      )}
    </div>
  );
};

export default EmailHeader;
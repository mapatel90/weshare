'use client';
import React from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
// import { Button } from "bootstrap/dist/js/bootstrap.bundle.min";
import { Button } from "@mui/material";

const EmailHeader = () => {
  const { lang } = useLanguage();

  return (
    <div className="d-flex align-items-center">
      {/* <button className="btn btn-primary" type="button" onClick={openAddModal}>
        <FiPlus className="me-2" size={17} />
        {lang("inverter.addInverter")}
      </button> */}
      <Link href="/admin/email_template/create">
        <Button
          variant="contained"
          className="common-orange-color"
          startIcon={<FiPlus size={17} />}
        >
          {lang("email.addTemplate")}
        </Button>
      </Link>
    </div>
  );
};

export default EmailHeader;
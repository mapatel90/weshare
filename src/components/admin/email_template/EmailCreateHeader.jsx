'use client';
import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { Button } from "@mui/material";

const EmailCreateHeader = () => {
  return (
    <div className="d-flex align-items-center">
      <Link href="/admin/email_template/list">
        <Button
          variant="outlined"
          startIcon={<FiArrowLeft size={17} />}
        >
          Back
        </Button>
      </Link>
    </div>
  );
};

export default EmailCreateHeader;

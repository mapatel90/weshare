"use client";
import React from "react";
import { FiPlus } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";
import usePermissions from "@/hooks/usePermissions";

const BlogHeader = () => {
  const { lang } = useLanguage();
  const { canCreate } = usePermissions();

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("blog:open-edit", { detail: { item: null } })
      );
    }
  };

  return (
    <div className="d-flex align-items-center">
      {canCreate("blog") && (
        <Button
          variant="contained"
          className="common-orange-color"
          onClick={openAddModal}
          startIcon={<FiPlus size={17} />}
        >
          {lang("blog.addBlog") || "Add Blog"}
        </Button>
      )}
    </div>
  );
};

export default BlogHeader;



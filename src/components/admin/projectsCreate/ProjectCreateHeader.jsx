"use client";
import React from "react";
import { FiFilter, FiLayers, FiPlus, FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material";

const ProjectCreateHeader = () => {
  const router = useRouter();
  const { lang } = useLanguage();

  return (
    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
      {/* <button type="button" className="btn common-orange-color" onClick={() => router.push('/admin/projects/list')}>
                <FiArrowLeft size={16} className='me-2' />
                <span>{lang('common.back', 'Back')} {lang('navigation.projects', 'Projects')}</span>
            </button> */}
      <Button
        variant="contained"
        onClick={() => router.push("/admin/projects/list")}
        startIcon={<FiArrowLeft size={16} />}
        className="common-orange-color"
      >
        {lang("common.back", "Back")} {lang("navigation.projects", "Projects")}
      </Button>
    </div>
  );
};

export default ProjectCreateHeader;

"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import MeterReadingTable from "@/components/admin/projectsCreate/meter_reading/MeterReadingTable";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import ProjectCreateHeader from "@/components/admin/projectsCreate/ProjectCreateHeader";

const MeterReadingsPage = () => {
  const params = useParams();
  const { lang } = useLanguage();
  const projectId = params?.id ? String(params.id) : null;
  const [projectName, setProjectName] = useState("");
  const [offtakerId, setOfftakerId] = useState(null);

  usePageTitle("meter.meterReadings");

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet(`/api/projects/${projectId}`);
        if (cancelled) return;
        if (res?.success && res?.data) {
          setProjectName(res.data.project_name || "");
          setOfftakerId(res.data.offtaker?.id ? String(res.data.offtaker.id) : null);
        }
      } catch {
        if (!cancelled) {
          setProjectName("");
          setOfftakerId(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <>
      <PageHeader>
      <ProjectCreateHeader />
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <MeterReadingTable projectId={projectId} projectName={projectName} offtakerId={offtakerId} />
        </div>
      </div>
    </>
  );
};

export default MeterReadingsPage;

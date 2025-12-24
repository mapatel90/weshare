"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";

const ContractDetails = () => {
  const { lang } = useLanguage();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const contractId = useMemo(() => params?.id || params?.contractId, [params]);

  useEffect(() => {
    if (!contractId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet("/api/contracts?id=" + contractId);
        if (res?.success && res?.data) {
          const payload = Array.isArray(res.data) ? res.data[0] : res.data;
          setData(payload || null);
        } else {
          setData(null);
          showErrorToast(lang("common.error", "Contract not found"));
        }
      } catch (e) {
        setData(null);
        showErrorToast(lang("common.error", "Error loading contract"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contractId, lang]);

  const contractName = data?.contract_title || "-";
  const contractStatus =
    data?.status === 0 ? "Pending" :
      data?.status === 1 ? "Active" :
        data?.status === 2 ? "Inactive" : "-";
  const contractDate = data?.contract_date
    ? new Date(data.contract_date).toLocaleDateString("en-GB")
    : "-";
  const contractDescription = data?.contract_description || "-";
  const documentUrl = data?.document_upload || "-";

  const project = data?.projects || {};
  const projectName = project?.project_name || "-";
  const projectStatus = project?.status === 1 ? "Active" : project?.status === 0 ? "Inactive" : "-";
  const projectType = project?.project_type?.name || "-";
  const weshareProfile = project?.weshare_profit || "-";
  const meterUrl = project?.meter_url || "-";
  const simNumber = project?.sim_number || "-";
  const country = project?.countries?.name || "-";
  const state = project?.states?.name || "-";
  const city = project?.cities?.name || "-";
  const zipcode = project?.zipcode || "-";
  const addressLine1 = project?.address_1 || project?.address_line1 || "-";

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1400px" }}>

      {loading ? (
        <div className="card">
          <div className="card-body py-5 text-center">
            {lang("common.loading", "Loading...")}
          </div>
        </div>
      ) : !data ? (
        <div className="card">
          <div className="card-body py-5 text-center text-muted">
            {lang("common.noData", "No contract data")}
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold mb-0">{contractName}</h3>
            <span
              className={`badge px-3 py-2 shadow-sm ${data?.status === 0
                  ? 'bg-warning text-white'
                  : data?.status === 1
                    ? 'bg-success text-white'
                    : 'bg-danger text-white'
                }`}
              style={{ fontSize: "0.9rem" }}
            >
              {contractStatus}
            </span>
          </div>

          {/* Contract Summary Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-4">{lang('contract.contract_summary', 'Contract Summary')}</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('contract.title', 'Contract Name')}</div>
                  <div style={{ color: "#8B4513" }}>{contractName}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('contract.date', 'Contract Date')}</div>
                  <div>{contractDate}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('contract.description', 'Contract Description')}</div>
                  <div>{contractDescription}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('contract.document', 'Contract Document')}</div>
                  {documentUrl ? (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary"
                      style={{ textDecoration: "none" }}
                    >
                      View File
                    </a>
                  ) : (
                    <div>-</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project Information Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-4">{lang('projectView.projectInformation.project_Information', 'Project Information')}</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('projects.projectName', 'Project Name')}</div>
                  <div style={{ color: "#8B4513" }}>{projectName}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('projects.status', 'Status')}</div>
                  <div>{projectStatus}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('projects.projectType', 'Project Type')}</div>
                  <div>{projectType}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('projects.weshareprofite', 'Weshare profite')}</div>
                  <div>{weshareProfile}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('meter.meterUrl', 'Meter Url')}</div>
                  <div>{meterUrl}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">{lang('projects.sim_number', 'SIM Number')}</div>
                  <div>{simNumber}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">{lang('projects.country', 'Country')}</div>
                  <div>{country}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">{lang('projects.state', 'State')}</div>
                  <div>{state}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">{lang('projects.city', 'City')}</div>
                  <div>{city}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">{lang('projects.zipcode', 'Zip Code')}</div>
                  <div>{zipcode}</div>
                </div>
                <div className="col-md-12">
                  <div className="mb-1 text-muted">{lang('projects.addressLine1', 'Address Line 1')}</div>
                  <div>{addressLine1}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractDetails;
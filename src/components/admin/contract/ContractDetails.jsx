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

  const contractName = data?.contractTitle || "-";
  const contractDate = data?.contractDate
    ? new Date(data.contractDate).toLocaleDateString("en-GB")
    : "-";
  const contractDescription = data?.contractDescription || "-";
  const documentUrl = data?.documentUpload;

  const project = data?.project || {};
  const projectName = project?.project_name || "-";
  const projectStatus = project?.status === 1 ? "Active" : project?.status === 0 ? "Inactive" : "-";
  const projectType = project?.projectType?.name || "-";
  const weshareProfile = project?.weshare_profit || "-";
  const meterName = project?.meter_name || "-";
  const meterNumber = project?.meter_number || "-";
  const simNumber = project?.sim_number || "-";
  const country = project?.country?.name || project?.country_name || "-";
  const state = project?.state?.name || project?.state_name || "-";
  const city = project?.city?.name || project?.city_name || "-";
  const zipcode = project?.zipcode || "-";
  const addressLine1 = project?.address1 || project?.address_line1 || "-";

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
          <h3 className="fw-bold mb-4">{contractName}</h3>

          {/* Contract Summary Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-4">Contract Summary</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Contract Name</div>
                  <div style={{ color: "#8B4513" }}>{contractName}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Contract Date</div>
                  <div>{contractDate}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Contract Description</div>
                  <div>{contractDescription}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Contract Document</div>
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
              <h5 className="fw-bold mb-4">Project Information</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Project Name</div>
                  <div style={{ color: "#8B4513" }}>{projectName}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Status</div>
                  <div>{projectStatus}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Project Type</div>
                  <div>{projectType}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Weshare profile</div>
                  <div>{weshareProfile}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Meter Name</div>
                  <div>{meterName}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">Meter Number</div>
                  <div>{meterNumber}</div>
                </div>
                <div className="col-md-6">
                  <div className="mb-1 text-muted">SIM Number</div>
                  <div>{simNumber}</div>
                </div>
                <div className="col-md-6"></div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">Country</div>
                  <div>{country}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">State</div>
                  <div>{state}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">City</div>
                  <div>{city}</div>
                </div>
                <div className="col-md-3">
                  <div className="mb-1 text-muted">Zipcode</div>
                  <div>{zipcode}</div>
                </div>
                <div className="col-md-12">
                  <div className="mb-1 text-muted">Address Line 1</div>
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
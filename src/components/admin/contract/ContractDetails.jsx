"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { apiGet } from "@/lib/api";
import { showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";

const badgeClass = (status) => {
  if (status === 1) return "badge bg-soft-success text-success";
  if (status === 0) return "badge bg-soft-warning text-warning";
  return "badge bg-soft-danger text-danger";
};

const statusLabel = (lang, status) => {
  if (status === 1) return lang("common.actives", "Approved");
  if (status === 0) return lang("common.pending", "Pending");
  return lang("common.inactives", "Rejected");
};

const ContractDetails = () => {
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const contractId = useMemo(() => params?.id || params?.contractId, [params]);

  useEffect(() => {
    if (!contractId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/api/contracts/${contractId}`);
        if (res?.success && res?.data) {
          setData(res.data);
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

  const contractType = useMemo(() => {
    if (!data) return "-";
    if (data.investorId || data.investor_id)
      return lang("contract.investor", "Investor");
    if (data.offtakerId || data.offtaker_id)
      return lang("contract.offtaker", "Offtaker");
    return "-";
  }, [data, lang]);

  const partyName = useMemo(() => {
    if (!data) return "-";
    if (data.investor) return data.investor.fullName || "-";
    if (data.offtaker) return data.offtaker.fullName || "-";
    return "-";
  }, [data]);

  const projectName = data?.project?.project_name || "-";
  const contractTitle = data?.contractTitle || "-";
  const contractDate = data?.contractDate
    ? new Date(data.contractDate).toLocaleDateString()
    : "-";
  const documentUrl = data?.documentUpload;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-light d-inline-flex align-items-center gap-2"
          onClick={() => router.back()}
        >
          <FiArrowLeft size={18} />
          {lang("common.back", "Back")}
        </button>
        <h5 className="mb-0 fw-bold">
          {lang("contract.details", "Contract Details")}
        </h5>
      </div>

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
        <div className="card shadow-sm">
          <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted small">
                {lang("contract.id", "Contract ID")}
              </div>
              <div className="fw-semibold">#{data.id}</div>
            </div>
            <span className={badgeClass(data.status)}>
              {statusLabel(lang, data.status)}
            </span>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="text-muted small mb-1">
                  {lang("contract.title", "Title")}
                </div>
                <div className="fw-semibold">{contractTitle}</div>
              </div>

              <div className="col-md-6">
                <div className="text-muted small mb-1">
                  {lang("contract.project", "Project")}
                </div>
                <div className="fw-semibold">{projectName}</div>
              </div>

              <div className="col-md-4">
                <div className="text-muted small mb-1">
                  {lang("contract.type", "Type")}
                </div>
                <div className="fw-semibold">{contractType}</div>
              </div>

              <div className="col-md-4">
                <div className="text-muted small mb-1">
                  {lang("contract.partyName", "Party Name")}
                </div>
                <div className="fw-semibold">{partyName}</div>
              </div>

              <div className="col-md-4">
                <div className="text-muted small mb-1">
                  {lang("contract.date", "Date")}
                </div>
                <div className="fw-semibold">{contractDate}</div>
              </div>

              <div className="col-md-12">
                <div className="text-muted small mb-1">
                  {lang("contract.document", "Document")}
                </div>
                {documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                  >
                    <FiExternalLink size={16} />
                    {lang("contract.viewDocument", "View document")}
                  </a>
                ) : (
                  <div className="fw-semibold">-</div>
                )}
              </div>

              {data?.notes && (
                <div className="col-12">
                  <div className="text-muted small mb-1">
                    {lang("contract.notes", "Notes")}
                  </div>
                  <div className="fw-semibold">{data.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetails;
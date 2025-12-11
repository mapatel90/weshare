"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiEye } from "react-icons/fi";
import { showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";

const ContractAdminTable = () => {
  const { lang } = useLanguage();
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await apiGet("/api/contracts");
      if (res?.success) {
        setContracts(Array.isArray(res.data) ? res.data : []);
      } else {
        setContracts([]);
      }
    } catch (e) {
      setContracts([]);
      showErrorToast(lang("common.error", "Error loading contracts"));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "contractTitle",
      header: () => lang("contract.title", "Title"),
      cell: (info) => {
        const v = info.getValue() || "-";
        return (
          <div
            title={v}
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {v}
          </div>
        );
      },
    },
    {
      accessorKey: "projectName",
      header: () => lang("contract.project", "Project"),
      cell: (info) => {
        const row = info.row?.original || {};
        const projectName = row.project?.project_name || "-";
        return (
          <div
            title={projectName}
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {projectName}
          </div>
        );
      },
    },
    {
      accessorKey: "contractType",
      header: () => lang("contract.type", "Type"),
      cell: (info) => {
        const row = info.row?.original || {};
        let typeLabel = "-";
        if (row.investorId || row.investor_id) {
          typeLabel = lang("contract.investor", "Investor");
        } else if (row.offtakerId || row.offtaker_id) {
          typeLabel = lang("contract.offtaker", "Offtaker");
        }
        return (
          <div
            title={typeLabel}
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {typeLabel}
          </div>
        );
      },
    },
    {
      accessorKey: "partyName",
      header: () => lang("contract.partyName", "Party Name"),
      cell: (info) => {
        const row = info.row?.original || {};
        let name = "-";
        if (row.investorId || row.investor_id) {
          const investor = row.investor;
          name = investor?.fullName || "-";
        } else if (row.offtakerId || row.offtaker_id) {
          const offtaker = row.offtaker;
          name = offtaker?.fullName || "-";
        }
        return (
          <div
            title={name}
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
        );
      },
    },
    {
      accessorKey: "documentUpload",
      header: () => lang("contract.document", "Document"),
      cell: (info) => {
        const v = info.getValue();
        return v ? (
          <a href={v} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "contractDate",
      header: () => lang("contract.date", "Date"),
      cell: (info) => {
        const v = info.getValue();
        if (!v) return "-";
        try {
          const d = new Date(v);
          return d.toLocaleDateString();
        } catch {
          return v;
        }
      },
    },
    {
      accessorKey: "status",
      header: () => lang("common.status", "Status"),
      cell: (info) =>
        info.getValue() == 0 ? (
          <span className="badge bg-soft-warning text-warning">
            {lang("common.pending", "Pending")}
          </span>
        ) : info.getValue() == 1 ? (
          <span className="badge bg-soft-success text-success">
            {lang("common.actives", "Approved")}
          </span>
        ) : (
          <span className="badge bg-soft-danger text-danger">
            {lang("common.inactives", "Rejected")}
          </span>
        ),
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="hstack gap-2 justify-content-start">
            <a
              href={`/admin/contract/view/${item.id}`}
              className="avatar-text avatar-md"
            >
              <FiEye />
            </a>
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="contract-admin-table">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          {lang("contract.allContracts", "All Contracts")}
        </h6>
      </div>

      {loading ? (
        <div className="text-center p-4">
          {lang("common.loading", "Loading...")}
        </div>
      ) : (
        <Table data={contracts} columns={columns} />
      )}
    </div>
  );
};

export default ContractAdminTable;

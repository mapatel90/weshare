"use client";
import React, { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import Table from "@/components/shared/table/Table";
import { FiEye } from "react-icons/fi";
import { showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";

const ContractAdminTable = () => {
  const PAGE_SIZE = 20;
  const { lang } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offtakerFilter, setOfftakerFilter] = useState("");
  const [investorFilter, setInvestorFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });

  // Dropdown lists
  const [projectList, setProjectList] = useState([]);
  const [offtakerList, setOfftakerList] = useState([]);
  const [investorList, setInvestorList] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, [projectFilter, statusFilter, offtakerFilter, investorFilter, searchTerm, startDate, endDate]);

  const filteredData = useMemo(() => {
    return contracts.filter((d) => {
      if (projectFilter && String(d.projectId) !== projectFilter) return false;
      if (statusFilter && String(d.status) !== statusFilter) return false;
      if (offtakerFilter && String(d.offtakerId) !== offtakerFilter) return false;
      if (investorFilter && String(d.investorId) !== investorFilter) return false;
      return true;
    });
  }, [projectFilter, statusFilter, offtakerFilter, investorFilter, contracts]);


  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate date range
      if (startDate && endDate) {
        const startTs = new Date(`${startDate}T00:00:00`);
        const endTs = new Date(`${endDate}T23:59:59`);
        if (startTs > endTs) {
          setError("Start date cannot be after end date.");
          setLoading(false);
          setHasLoadedOnce(true);
          return;
        }
      }

      const params = new URLSearchParams({
        page: "1",
        downloadAll: "1",
      });

      if (projectFilter) {
        params.append("projectId", projectFilter);
      }

      if (statusFilter !== "") {
        params.append("status", statusFilter);
      }

      if (offtakerFilter) {
        params.append("offtakerId", offtakerFilter);
      }

      if (investorFilter) {
        params.append("investorId", investorFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const res = await apiGet(`/api/contracts?${params.toString()}`);
      if (res?.success) {
        const mappedContracts = (Array.isArray(res.data) ? res.data : []).map(
          (item) => {
            const projectName = item.project?.project_name || "";
            const investorName = item.investor?.fullName || "";
            const offtakerName = item.offtaker?.fullName || "";
            const partyName = investorName || offtakerName || "";

            return {
              ...item,
              projectName,
              partyName,
            };
          }
        );

        setContracts(mappedContracts);
        setProjectList(Array.isArray(res?.projectList) ? res.projectList : []);
        setOfftakerList(Array.isArray(res?.offtakerList) ? res.offtakerList : []);
        setInvestorList(Array.isArray(res?.investorList) ? res.investorList : []);

        const apiTotal = res?.pagination?.total ?? (Array.isArray(res.data) ? res.data.length : 0);
        setPagination({
          page: 1,
          limit: PAGE_SIZE,
          total: apiTotal,
          pages: Math.max(1, Math.ceil(apiTotal / PAGE_SIZE)),
        });
      } else {
        setContracts([]);
      }
      setError(null);
    } catch (e) {
      setContracts([]);
      setError(e?.message || "Error loading contracts");
      showErrorToast(lang("common.error", "Error loading contracts"));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const columns = [
    {
      accessorKey: "contract_title",
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
      accessorKey: "project_name",
      header: () => lang("contract.project", "Project"),
      cell: (info) => {
        const row = info.row?.original || {};
        const projectName = row.projects?.project_name ? row.projects?.project_name : "-";
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
        const name =
          row.partyName ||
          (row.investorId || row.investor_id
            ? row.users?.full_name
            : row.users?.full_name) ||
          "-";
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
      accessorKey: "contract_date",
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
            {/* <a
              href={`/admin/contract/view/${item.id}`}
              className="avatar-text avatar-md"
              target="_blank"
            >
              <FiEye />
            </a> */}
            <Link href={`/admin/contract/view/${item.id}`} target="_blank">
              <span className="avatar-text avatar-md">
                <FiEye />
              </span>
            </Link>
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="contract-admin-table p-6 bg-white rounded-3xl shadow-md">
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
          >
            <option value="">{lang("reports.allprojects", "All Projects")}</option>
            {projectList.map((p) => (
              <option
                key={p.id ?? p.project_id}
                value={p.id ?? p.project_id}
              >
                {p.project_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("common.allStatus", "All Status")}</option>
            <option value="0">{lang("common.pending", "Pending")}</option>
            <option value="1">{lang("common.actives", "Approved")}</option>
            <option value="2">{lang("common.inactives", "Rejected")}</option>
          </select>

          <select
            value={offtakerFilter}
            onChange={(e) => setOfftakerFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("contract.allOfftakers", "All Offtakers")}</option>
            {offtakerList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>

          <select
            value={investorFilter}
            onChange={(e) => setInvestorFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("contract.allInvestors", "All Investors")}</option>
            {investorList.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
            placeholder={lang("common.startDate") || "Start Date"}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
            placeholder={lang("common.endDate") || "End Date"}
          />
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.loading", "Loading...")}
          </div>
        )}

        {error && <div className="text-red-600">Error: {error}</div>}

        {hasLoadedOnce && filteredData.length === 0 && !error && !loading && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.noData", "No Data")}
          </div>
        )}

        {hasLoadedOnce && (
          <>
            <Table
              data={filteredData}
              columns={columns}
              disablePagination={false}
              onSearchChange={setSearchTerm}
              serverSideTotal={pagination.total}
              initialPageSize={PAGE_SIZE}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContractAdminTable;

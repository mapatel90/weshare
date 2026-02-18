"use client";
import React, { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import Table from "@/components/shared/table/Table";
import { FiEye } from "react-icons/fi";
import { showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import { Autocomplete, TextField } from "@mui/material";
import { buildUploadUrl } from "@/utils/common";

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
      header: () => lang("home.exchangeHub.project", "Project"),
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
      header: () => lang("menu.type", "Type"),
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
      header: () => lang("common.partyName", "Party Name"),
      cell: (info) => {
        const row = info.row?.original || {};
        let name = row.partyName || "-";
        if (row.investorId || row.investor_id) {
          const interestedInvestors = row?.projects?.interested_investors || [];
          if (Array.isArray(interestedInvestors)) {
            const matchingInvestor = interestedInvestors.find(
              (inv) => Number(inv.user_id) === Number(row.investorId || row.investor_id)
            );
            name = matchingInvestor?.full_name || "-";
          }
        } else if (row.offtakerId || row.offtaker_id) {
          name = row.users?.full_name || "-";
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
      accessorKey: "document_upload",
      header: () => lang("contract.document", "Document"),
      cell: (info) => {
        const v = info.getValue();
        console.log("VALUE", v);
        return v ? (
          <a href={buildUploadUrl(v)} target="_blank" rel="noreferrer">
            {lang("common.view", "View")}
          </a>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "signed_document_upload",
      header: () => lang("contract.signedDocument", "Signed Document"),
      cell: (info) => {
        const v = info.getValue();
        return v ? (
          <a href={buildUploadUrl(v)} target="_blank" rel="noreferrer">
            {lang("common.view", "View")}
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
        ) : info.getValue() == 2 ? (
          <span className="badge bg-soft-danger text-danger">
            {lang("common.rejected", "Rejected")}
          </span>
        ) : info.getValue() == 4 ? (
          <span className="badge bg-soft-info text-info">
            {lang("common.cancel", "Cancel")}
          </span>
        ) : null,
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
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full">
        <div className="filter-button" style={{ display: "flex", gap: "1.5%", flexWrap: "nowrap", alignItems: "center" }}>
          <Autocomplete
            size="small"
            options={projectList}
            value={
              projectList.find(
                (p) => (p.id ?? p.project_id) === projectFilter
              ) || null
            }
            onChange={(e, newValue) => {
              setProjectFilter(newValue ? (newValue.id ?? newValue.project_id) : "");
            }}
            getOptionLabel={(option) =>
              option.project_name ||
              option.projectName ||
              `Project ${option.id ?? option.project_id ?? ""}`
            }
            isOptionEqualToValue={(option, value) =>
              (option.id ?? option.project_id) === (value.id ?? value.project_id)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allprojects")}
                placeholder="Search project..."
              />
            )}
            sx={{ minWidth: 200, flex: "0 0 auto" }}
          />

          <Autocomplete
            size="small"
            options={[
              { value: "0", label: lang("common.pending", "Pending") },
              { value: "1", label: lang("common.approved", "Approved") },
              { value: "2", label: lang("common.rejected", "Rejected") },
              { value: "4", label: lang("common.cancel", "Cancel") },
            ]}
            value={
              statusFilter === ""
                ? null
                : statusFilter === "0"
                  ? { value: "0", label: lang("common.pending", "Pending") }
                  : statusFilter === "1"
                    ? { value: "1", label: lang("common.approved", "Approved") }
                    : statusFilter === "2"
                      ? { value: "2", label: lang("common.rejected", "Rejected") }
                      : statusFilter === "4"
                        ? { value: "4", label: lang("common.cancel", "Cancel") }
                        : null
            }
            onChange={(e, newValue) => {
              setStatusFilter(newValue?.value || "");
            }}
            getOptionLabel={(option) => option?.label || ""}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("common.status")}
                placeholder="Search status..."
              />
            )}
            sx={{ minWidth: 160, flex: "0 0 auto" }}
            clearOnEscape
          />

          <Autocomplete
            size="small"
            options={offtakerList}
            value={
              offtakerList.find((o) => o.id === offtakerFilter) || null
            }
            onChange={(e, newValue) => {
              setOfftakerFilter(newValue ? newValue.id : "");
            }}
            getOptionLabel={(option) => option?.full_name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("invoice.allOfftaker")}
                placeholder="Search offtaker..."
              />
            )}
            sx={{ minWidth: 180, flex: "0 0 auto" }}
          />

          <Autocomplete
            size="small"
            options={investorList}
            value={
              investorList.find((inv) => inv.id === investorFilter) || null
            }
            onChange={(e, newValue) => {
              setInvestorFilter(newValue ? newValue.id : "");
            }}
            getOptionLabel={(option) => option?.full_name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allinvestors")}
                placeholder="Search investor..."
              />
            )}
            sx={{ minWidth: 180, flex: "0 0 auto" }}
          />

          <TextField
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150, flex: "0 0 auto" }}
          />

          <TextField
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            inputProps={{ min: startDate || undefined }}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150, flex: "0 0 auto" }}
          />
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.loading", "Loading...")}
          </div>
        )}

        {/* {error && <div className="text-red-600">Error: {error}</div>}

        {hasLoadedOnce && filteredData.length === 0 && !error && !loading && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.noData", "No Data")}
          </div>
        )} */}

        {hasLoadedOnce && (
          <>
            <Table
              data={contracts}
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

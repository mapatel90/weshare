"use client";
import React, { useEffect, useState, memo, useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";
import Table from "@/components/shared/table/Table";
import {
  FiEdit3,
  FiEye,
  FiMoreHorizontal,
  FiPrinter,
  FiTrash2,
  FiMapPin,
  FiExternalLink,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import SelectDropdown from "@/components/shared/SelectDropdown";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { apiGet, apiPut, apiDelete, apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const StatusDropdown = memo(({ value, onChange, options, disabled }) => {
  const statusOptions = Array.isArray(options) ? options : [];
  const [selectedOption, setSelectedOption] = useState(null);

  // Sync selected option from numeric id value
  useEffect(() => {
    if (!statusOptions.length) return;
    const match = statusOptions.find(
      (opt) => String(opt.value) === String(value)
    );
    setSelectedOption(match || null);
  }, [value, statusOptions]);

  const handleChange = async (option) => {
    setSelectedOption(option);
    await onChange(option.value);
  };

  return (
    <SelectDropdown
      options={statusOptions}
      defaultSelect={selectedOption?.label || ""}
      selectedOption={selectedOption}
      onSelectOption={handleChange}
      searchable={false}
      disabled={disabled}
    />
  );
});

const ProjectTable = () => {
  const { lang } = useLanguage();
  const PAGE_SIZE = 20;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [inverterCounts, setInverterCounts] = useState([]);

  // Filter states
  const [offtakerFilter, setOfftakerFilter] = useState("");
  const [solisStatusFilter, setSolisStatusFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Dropdown lists
  const [offtakerList, setOfftakerList] = useState([]);
  const [projectStatusList, setProjectStatusList] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        downloadAll: "1",
      });

      if (offtakerFilter) {
        params.append("offtaker_id", offtakerFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter) {
        params.append("project_status_id", statusFilter);
      }

      const res = await apiGet(`/api/projects?${params.toString()}`);

      if (res?.success) {
        const projects = Array.isArray(res.data) ? res.data : [];

        // Fetch inverter counts
        const countsRes = await apiGet("/api/projectInverters/counts");
        const projectsWithCounts = projects.map((p) => {
          const count = countsRes?.data?.find((c) => c.project_id === p.id);
          return { ...p, inverterCount: count ? `${count.active}/${count.total}` : "0/0" };
        });

        setData(projectsWithCounts);
        setOfftakerList(Array.isArray(res?.offtakerList) ? res.offtakerList : []);

        const apiTotal = res?.pagination?.total ?? projectsWithCounts.length;
        setPagination({
          page: 1,
          limit: PAGE_SIZE,
          total: apiTotal,
          pages: Math.max(1, Math.ceil(apiTotal / PAGE_SIZE)),
        });
      } else {
        setData([]);
      }
      setError(null);
    } catch (err) {
      console.error("Fetch projects failed:", err);
      setError(err?.message || "Failed to load projects");
      setData([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const fetchProjectStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const res = await apiGet("/api/projects/status");
      if (res?.success && Array.isArray(res.data)) {
        setProjectStatusList(res.data);
      } else {
        setProjectStatusList([]);
      }
    } catch (err) {
      console.error("Fetch project statuses failed:", err);
      setProjectStatusList([]);
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Fetch and auto-refresh every 2 minutes
  useEffect(() => {
    fetchProjects();

    const interval = setInterval(() => {
      fetchProjects();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [offtakerFilter, searchTerm, statusFilter]);

  useEffect(() => {
    fetchProjectStatuses();
  }, []);

  // Filter data by solis status (client-side)
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (solisStatusFilter) {
        const status = d?.project_data?.[0]?.project_solis_status;
        if (solisStatusFilter === "online" && status !== 1) return false;
        if (solisStatusFilter === "offline" && status !== 2) return false;
        if (solisStatusFilter === "alarm" && status !== 3) return false;
      }
      return true;
    });
  }, [data, solisStatusFilter]);

  const handleStatusChange = async (id, statusValue) => {
    try {
      const res = await apiPut(`/api/projects/${id}/status`, {
        status: parseInt(statusValue),
      });
      if (res.success) {
        showSuccessToast(
          lang("projects.statusUpdated", "Status updated successfully")
        );
        fetchProjects();
      }
    } catch (err) {
      console.error("Status update error:", err);
      showErrorToast(err.message || "Failed to update status");
      fetchProjects();
    }
  };

  const statusOptions = useMemo(() => {
    return (projectStatusList || []).map((s) => ({
      label: s?.name ?? `Status ${s?.id}`,
      value: String(s?.id),
    }));
  }, [projectStatusList]);

  const columns = [
    {
      accessorKey: "project_name",
      header: () => lang("projecttablelabel.name", "Name"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "projectType.type_name",
      header: () => lang("projecttablelabel.type", "Type"),
      cell: (info) => info.row.original.project_types?.type_name || "-",
    },
    {
      accessorKey: "product_code",
      header: () => lang("projecttablelabel.code", "Code"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "inverterCount",
      header: () => lang("projecttablelabel.inverter", "Inverters"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "solis_plant_id",
      header: () => lang("projecttablelabel.solisplantid", "Plant ID"),
      cell: ({ row }) => {
        const solis_plant_id = row.original.solis_plant_id;
        if (!solis_plant_id) return "-";

        return (
          <span className="gap-1 d-inline-flex align-items-center">
            {solis_plant_id}
          </span>
        );
      },
    },
    {
      accessorKey: "solis_status",
      header: () => lang("projects.solisStatus", "Solis Status"),
      cell: ({ row }) => {
        const detail = row?.original?.project_data?.[0]?.project_solis_status;
        let label = "-";
        let color = "secondary";

        if (detail === 1) {
          label = lang("common.online", "Online");
          color = "success";
        } else if (detail === 2) {
          label = lang("common.offline", "Offline");
          color = "danger";
        } else if (detail === 3) {
          label = lang("common.alarm", "Alarm");
          color = "warning";
        }

        return (
          <span className={`badge bg-soft-${color} text-${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "offtaker",
      header: () => lang("projecttablelabel.offtaker", "Offtaker"),
      cell: (info) => {
        const offtaker = info.getValue();
        if (!offtaker) return "-";
        return `${offtaker.full_name || ""}`.trim();
      },
    },
    {
      accessorKey: "project_location",
      header: () => lang("projecttablelabel.location", "Location"),
      cell: ({ row }) => {
        const location = row.original.project_location;
        if (!location) return "-";

        const isUrl =
          location.startsWith("http://") || location.startsWith("https://");

        if (isUrl) {
          return (
            <a
              href={location}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1 d-inline-flex align-items-center text-primary"
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: "none" }}
            >
              <FiMapPin size={16} />
              <span className="text-decoration-underline">
                {lang("projects.viewLocation", "View Location")}
              </span>
              <FiExternalLink size={14} />
            </a>
          );
        }

        return (
          <span className="gap-1 d-inline-flex align-items-center">
            <FiMapPin size={16} className="text-muted" />
            {location}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => lang("common.status"),
      cell: ({ row }) => {
        const statusValue = row.original.project_status?.id || row.original.status;
        const statusObj = projectStatusList.find(
          (s) => String(s.id) === String(statusValue)
        );
        const label = statusObj?.name || "-";

        return (
          <div className="gap-2 d-flex align-items-center">
            <div style={{ minWidth: 140 }} onClick={(e) => e.stopPropagation()}>
              <StatusDropdown
                value={statusValue}
                options={statusOptions}
                disabled={loadingStatuses}
                onChange={(next) => handleStatusChange(row.original.id, next)}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: (info) => {
        const id = info.row.original.id;
        const rowActions = [
          {
            label: "Edit",
            icon: <FiEdit3 />,
            link: `/admin/projects/edit/${id}`,
          },
          { type: "divider" },
          {
            label: lang("common.delete", "Delete"),
            icon: <FiTrash2 />,
            onClick: async () => {
              try {
                const confirm = await Swal.fire({
                  icon: "warning",
                  title: lang("common.areYouSure", "Are you sure?"),
                  text: lang(
                    "common.cannotBeUndone",
                    "This action cannot be undone."
                  ),
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  confirmButtonText: lang(
                    "common.yesDelete",
                    "Yes, delete it!"
                  ),
                });
                if (confirm.isConfirmed) {
                  setLoading(true);
                  await apiDelete(`/api/projects/${id}`);
                  showSuccessToast(
                    lang(
                      "projects.deleted",
                      "Project has been deleted successfully"
                    )
                  );
                  fetchProjects();
                }
              } catch (e) {
                console.error("Delete project failed:", e);
                showErrorToast(e.message || "Failed to delete project");
              } finally {
                setLoading(false);
              }
            },
          },
        ];
        return (
          <div className="gap-2 hstack justify-content-start">
            <a
              href={`/admin/projects/view/${id}`}
              className="avatar-text avatar-md"
            >
              <FiEye />
            </a>
            <Dropdown
              dropdownItems={rowActions}
              triggerClass="avatar-md"
              triggerIcon={<FiMoreHorizontal />}
            />
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-3xl">
      {/* Filters */}
      <div className="flex-wrap items-center w-full gap-2 mt-4 mb-4 d-flex justify-content-between">
        <div className="filter-button" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Autocomplete
            size="small"
            options={offtakerList}
            value={offtakerList.find((p) => String(p.id) === String(offtakerFilter)) || null}
            onChange={(e, newValue) => {
              setOfftakerFilter(newValue ? newValue.id : "");
            }}
            getOptionLabel={(option) => option.full_name || option.name || `Offtaker ${option.id ?? ''}`}
            isOptionEqualToValue={(option, value) => (option.id ?? option.project_id) === (value.id ?? value.project_id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("invoice.allOfftaker", "All Offtakers")}
                placeholder="Search off taker..."
              />
            )}
            sx={{ minWidth: 260 }}
          />

          <Autocomplete
            size="small"
            options={[
              { value: "online", label: lang("common.online", "Online") },
              { value: "offline", label: lang("common.offline", "Offline") },
              { value: "alarm", label: lang("common.alarm", "Alarm") },
            ]}
            value={
              [{ value: "online", label: lang("common.online", "Online") }, { value: "offline", label: lang("common.offline", "Offline") }, { value: "alarm", label: lang("common.alarm", "Alarm") }].find(
                (o) => o.value === solisStatusFilter
              ) || null
            }
            onChange={(e, newValue) => setSolisStatusFilter(newValue ? newValue.value : "")}
            getOptionLabel={(option) => option.label || ""}
            renderInput={(params) => (
              <TextField {...params} label={lang("projects.allSolisStatus", "All Solis Status")} placeholder="Search status..." />
            )}
            sx={{ minWidth: 200 }}
          />

          <Autocomplete
            size="small"
            options={projectStatusList}
            value={projectStatusList.find((p) => String(p.id) === String(statusFilter)) || null}
            onChange={(e, newValue) => setStatusFilter(newValue ? newValue.id : "")}
            getOptionLabel={(option) => option.name || `Status ${option.id}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            renderInput={(params) => (
              <TextField {...params} label={lang("invoice.allStatus", "All Status")} placeholder="Search status..." />
            )}
            disabled={loadingStatuses}
            sx={{ minWidth: 260 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        {!hasLoadedOnce && loading && (
          <div className="py-6 text-center text-gray-600">
            {lang("common.loading", "Loading...")}
          </div>
        )}

        {error && <div className="text-red-600">Error: {error}</div>}

        {hasLoadedOnce && (
          <>
            <Table
              data={filteredData}
              columns={columns}
              disablePagination={false}
              onSearchChange={setSearchTerm}
              serverSideTotal={pagination.total}
              initialPageSize={PAGE_SIZE}
              emptyMessage={lang("common.noData", "No Data")}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-white/70">
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectTable;

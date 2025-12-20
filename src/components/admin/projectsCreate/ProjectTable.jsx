"use client";
import React, { useEffect, useState, memo, useMemo } from "react";
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

const StatusDropdown = memo(({ value, onChange }) => {
  const { lang } = useLanguage();
  const statusOptions = [
    { label: lang("projects.active", "Active"), value: "1" },
    { label: lang("projects.inactive", "Inactive"), value: "0" },
  ];

  const handleChange = async (option) => {
    await onChange(option.value);
  };

  return (
    <SelectDropdown
      options={statusOptions}
      defaultSelect={String(value ?? 0)}
      onSelectOption={handleChange}
      searchable={false}
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
  const [projectFilter, setProjectFilter] = useState("");
  const [offtakerFilter, setOfftakerFilter] = useState("");
  const [solisStatusFilter, setSolisStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Dropdown lists
  const [projectList, setProjectList] = useState([]);
  const [offtakerList, setOfftakerList] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });

  // Helper to call server cron -> /stationdetail
  const fetchStationDetail = async (plantId) => {
    try {
      const res = await apiPost("/api/cron/stationdetail", { id: plantId });
      if (!res || res.error) {
        throw new Error(res.error || "Failed to fetch station detail");
      }
      return res.solisData?.data?.state ?? res;
    } catch (err) {
      console.error("fetchStationDetail error:", err);
      return null;
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        downloadAll: "1",
      });

      if (projectFilter) {
        params.append("project_id", projectFilter);
      }

      if (offtakerFilter) {
        params.append("offtaker_id", offtakerFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await apiGet(`/api/projects?${params.toString()}`);

      if (res?.success) {
        const projects = Array.isArray(res.data) ? res.data : [];

        // Fetch station details for projects with solis_plant_id
        const projectsWithDetails = await Promise.all(
          projects.map(async (p) => {
            if (p?.solis_plant_id) {
              const detail = await fetchStationDetail(p.solis_plant_id);
              return { ...p, solisStationDetail: detail };
            }
            return p;
          })
        );

        // Fetch inverter counts
        const countsRes = await apiGet("/api/projectInverters/counts");
        const projectsWithCounts = projectsWithDetails.map((p) => {
          const count = countsRes?.data?.find((c) => c.project_id === p.id);
          return { ...p, inverterCount: count ? `${count.active}/${count.total}` : "0/0" };
        });

        setData(projectsWithCounts);
        setProjectList(Array.isArray(res?.projectList) ? res.projectList : []);
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

  // Fetch and auto-refresh every 2 minutes
  useEffect(() => {
    fetchProjects();

    const interval = setInterval(() => {
      fetchProjects();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [projectFilter, offtakerFilter, searchTerm]);

  // Filter data by solis status (client-side)
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (solisStatusFilter) {
        const status = d.solisStationDetail;
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
    }
  };

  const columns = [
    {
      accessorKey: "project_name",
      header: () => lang("projects.projectName", "Project Name"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "meter_number",
      header: () => lang("projects.meter_number", "Meter Number"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "product_code",
      header: () => lang("projects.productCode", "Product Code"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "inverterCount",
      header: () => "Inverters",
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "projectType.type_name",
      header: () => lang("projects.projectType", "Project Type"),
      cell: (info) => info.row.original.projectType?.type_name || "-",
    },
    {
      accessorKey: "address",
      header: () => lang("projects.addressInformation", "Address"),
      cell: ({ row }) => {
        const { city, state, country, address_1, address_2 } = row.original;
        const locationParts = [];

        if (city?.name) locationParts.push(city.name);
        if (state?.name) locationParts.push(state.name);
        if (country?.name) locationParts.push(country.name);

        return (
          <div>
            {address_1 && (
              <div>
                {address_1} - {address_2}
              </div>
            )}
            {locationParts.length > 0 && <div>{locationParts.join(", ")}</div>}
            {!address_1 && !address_2 && locationParts.length === 0 && "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "solis_status",
      header: () => "Solis Status",
      cell: ({ row }) => {
        const detail = row.original.solisStationDetail;

        let label = "-";
        let color = "secondary";

        if (detail === 1) {
          label = "Online";
          color = "success";
        } else if (detail === 2) {
          label = "Offline";
          color = "danger";
        } else if (detail === 3) {
          label = "Alarm";
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
      header: () => lang("projects.selectOfftaker", "Offtaker"),
      cell: (info) => {
        const offtaker = info.getValue();
        if (!offtaker) return "-";
        return `${offtaker.fullName || ""}`.trim();
      },
    },
    {
      accessorKey: "project_location",
      header: () => lang("projects.projectLocation", "Project Location"),
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
              className="d-inline-flex align-items-center gap-1 text-primary"
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
          <span className="d-inline-flex align-items-center gap-1">
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
        const statusValue = row.original.status;
        const status =
          statusValue == 1
            ? { label: lang("common.active"), color: "success" }
            : { label: lang("common.inactive"), color: "danger" };

        return (
          <span
            className={`badge bg-soft-${status.color} text-${status.color}`}
          >
            {status.label}
          </span>
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
          <div className="hstack gap-2 justify-content-end">
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
    <div className="p-6 bg-white rounded-3xl shadow-md">
      {/* Filters */}
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
          >
            <option value="">{lang("reports.allprojects", "All Projects")}</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name || `Project ${p.id}`}
              </option>
            ))}
          </select>

          <select
            value={offtakerFilter}
            onChange={(e) => setOfftakerFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
          >
            <option value="">{lang("projects.allOfftakers", "All Offtakers")}</option>
            {offtakerList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName || o.email || `Offtaker ${o.id}`}
              </option>
            ))}
          </select>

          <select
            value={solisStatusFilter}
            onChange={(e) => setSolisStatusFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("projects.allSolisStatus", "All Solis Status")}</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="alarm">Alarm</option>
          </select>
        </div>
      </div>

      {/* Table */}
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

export default ProjectTable;

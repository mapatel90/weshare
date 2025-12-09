"use client";
import React, { useEffect, useState, memo } from "react";
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

const actions = [
  { label: "Edit", icon: <FiEdit3 /> },
  { label: "Print", icon: <FiPrinter /> },
  { type: "divider" },
  { label: "Delete", icon: <FiTrash2 /> },
];

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inverterCounts, setInverterCounts] = useState([]);

  // helper to call server cron -> /stationdetail
  const fetchStationDetail = async (plantId) => {
    try {
      const res = await apiPost("/api/cron/stationdetail", { id: plantId });
      console.log("Station Detail Response:", res?.solisData?.data?.state);

      // Check success based on your API structure
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
      // Fetch projects
      const res = await apiGet("/api/projects?page=1&limit=20");
      // Fetch inverter counts
      const countsRes = await apiGet("/api/projectInverters/counts");
      if (countsRes?.success) {
        setInverterCounts(countsRes.data || []);
      }
      if (res?.success) {
        const projects = res.data.projects || [];
        // For projects that have solis_plant_id, fetch station detail and attach it
        const projectsWithDetails = await Promise.all(
          projects.map(async (p) => {
            if (p?.solis_plant_id) {
              const detail = await fetchStationDetail(p.solis_plant_id);
              return { ...p, solisStationDetail: detail };
            }
            return p;
          })
        );
        // Merge inverter counts
        const projectsWithCounts = projectsWithDetails.map((p) => {
          const count = countsRes?.data?.find((c) => c.project_id === p.id);
          return { ...p, inverterCount: count ? `${count.active}/${count.total}` : "0/0" };
        });
        setData(projectsWithCounts);
      }
    } catch (err) {
      console.error("Fetch projects failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
        const { city, state, country, address1, address2 } = row.original;
        const locationParts = [];

        if (city?.name) locationParts.push(city.name);
        if (state?.name) locationParts.push(state.name);
        if (country?.name) locationParts.push(country.name);

        return (
          <div>
            {address1 && (
              <div>
                {address1} - {address2}
              </div>
            )}
            {/* {address2 && <div>{address2}</div>} */}
            {locationParts.length > 0 && <div>{locationParts.join(", ")}</div>}
            {!address1 && !address2 && locationParts.length === 0 && "-"}
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

        // If location looks like a URL, make it clickable
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
      meta: { headerClassName: "text-end" },
    },
  ];

  return (
    <>
      {/* Commented out - using global loader instead */}
      {/* {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : ( */}
      <Table data={data} columns={columns} />
      {/* )} */}
    </>
  );
};

export default ProjectTable;

import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Button
} from "@mui/material";
import ContractModal from "./ContractModal";

const Contract = ({ projectId }) => {
  const { lang } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [partyType, setPartyType] = useState("");
  const [selectedOfftaker, setSelectedOfftaker] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState("");
  const [offtakerList, setOfftakerList] = useState({}); // changed to object
  const [investorList, setInvestorList] = useState([]);
  const [showPartySelection, setShowPartySelection] = useState(true);
  const [forcedParty, setForcedParty] = useState(""); // "investor" | "offtaker" | ""
  const [offtakerDisabled, setOfftakerDisabled] = useState(false);
  const [allowAdd, setAllowAdd] = useState(true); // NEW: control Add button visibility

  // form fields
  const [contractTitle, setContractTitle] = useState("");
  const [contractDescription, setContractDescription] = useState("");
  const [documentUpload, setDocumentUpload] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [status, setStatus] = useState(1);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");

  useEffect(() => {
    fetchContracts();
    fetchProjectParties();
  }, [projectId]);

  // Recompute whether Add button should be shown
  useEffect(() => {
    if (!projectId) {
      setAllowAdd(true);
      return;
    }

    // Find interested_investors that belong to this project
    const invIdsForProject = Array.isArray(investorList)
      ? investorList
        .filter((inv) => Number(inv.projectId) === Number(projectId))
        .map((inv) => Number(inv.id))
      : [];

    // If any contract has investorId that matches an interested_investor id for same project -> hide Add
    const investorConflict = contracts.some(
      (c) =>
        Number(c.projectId) === Number(projectId) &&
        c.investorId != null &&
        invIdsForProject.includes(Number(c.investorId))
    );

    console.log("Investor conflict:", investorConflict);

    // New condition: if any contract (in entire table) has an offtakerId -> hide Add
    const offtakerConflict = contracts.some((c) => c.offtaker_id != null);

    console.log("Offtaker conflict:", offtakerConflict);

    // Hide Add button only when BOTH investorConflict AND offtakerConflict are true
    setAllowAdd(!(investorConflict && offtakerConflict));
  }, [contracts, investorList, projectId]);

  // Fetch project-related offtakers and investors
  const fetchProjectParties = async () => {
    try {
      // Replace with your actual API endpoints for offtakers/investors
      const offtakerRes = await apiGet(`/api/projects/${projectId}`);
      const investorRes = await apiGet('/api/investors?projectId=' + projectId);
      setOfftakerList(offtakerRes?.data.offtaker || {});
      setInvestorList(investorRes?.data || []);
    } catch (e) {
      setOfftakerList({});
      setInvestorList([]);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await apiGet("/api/contracts");
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
        const filtered = projectId
          ? all.filter((item) => Number(item.projectId) === Number(projectId))
          : all;
        setContracts(filtered);
      } else {
        setContracts([]);
      }
    } catch (e) {
      setContracts([]);
    }
  };

  const openAdd = () => {
    setModalType("add");
    setEditId(null);
    setContractTitle("");
    setContractDescription("");
    setDocumentUpload("");
    if (documentPreviewUrl) {
      try { URL.revokeObjectURL(documentPreviewUrl); } catch (e) { /* ignore */ }
    }
    setDocumentFile(null);
    setDocumentPreviewUrl("");
    setContractDate("");
    setStatus(0); // changed: default to Pending when opening Add modal
    // Decide whether to show radios or force a party based on existing contracts for this project
    if (!projectId) {
      setShowPartySelection(true);
      setForcedParty("");
      setPartyType("");
    } else {
      const contractsForProject = contracts.filter(
        (c) => Number(c.projectId) === Number(projectId)
      );
      if (!contractsForProject.length) {
        setShowPartySelection(true);
        setForcedParty("");
        setPartyType("");
      } else if (
        contractsForProject.some((c) => c.offtakerId != null || c.offtaker_id != null)
      ) {
        // If an offtaker exists for this project, hide radios and show only investor dropdown
        setShowPartySelection(false);
        setForcedParty("investor");
        setPartyType("investor");
      } else if (
        contractsForProject.some((c) => c.investorId != null || c.investor_id != null)
      ) {
        // If an investor exists for this project, hide radios and show only offtaker dropdown
        setShowPartySelection(false);
        setForcedParty("offtaker");
        setPartyType("offtaker");
      } else {
        setShowPartySelection(true);
        setForcedParty("");
        setPartyType("");
      }
    }
    setSelectedOfftaker("");
    setSelectedInvestor("");
    setOfftakerDisabled(false);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalType("edit");
    setEditId(row.id);
    setContractTitle(row.contractTitle || "");
    setContractDescription(row.contractDescription || "");
    setDocumentUpload(row.documentUpload || "");
    setDocumentFile(null);
    setDocumentPreviewUrl(row.documentUpload || "");
    setContractDate(
      row.contractDate
        ? new Date(row.contractDate).toISOString().slice(0, 10)
        : ""
    );
    setStatus(row.status ?? 1);
    // If editing, set party type and selected party if available
    if (row.investorId) {
      setPartyType("investor");
      setSelectedInvestor(row.investorId || "");
      setSelectedOfftaker("");
      setOfftakerDisabled(false);
    } else {
      setPartyType("offtaker");
      setSelectedOfftaker(row.offtakerId || offtakerList?.id || "");
      setSelectedInvestor("");
      setOfftakerDisabled(true);
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const applyDocumentSelection = (file) => {
    setDocumentFile(file || null);
    if (file) {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
      const url = URL.createObjectURL(file);
      setDocumentPreviewUrl(url);
      setDocumentUpload("");
    } else {
      setDocumentPreviewUrl(documentUpload || "");
    }
  };

  const buildFormData = () => {
    const form = new FormData();
    form.append("projectId", projectId ?? "");
    form.append("contractTitle", contractTitle);
    form.append("contractDescription", contractDescription || "");
    form.append("contractDate", contractDate ? contractDate : "");
    form.append("status", String(status));
    form.append("partyType", partyType || "");
    // append offtakerId / investorId according to selection, leave other empty string (server interprets accordingly)
    if (partyType === "offtaker") {
      const offtakerId = selectedOfftaker || offtakerList?.id || "";
      form.append("offtakerId", offtakerId);
      form.append("investorId", "");
    } else if (partyType === "investor") {
      form.append("investorId", selectedInvestor || "");
      form.append("offtakerId", "");
    } else {
      form.append("investorId", "");
      form.append("offtakerId", "");
    }

    if (documentFile) form.append("document", documentFile);
    else if (modalType === "add" && documentUpload) form.append("documentUpload", documentUpload);
    return form;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!contractTitle) {
      showErrorToast(
        lang("contract.titleRequired", "Contract title is required")
      );
      return;
    }

    setLoading(true);
    try {
      let res;
      // If there's a file or to keep consistent with upload usage, use multipart upload
      const form = buildFormData();

      // Build JSON payload for non-file requests
      const payload = {
        projectId: projectId ?? null,
        contractTitle,
        contractDescription: contractDescription || null,
        documentUpload: documentUpload || null,
        contractDate: contractDate ? contractDate : null,
        status,
        offtakerId: partyType === "offtaker" ? (selectedOfftaker || offtakerList?.id || null) : null,
        investorId: partyType === "investor" ? (selectedInvestor || null) : null,
      };

      if (modalType === "add") {
        res = documentFile || documentUpload
          ? await apiUpload("/api/contracts", form)
          : await apiPost("/api/contracts", payload);

        if (res?.success)
          showSuccessToast(lang("contract.created", "Contract created"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      } else {
        // edit
        res = documentFile
          ? await apiUpload(`/api/contracts/${editId}`, form, { method: "PUT" })
          : await apiPut(`/api/contracts/${editId}`, payload);

        if (res?.success)
          showSuccessToast(lang("contract.updated", "Contract updated"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      }

      if (res?.success) {
        closeModal();
        fetchContracts();
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: lang("common.areYouSure", "Are you sure?"),
      text: lang("modal.deleteWarning", "This action cannot be undone!"),
      showCancelButton: true,
      confirmButtonText: lang("common.yesDelete", "Yes, delete it!"),
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await apiDelete(`/api/contracts/${row.id}`);
      if (res?.success) {
        showSuccessToast(lang("contract.deleted", "Contract deleted"));
        fetchContracts();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
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
      accessorKey: "contractType",
      header: () => lang("contract.type", "Type"),
      cell: (info) => {
        const v = info.getValue() || "-";
        const row = info.row?.original || {};
        let typeLabel = v;
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
        // Investor
        // If Investor exists
        if (row.investorId || row.investor_id) {
          const investor = row.investor; // assuming API returns row.investor object
          name = investor?.fullName || "-";
        }
        // Otherwise Offtaker
        else if (row.offtakerId || row.offtaker_id) {
          const offtaker = row.offtaker; // assuming API returns row.offtaker object
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
            {lang("common.active", "Active")}
          </span>
        ) : (
          <span className="badge bg-soft-danger text-danger">
            {lang("common.inactive", "Inactive")}
          </span>
        ),
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="d-flex gap-2" style={{ flexWrap: "nowrap" }}>
            <FiEdit3
              size={18}
              onClick={() => openEdit(item)}
              title={lang("common.edit", "Edit")}
              style={{ color: "#007bff", cursor: "pointer" }}
            />
            <FiTrash2
              size={18}
              onClick={() => handleDelete(item)}
              title={lang("common.delete", "Delete")}
              style={{ color: "#dc3545", cursor: "pointer" }}
            />
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="contract-management">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          {lang("contract.contracts", "Contracts")}
        </h6>
        {allowAdd && (
          <Button
            variant="contained"
            onClick={openAdd}
            className="common-grey-color"
          >
            + {lang("contract.addContract", "Add Contract")}
          </Button>
        )}
      </div>

      <ContractModal
        open={showModal}
        onClose={closeModal}
        modalType={modalType}
        lang={lang}
        loading={loading}
        contractTitle={contractTitle}
        setContractTitle={setContractTitle}
        contractDescription={contractDescription}
        setContractDescription={setContractDescription}
        documentUpload={documentUpload}
        setDocumentUpload={setDocumentUpload}
        documentPreviewUrl={documentPreviewUrl}
        applyDocumentSelection={applyDocumentSelection}
        contractDate={contractDate}
        setContractDate={setContractDate}
        status={status}
        setStatus={setStatus}
        partyType={partyType}
        setPartyType={setPartyType}
        selectedInvestor={selectedInvestor}
        setSelectedInvestor={setSelectedInvestor}
        selectedOfftaker={selectedOfftaker}
        setSelectedOfftaker={setSelectedOfftaker}
        investorList={investorList}
        offtakerList={offtakerList}
        showPartySelection={showPartySelection}
        forcedParty={forcedParty}
        onSubmit={handleSave}
      />

      <Table
        data={contracts}
        columns={columns}
        options={{
          meta: {
            investorList,
            offtakerList,
          },
        }}
      />
    </div>
  );
};

export default Contract;

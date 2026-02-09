import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiArrowRight, FiEdit3, FiSave, FiTrash2, FiX, FiXCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Button
} from "@mui/material";
import ContractModal from "./ContractModal";
import { useAuth } from "@/contexts/AuthContext";
import { buildUploadUrl } from "@/utils/common";

const Contract = ({ projectId, handleCloseForm, handleSaveAction }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
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
  const [projectData, setProjectData] = useState(null); // NEW: store project details
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
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    fetchContracts();
    fetchProjectParties();
  }, [projectId]);


  useEffect(() => {
    if (!projectId) {
      setAllowAdd(true);
      return;
    }

    const activeContracts = contracts.filter(
      (c) =>
        Number(c.project_id) === Number(projectId) &&
        Number(c.status) !== 3
    );

    const hasInvestorContract = activeContracts.some(
      (c) => c.investor_id != null || c.investorId != null
    );

    const hasOfftakerContract = activeContracts.some(
      (c) => c.offtaker_id != null || c.offtakerId != null
    );

    setAllowAdd(!(hasInvestorContract && hasOfftakerContract));
  }, [contracts, projectId]);

  // Auto-select investor when partyType changes to "investor"
  useEffect(() => {
    if (partyType === "investor" && projectData && projectData.investor_id) {
      const matchingInvestor = investorList.find(
        (inv) => Number(inv.user_id) === Number(projectData.investor_id)
      );
      if (matchingInvestor) {
        setSelectedInvestor(String(matchingInvestor.user_id));
      }
    }
  }, [partyType, projectData, investorList]);

  // Fetch project-related offtakers and investors
  const fetchProjectParties = async () => {
    try {
      // Replace with your actual API endpoints for offtakers/investors
      const offtakerRes = await apiGet(`/api/projects/${projectId}`);
      const investorRes = await apiGet('/api/investors?projectId=' + projectId);
      console.log("investorRes", investorRes?.data);
      setProjectData(offtakerRes?.data || null); // Store project details
      setOfftakerList(offtakerRes?.data.offtaker || {});
      setInvestorList(investorRes?.data || []);
    } catch (e) {
      setOfftakerList({});
      setInvestorList([]);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await apiGet("/api/contracts?projectId=" + projectId);
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
        setContracts(all);
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
    setTitleError("");
    setDescriptionError("");
    setDocumentError("");
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
      // Consider only non-cancelled contracts for party selection logic
      const contractsForProject = contracts.filter(
        (c) =>
          Number(c.project_id) === Number(projectId) &&
          Number(c.status) !== 3
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

    // Auto-select investor if project has investor_id and partyType is investor
    if (projectData && projectData.investor_id) {
      const matchingInvestor = investorList.find(
        (inv) => Number(inv.user_id) === Number(projectData.investor_id)
      );
      if (matchingInvestor) {
        setSelectedInvestor(String(matchingInvestor.user_id));
      }
    }
    setOfftakerDisabled(false);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalType("edit");
    setEditId(row.id);
    setContractTitle(row.contract_title || "");
    setContractDescription(row.contract_description || "");
    setDocumentUpload(row.document_upload || "");
    setTitleError("");
    setDescriptionError("");
    setDocumentError("");
    setDocumentFile(null);
    setDocumentPreviewUrl(row.document_upload || "");
    setContractDate(
      row.contract_date
        ? new Date(row.contract_date).toISOString().slice(0, 10)
        : ""
    );
    setStatus(row.status ?? 1);
    // If editing, set party type and selected party if available
    if (row.investor_id || row.investorId) {
      setPartyType("investor");
      setSelectedInvestor(row.investor_id || "");
      setSelectedOfftaker("");
      setOfftakerDisabled(false);
    } else {
      setPartyType("offtaker");
      setSelectedOfftaker(row.offtaker_id || offtakerList?.id || "");
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
      setDocumentError("");
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
    setTitleError("");
    setDescriptionError("");
    setDocumentError("");

    let hasError = false;

    if (!contractTitle || contractTitle.trim() === "") {
      setTitleError(
        lang("contract.titleRequired", "Contract title is required")
      );
      hasError = true;
    }

    if (!contractDescription || contractDescription.trim() === "") {
      setDescriptionError(
        lang("contract.descriptionRequired", "Contract description is required")
      );
      hasError = true;
    }

    if (!documentFile && !documentUpload) {
      setDocumentError(
        lang("contract.documentRequired", "Contract document is required")
      );
      hasError = true;
    }

    if (hasError) return;

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
        created_by: user?.id,
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

  const handleCancel = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: lang("contract.cancelContract", "Cancel Contract?"),
      text: lang("contract.cancelWarning", "Are you sure you want to cancel this contract? This action cannot be undone."),
      showCancelButton: true,
      confirmButtonText: lang("common.yesCancel", "Yes, cancel it!"),
      cancelButtonText: lang("common.no", "No"),
      confirmButtonColor: "#ff9800",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await apiPut(`/api/contracts/${row.id}/status`, {
        status: 3,
      });
      if (res?.success) {
        showSuccessToast(lang("contract.cancelled", "Contract cancelled successfully"));
        fetchContracts();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
    }
  };

  useEffect(() => {
    const investorMissing = !Number(projectData?.investor_id);

    const tryingInvestorContract =
      (modalType !== "edit" && showPartySelection && partyType === "investor") || // radio case
      (modalType !== "edit" && !showPartySelection && forcedParty === "investor") || // forced case
      (modalType === "edit" && partyType === "investor"); // edit case

    if (open && tryingInvestorContract && investorMissing) {
      showErrorToast(
        lang(
          "contract.assignAsInvestor",
          "Please assign an investor to the project before creating an investor contract."
        )
      );
    }
  }, [open, partyType, forcedParty, modalType, showPartySelection, projectData?.investor_id]);


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
        if (row.investor_id) {
          // Find matching investor in interested_investors array
          const interestedInvestors = row?.projects?.interested_investors || [];
          if (Array.isArray(interestedInvestors)) {
            const matchingInvestor = interestedInvestors.find(
              (inv) => Number(inv.user_id) === Number(row.investor_id)
            );
            name = matchingInvestor?.full_name || "-";
          }
        }
        // Otherwise Offtaker
        else if (row.offtakerId || row.offtaker_id) {
          const offtaker = row.users; // assuming API returns row.offtaker object
          name = offtaker?.full_name || "-";
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
        return v ? (
          <a href={buildUploadUrl(v)} target="_blank" rel="noreferrer">
            View
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
      cell: (info) => {
        const status = info.getValue();
        if (status == 0) {
          return (
            <span className="badge bg-soft-warning text-warning">
              {lang("common.pending", "Pending")}
            </span>
          );
        } else if (status == 1) {
          return (
            <span className="badge bg-soft-success text-success">
              {lang("common.actives", "Approved")}
            </span>
          );
        } else if (status == 2) {
          return (
            <span className="badge bg-soft-danger text-danger">
              {lang("common.inactives", "Rejected")}
            </span>
          );
        } else if (status == 3) {
          return (
            <span className="badge bg-soft-info text-info">
              {lang("contract.cancel", "Cancel")}
            </span>
          );
        } else {
          return (
            <span className="badge bg-soft-danger text-danger">
              {lang("common.inactives", "Rejected")}
            </span>
          );
        }
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        const status = item.status ?? 0;

        // If status is 3 (Cancelled) => no action buttons
        if (status === 3) {
          return '-';
        }

        return (
          <div className="d-flex gap-2" style={{ flexWrap: "nowrap" }}>
            {/* For status 1 (Approved) => only show Cancel button */}
            {status === 1 ? (
              <FiXCircle
                size={18}
                onClick={() => handleCancel(item)}
                title={lang("contract.cancel", "Cancel Contract")}
                style={{ color: "#ff9800", cursor: "pointer" }}
              />
            ) : (
              <>
                {/* For other statuses => keep Edit and Delete */}
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
              </>
            )}
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  const handleSaveActionLocal = async (action) => {
    const success = await saveMeterData();
    if (success) {
      handleSaveAction(action);
    }
  };

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
        titleError={titleError}
        descriptionError={descriptionError}
        documentError={documentError}
        setTitleError={setTitleError}
        setDescriptionError={setDescriptionError}
        setDocumentError={setDocumentError}
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
        projectData={projectData}
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
      <div className="col-12 d-flex justify-content-end gap-2">
        {/* <Button
          type="button"
          variant="outlined"
          disabled={loading.form}
          startIcon={<FiX />}
          onClick={() => handleCloseForm('close')}
          className="common-grey-color"
          style={{
            marginTop: "2px",
            marginBottom: "2px",
          }}
        >
          {loading.form
            ? lang("common.saving", "Saving")
            : lang("common.close", "close")}
        </Button> */}
        <Button
          type="button"
          variant="outlined"
          disabled={loading.form}
          onClick={() => handleSaveAction('saveNext')}
          style={{
            marginTop: "2px",
            marginBottom: "2px",
          }}
        >
          {loading.form
            ? lang("common.saving", "Saving")
            : lang("projects.saveNext", "Next")}
          <FiArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default Contract;

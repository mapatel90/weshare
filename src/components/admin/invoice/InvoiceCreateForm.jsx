"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FiEdit3, FiPlus } from "react-icons/fi";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/utils/common";
import { showSuccessToast } from "@/utils/topTost";
import { useRouter } from "next/navigation";
import useLocationData from "@/hooks/useLocationData";
import InvoiceItem from "./InvoiceItem";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";

const InvoiceCreateForm = ({ invoiceId = null }) => {
  const { lang } = useLanguage();
  const router = useRouter();
  const isDark = useDarkMode();
  const priceWithCurrency = usePriceWithCurrency();
  const {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    handleCountryChange,
    handleStateChange,
  } = useLocationData();

  // Dark Mode Colors
  const colors = {
    pageBackground: isDark ? "#0f172a" : "#f8fafc",
    cardBackground: isDark ? "#121a2d" : "#fff",
    text: isDark ? "#ffffff" : "#1e293b",
    textSecondary: isDark ? "#cbd5e1" : "#64748b",
    textMuted: isDark ? "#94a3b8" : "#475569",
    border: isDark ? "#1b2436" : "#e2e8f0",
    borderHover: isDark ? "#334155" : "#cbd5e1",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    success: "#10b981",
    warning: "#f59e0b",
    headerBg: isDark ? "#0f172a" : "#ffffff",
    sectionBg: isDark ? "#1a1f2e" : "#f8fafc",
    addressBg: isDark ? "#0c4a6e" : "#f0f9ff",
    addressBorder: isDark ? "#0ea5e9" : "#0ea5e9",
    addressText: isDark ? "#38bdf8" : "#0c4a6e",
  };

  const [projectOptions, setProjectOptions] = useState([]);
  const [offtakerOptions, setOfftakerOptions] = useState([]);
  const [loadingOfftakers, setLoadingOfftakers] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOfftaker, setSelectedOfftaker] = useState(null);
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [settingInvoiceNumberPrefix, setSettingInvoiceNumberPrefix] =
    useState("");
  const [invoiceNumberSuffix, setInvoiceNumberSuffix] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [totalUnit, setTotalUnit] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [errors, setErrors] = useState({});
  const [statusError, setStatusError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!invoiceId);
  const [offtakerAddress, setOfftakerAddress] = useState("");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_1: "",
    address_2: "",
    country_id: "",
    state_id: "",
    city_id: "",
    zipcode: "",
  });
  const [pendingAddressData, setPendingAddressData] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([
    { item: "", description: "", unit: 1, price: 0, tax: "no-tax" },
  ]);
  const [itemsError, setItemsError] = useState("");
  const [taxes, setTaxes] = useState([]);
  const [selectedTax, setSelectedTax] = useState("");
  const [defaultTax, setDefaultTax] = useState("");
  const [invoiceDueAfterDays, setInvoiceDueAfterDays] = useState(0);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const invoicePrefixLabel = useMemo(() => {
    const trimmedPrefix = (invoicePrefix || "").trim();
    const trimmedSetting = (settingInvoiceNumberPrefix || "").trim();
    if (trimmedPrefix && trimmedSetting) {
      return `INV - ${trimmedPrefix} - ${trimmedSetting}`;
    }
    if (trimmedPrefix) return `INV - ${trimmedPrefix}`;
    if (trimmedSetting) return `INV - ${trimmedSetting}`;
    return "INV -";
  }, [invoicePrefix, settingInvoiceNumberPrefix]);

  const itemsTotal = useMemo(() => {
    return invoiceItems.reduce((sum, it) => {
      const qty = Number(it.unit) || 0;
      const price = Number(it.price) || 0;
      return sum + qty * price;
    }, 0);
  }, [invoiceItems]);

  const taxAmount = useMemo(() => {
    if (!selectedTax || !itemsTotal) return 0;
    const tax = taxes.find((t) => String(t.id) === String(selectedTax));
    if (!tax) return 0;
    return (itemsTotal * Number(tax.value)) / 100;
  }, [itemsTotal, selectedTax, taxes]);

  const finalTotal = useMemo(() => {
    return itemsTotal + taxAmount;
  }, [itemsTotal, taxAmount]);

  const fetchProjects = async () => {
    try {
      const res = await apiGet("/api/projects?status=1&limit=1000");
      const items = Array.isArray(res?.projectList) ? res.projectList : [];
      const active = items.filter((p) => String(p?.status) === "1");
      const mapped = active.map((p) => ({
        label: p.project_name,
        value: String(p.id),
      }));
      setProjectOptions([
        { label: lang("invoice.selectProject"), value: "" },
        ...mapped,
      ]);
    } catch (_) {
      setProjectOptions([]);
    }
  };

  const fetchOfftakers = async () => {
    try {
      setLoadingOfftakers(true);
      const res = await apiGet("/api/users?role=offtaker&status=1&limit=1000");
      const list = Array.isArray(res?.data?.users) ? res.data.users : [];
      const mapped = list.map((u) => ({
        label: u.full_name || "",
        value: String(u.id),
      }));
      setOfftakerOptions([
        { label: lang("invoice.selectOfftaker"), value: "" },
        ...mapped,
      ]);
    } catch (_) {
      setOfftakerOptions([
        { label: lang("invoice.selectOfftaker"), value: "" },
      ]);
    } finally {
      setLoadingOfftakers(false);
    }
  };

  const fetchSettingData = async () => {
    try {
      const res = await apiGet("/api/settings");
      const prefixRaw = res?.data?.invoice_number_prefix ?? "";
      const numberPrefix = res?.data?.next_invoice_number || "";
      const defaultTaxSetting = res?.data?.finance_default_tax || "";
      const dueAfter = res?.data?.invoice_due_after_days;
      setInvoicePrefix(typeof prefixRaw === "string" ? prefixRaw : "");
      setSettingInvoiceNumberPrefix(
        typeof numberPrefix === "string" ? numberPrefix : ""
      );
      setDefaultTax(defaultTaxSetting);
      setSelectedTax(defaultTaxSetting);
      const parsedDueAfter =
        dueAfter !== undefined && dueAfter !== null && dueAfter !== ""
          ? parseInt(dueAfter, 10)
          : 0;
      setInvoiceDueAfterDays(
        Number.isFinite(parsedDueAfter) && parsedDueAfter >= 0
          ? parsedDueAfter
          : 0
      );
    } catch (_) {
      setInvoicePrefix("");
      return "";
    }
  };

  const fetchTaxes = async () => {
    try {
      const res = await apiGet("/api/settings/taxes");
      const taxList = Array.isArray(res?.data) ? res.data : [];
      setTaxes(taxList);
    } catch (_) {
      setTaxes([]);
    }
  };

  const fetchOfftakerAddress = async (offtakerId) => {
    if (!offtakerId) {
      setOfftakerAddress("");
      setAddressForm({
        address_1: "",
        address_2: "",
        country_id: "",
        state_id: "",
        city_id: "",
        zipcode: "",
      });
      return;
    }
    try {
      const res = await apiGet(`/api/users/${offtakerId}`);
      const user = res?.data;
      if (user) {
        const parts = [
          user.address_1,
          user.address_2,
          user.cities?.name,
          user.states?.name,
          user.countries?.name,
          user.zipcode,
        ].filter(Boolean);
        setOfftakerAddress(parts.join(", "));
        setAddressForm({
          address_1: user.address_1 || "",
          address_2: user.address_2 || "",
          country_id: user.country_id || "",
          state_id: user.state_id || "",
          city_id: user.city_id || "",
          zipcode: user.zipcode || "",
        });
        if (user.country_id) {
          handleCountryChange(user.country_id);
        }
        if (user.state_id) {
          handleStateChange(user.state_id);
        }
      } else {
        setOfftakerAddress("");
        setAddressForm({
          address_1: "",
          address_2: "",
          country_id: "",
          state_id: "",
          city_id: "",
          zipcode: "",
        });
      }
    } catch (_) {
      setOfftakerAddress("");
      setAddressForm({
        address_1: "",
        address_2: "",
        country_id: "",
        state_id: "",
        city_id: "",
        zipcode: "",
      });
    }
  };

  const fetchProjectOfftaker = async (projectId) => {
    try {
      const res = await apiGet(`/api/projects/${projectId}`);
      const proj = res?.data;
      const ot = proj?.offtaker;
      if (ot?.id) {
        const option = {
          label: ot.full_name || "",
          value: String(ot.id),
        };
        setSelectedOfftaker(option);
        setOfftakerOptions((prev) => {
          const base = prev?.length
            ? prev
            : [{ label: lang("invoice.selectOfftaker"), value: "" }];
          const exists = base.some((opt) => opt.value === option.value);
          return exists ? base : [...base, option];
        });
        fetchOfftakerAddress(ot.id);
        if (errors.offtaker) setErrors((prev) => ({ ...prev, offtaker: "" }));
      } else {
        setSelectedOfftaker(null);
        setOfftakerAddress("");
      }
    } catch (_) {
      setSelectedOfftaker(null);
      setOfftakerAddress("");
    }
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const nextRow = { ...row, [field]: value };
        if (field === "unit" || field === "price") {
          const qty = Number(nextRow.unit) || 0;
          const rate = Number(nextRow.price) || 0;
          nextRow.item_total = qty * rate;
        }
        return nextRow;
      })
    );
  };

  const handleAddItem = () => {
    setInvoiceItems((prev) => [
      ...prev,
      { item: "", description: "", unit: 1, price: 0, tax: "no-tax" },
    ]);
  };

  const handleRemoveItem = (index) => {
    setInvoiceItems((prev) => {
      if (prev.length === 1) return prev; // keep at least one row
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleLocationChange = (type, value) => {
    if (type === "country") {
      setAddressForm((prev) => ({
        ...prev,
        country_id: value,
        state_id: "",
        city_id: "",
      }));
      handleCountryChange(value);
    } else if (type === "state") {
      setAddressForm((prev) => ({ ...prev, state_id: value, city_id: "" }));
      handleStateChange(value);
    } else if (type === "city") {
      setAddressForm((prev) => ({ ...prev, city_id: value }));
    }
  };

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddressModal = () => {
    setAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    setAddressModalOpen(false);
  };

  const handleSaveAddress = () => {
    const parts = [
      addressForm.address_1,
      addressForm.address_2,
      cities.find((c) => c.id === Number(addressForm.city_id))?.name,
      states.find((s) => s.id === Number(addressForm.state_id))?.name,
      countries.find((c) => c.id === Number(addressForm.country_id))?.name,
      addressForm.zipcode,
    ].filter(Boolean);
    setOfftakerAddress(parts.join(", "));
    setAddressModalOpen(false);
  };

  const fetchInvoiceData = async (id) => {
    try {
      const res = await apiGet(`/api/invoice/${id}`);
      if (res?.success && res?.data) {
        const item = res.data;

        // Set project
        setSelectedProject(
          item.projects
            ? {
                label: item.projects.project_name,
                value: String(item.projects.id),
              }
            : null
        );

        // Set offtaker
        const ofLabel = item.users
          ? [item.users.full_name].filter(Boolean).join(" ") || item.users.email
          : "";
        const editOfftaker = item.users
          ? { label: ofLabel, value: String(item.users.id) }
          : null;
        setSelectedOfftaker(editOfftaker);
        if (editOfftaker) {
          setOfftakerOptions((prev) => {
            const base = prev?.length
              ? prev
              : [{ label: lang("invoice.selectOfftaker"), value: "" }];
            const exists = base.some((opt) => opt.value === editOfftaker.value);
            const filled = {
              label: editOfftaker.label || "",
              value: editOfftaker.value,
            };
            return exists ? base : [...base, filled];
          });
        }

        // Set offtaker address
        if (editOfftaker?.value) {
          const parts = [
            item.users.address_1,
            item.users.address_2,
            item.users.cities?.name,
            item.users.states?.name,
            item.users.countries?.name,
            item.users.zipcode,
          ].filter(Boolean);
          setOfftakerAddress(parts.join(", "));

          // Set address form with initial data
          setAddressForm({
            address_1: item.users.address_1 || "",
            address_2: item.users.address_2 || "",
            country_id: item.users.country_id || "",
            state_id: "", // Will be set after location data loads
            city_id: "", // Will be set after location data loads
            zipcode: item.users.zipcode || "",
          });

          // Store pending address data to be set after location loads
          if (item.users.country_id) {
            setPendingAddressData({
              state_id: item.users.state_id || "",
              city_id: item.users.city_id || "",
            });
            handleCountryChange(item.users.country_id);
            if (item.users.state_id) {
              handleStateChange(item.users.state_id);
            }
          }
        } else {
          setOfftakerAddress("");
        }

        // Set invoice number and prefix
        setInvoicePrefix(item.invoice_prefix || "");
        setSettingInvoiceNumberPrefix(item.invoice_number || "");

        // Set dates
        setInvoiceDate(
          item.invoice_date ? String(item.invoice_date).slice(0, 10) : ""
        );
        setDueDate(item.due_date ? String(item.due_date).slice(0, 10) : "");

        // Set amounts
        setAmount(String(item.sub_amount ?? ""));
        setTotalUnit(String(item.total_amount ?? ""));

        // Set status
        setStatus(
          item.status !== undefined && item.status !== null
            ? String(item.status)
            : ""
        );

        // Set currency
        setCurrency(item.currency ? String(item.currency) : "VND");

        // Set tax selection
        setSelectedTax(item.tax_id ? String(item.tax_id) : "");

        // Set invoice items
        const mappedItems = Array.isArray(item.invoice_items)
          ? item.invoice_items.map((row) => ({
              id: row.id,
              item: row.item || "",
              description: row.description || "",
              unit: row.unit ?? 0,
              price: row.price ?? 0,
              tax: "no-tax",
              item_total: row.item_total ?? 0,
            }))
          : [];
        setInvoiceItems(
          mappedItems.length
            ? mappedItems
            : [{ item: "", description: "", unit: 1, price: 0, tax: "no-tax" }]
        );

        // Set invoice note and terms
        setInvoiceNote(item.notes || "");
        setTermsAndConditions(item.terms_and_conditions || "");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      fetchProjects();
      fetchOfftakers();
      fetchTaxes();
      await fetchSettingData();
      if (invoiceId) {
        await fetchInvoiceData(invoiceId);
      } else {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // Sync address form when location data is loaded
  useEffect(() => {
    if (pendingAddressData && !loadingStates && !loadingCities) {
      setAddressForm((prev) => ({
        ...prev,
        state_id: pendingAddressData.state_id || "",
        city_id: pendingAddressData.city_id || "",
      }));
      setPendingAddressData(null);
    }
  }, [loadingStates, loadingCities, pendingAddressData]);

  // Auto-sync totals from items when items exist
  useEffect(() => {
    if (invoiceItems.length) {
      setAmount(String(finalTotal));
      setTotalUnit(String(finalTotal));
    }
  }, [invoiceItems, itemsTotal, finalTotal]);

  const handleSave = async () => {
    const newErrors = {
      project: !selectedProject?.value ? "Project is required" : "",
      offtaker: !selectedOfftaker?.value ? "Offtaker is required" : "",
      amount: !amount
        ? "Amount is required"
        : isNaN(Number(amount))
        ? "Amount must be a number"
        : "",
      totalUnit: !totalUnit
        ? "Total unit is required"
        : isNaN(Number(totalUnit))
        ? "Total unit must be a number"
        : "",
      // invoiceNumber: !invoiceNumberSuffix ? "Invoice number is required" : "",
      invoiceDate: !invoiceDate ? "Invoice date is required" : "",
      dueDate: !dueDate ? "Due date is required" : "",
    };
    const newStatusError = ""; // Default to unpaid when not provided
    setErrors(newErrors);
    setStatusError(newStatusError);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;

    try {
      setSubmitting(true);
      const statusValue =
        status === "" || status === null || status === undefined
          ? 0
          : parseInt(status, 10);
      const trimmedPrefix = (invoicePrefix || "").trim();
      const trimmedSetting = (settingInvoiceNumberPrefix || "").trim();
      const fullInvoiceNumber = `${trimmedPrefix}${trimmedSetting}${invoiceNumberSuffix}`;

      const preparedItems = invoiceItems
        .map((it) => ({
          item: (it.item || "").trim(),
          description: it.description || "",
          unit: Number(it.unit) || 0,
          price: Number(it.price) || 0,
          tax: it.tax || "no-tax",
          item_total: (Number(it.unit) || 0) * (Number(it.price) || 0),
        }))
        .filter((it) => it.item);

      const itemsTotalValue = preparedItems.reduce(
        (sum, it) => sum + it.item_total,
        0
      );

      const amountValue = preparedItems.length
        ? itemsTotalValue
        : parseFloat(amount);
      const totalUnitValue = preparedItems.length
        ? itemsTotalValue
        : parseFloat(totalUnit);

      const payload = {
        project_id: parseInt(selectedProject.value),
        offtaker_id: parseInt(selectedOfftaker.value),
        invoice_number: trimmedSetting,
        invoice_prefix: trimmedPrefix,
        invoice_date: invoiceDate,
        due_date: dueDate,
        amount: Number.isFinite(amountValue) ? amountValue : 0,
        total_unit: finalTotal ? finalTotal : 0,
        status: statusValue,
        currency,
        tax: selectedTax || "",
        tax_amount: taxAmount,
        billing_adress_1: addressForm.address_1 || "",
        billing_adress_2: addressForm.address_2 || "",
        billing_city_id: addressForm.city_id
          ? parseInt(addressForm.city_id)
          : null,
        billing_state_id: addressForm.state_id
          ? parseInt(addressForm.state_id)
          : null,
        billing_country_id: addressForm.country_id
          ? parseInt(addressForm.country_id)
          : null,
        billing_zipcode: addressForm.zipcode
          ? parseInt(addressForm.zipcode)
          : null,
        items: preparedItems,
        note: invoiceNote || "",
        terms_and_conditions: termsAndConditions || "",
      };
      const res = invoiceId
        ? await apiPut(`/api/invoice/${invoiceId}`, payload)
        : await apiPost("/api/invoice/", payload);

      if (res.success) {
        if (invoiceId) {
          showSuccessToast(lang("invoice.invoiceUpdatedSuccessfully"));
        } else {
          showSuccessToast(lang("invoice.invoiceCreatedSuccessfully"));
        }
        router.push("/admin/finance/invoice");
      }
    } catch (_) {
      // noop
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/finance/invoice");
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              animation: "spin 1s linear infinite",
              display: "inline-block",
              mb: 2,
            }}
          >
            ⏳
          </Box>
          <p>{lang("common.loading") || "Loading..."}</p>
        </Box>
      </Box>
    );
  }

  return (
    <div
      className="col-12"
      style={{
        background: colors.pageBackground,
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: "4px",
              height: "32px",
              backgroundColor: "#2563eb",
              borderRadius: "2px",
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {invoiceId
              ? lang("invoice.updateInvoice")
              : lang("invoice.createInvoice")}
          </h2>
        </Box>
      </Box>

      <Card
        sx={{
          boxShadow: isDark
            ? "0 0 20px rgba(14, 32, 56, 0.3)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBackground,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Section 1: Basic Info */}
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: "#2563eb",
                    borderRadius: "2px",
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {lang("invoice.basicInfo") || "Basic Information"}
                </h4>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth error={!!errors.project}>
                <InputLabel
                  id="project-select-label"
                  sx={{
                    backgroundColor: colors.cardBackground,
                    px: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {lang("invoice.project")}
                </InputLabel>
                <Select
                  labelId="project-select-label"
                  value={selectedProject?.value || ""}
                  label={lang("invoice.project")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const option =
                      projectOptions.find((opt) => opt.value === value) || null;
                    setSelectedProject(option);
                    if (errors.project)
                      setErrors((prev) => ({ ...prev, project: "" }));
                    if (option?.value) {
                      fetchProjectOfftaker(option.value);
                    } else {
                      setSelectedOfftaker(null);
                      setOfftakerAddress("");
                    }
                  }}
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary },
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                    }}
                  >
                    {lang("invoice.selectProject")}
                  </MenuItem>
                  {projectOptions
                    .filter((opt) => opt.value !== "")
                    .map((option) => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                        sx={{
                          backgroundColor: colors.cardBackground,
                          color: colors.text,
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                </Select>
                {errors.project && (
                  <FormHelperText
                    sx={{
                      color: "#ef4444",
                      mt: 0.5,
                      backgroundColor: colors.cardBackground,
                    }}
                  >
                    {errors.project}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl
                fullWidth
                error={!!errors.offtaker}
                disabled={loadingOfftakers}
              >
                <InputLabel
                  id="offtaker-select-label"
                  sx={{
                    backgroundColor: colors.cardBackground,
                    px: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {lang("invoice.offtaker")}
                </InputLabel>
                <Select
                  labelId="offtaker-select-label"
                  value={selectedOfftaker?.value || ""}
                  label={lang("invoice.offtaker")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const option =
                      offtakerOptions.find((opt) => opt.value === value) ||
                      null;
                    setSelectedOfftaker(option);
                    if (errors.offtaker)
                      setErrors((prev) => ({ ...prev, offtaker: "" }));
                    if (option?.value) {
                      fetchOfftakerAddress(option.value);
                    } else {
                      setOfftakerAddress("");
                    }
                  }}
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary },
                    },
                  }}
                >
                  {offtakerOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      sx={{
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.offtaker && (
                  <FormHelperText
                    sx={{
                      color: "#ef4444",
                      mt: 0.5,
                      backgroundColor: colors.cardBackground,
                    }}
                  >
                    {errors.offtaker}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="currency-select-label" sx={{ backgroundColor: colors.cardBackground, px: 1, color: colors.textSecondary }}>
                  {lang("invoice.currency") || "Currency"}
                </InputLabel>
                <Select
                  labelId="currency-select-label"
                  value={currency}
                  label={lang("invoice.currency") || "Currency"}
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary }
                    }
                  }}
                >
                  <MenuItem value="VND" sx={{ backgroundColor: colors.cardBackground, color: colors.text }}>Vietnamese Dong (VND)</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={lang("invoice.invoiceNumber") || "Invoice Number"}
                value={settingInvoiceNumberPrefix}
                onChange={(e) => {
                  setSettingInvoiceNumberPrefix(e.target.value);
                  if (errors.invoiceNumber)
                    setErrors((prev) => ({ ...prev, invoiceNumber: "" }));
                }}
                error={!!errors.invoiceNumber}
                helperText={errors.invoiceNumber}
                placeholder="Invoice Number"
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{
                        mr: 1,
                        fontWeight: "600",
                        color: colors.textSecondary,
                      }}
                    >
                      {invoicePrefix || "INV"}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Section 2: Invoice Details */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  mt: 2,
                }}
              >
                <Box
                  sx={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: "#2563eb",
                    borderRadius: "2px",
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {lang("invoice.invoiceDetails") || "Invoice Details"}
                </h4>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={lang("invoice.invoiceDate") || "Invoice Date"}
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setInvoiceDate(value);
                  if (errors.invoiceDate)
                    setErrors((prev) => ({ ...prev, invoiceDate: "" }));
                  if (
                    value &&
                    invoiceDueAfterDays &&
                    !Number.isNaN(Number(invoiceDueAfterDays)) &&
                    Number(invoiceDueAfterDays) >= 0
                  ) {
                    const base = new Date(`${value}T00:00:00`);
                    if (!isNaN(base.getTime())) {
                      const d = new Date(base);
                      d.setDate(d.getDate() + Number(invoiceDueAfterDays));
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setDueDate(`${yyyy}-${mm}-${dd}`);
                    }
                  }
                }}
                error={!!errors.invoiceDate}
                helperText={errors.invoiceDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={lang("invoice.dueDate") || "Due Date"}
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate)
                    setErrors((prev) => ({ ...prev, dueDate: "" }));
                }}
                error={!!errors.dueDate}
                helperText={errors.dueDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            {offtakerAddress ? (
              <Grid item xs={12} sm={12} md={4}>
                <Box
                  sx={{
                    p: 3,
                    minHeight: 140,
                    backgroundColor: colors.addressBg,
                    border: `2px dashed ${colors.addressBorder}`,
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: colors.addressText,
                        mb: 1,
                      }}
                    >
                      {lang("invoice.offtakerAddress") || "Offtaker Address"}
                    </Box>
                    {/* Line 1: Address Line 1 and 2 */}
                    <div
                      style={{
                        margin: 0,
                        color: colors.text,
                        fontSize: "14px",
                        lineHeight: 1.5,
                      }}
                    >
                      {[addressForm.address_1, addressForm.address_2]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {/* Line 2: Country, State, City */}
                    {(() => {
                      const countryName = countries.find(
                        (c) => Number(c.id) === Number(addressForm.country_id)
                      )?.name;
                      const stateName = states.find(
                        (s) => Number(s.id) === Number(addressForm.state_id)
                      )?.name;
                      const cityName = cities.find(
                        (c) => Number(c.id) === Number(addressForm.city_id)
                      )?.name;
                      const line = [countryName, stateName, cityName]
                        .filter(Boolean)
                        .join(", ");
                      return line ? (
                        <div
                          style={{
                            margin: 0,
                            color: colors.text,
                            fontSize: "14px",
                            lineHeight: 1.5,
                          }}
                        >
                          {line}
                        </div>
                      ) : null;
                    })()}
                    {/* Line 3: Zip Code */}
                    {addressForm.zipcode ? (
                      <div
                        style={{
                          margin: 0,
                          color: colors.text,
                          fontSize: "14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {addressForm.zipcode}
                      </div>
                    ) : null}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenAddressModal}
                    sx={{
                      ml: 2,
                      whiteSpace: "nowrap",
                      borderColor: colors.addressBorder,
                      color: colors.addressText,
                      "&:hover": {
                        backgroundColor: colors.addressBg,
                        borderColor: colors.addressBorder,
                      },
                    }}
                  >
                    <FiEdit3 style={{ marginRight: 6, fontSize: "16px" }} />
                    Edit
                  </Button>
                </Box>
              </Grid>
            ) : (
              <Grid item xs={12} sm={12} md={4}></Grid>
            )}

            {/* <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth error={!!statusError}>
                <InputLabel id="status-select-label" sx={{ backgroundColor: colors.cardBackground, px: 1, color: colors.textSecondary }}>
                  {lang("invoice.status")}
                </InputLabel>
                <Select
                  labelId="status-select-label"
                  value={status}
                  label={lang("invoice.status")}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    if (statusError) setStatusError("");
                  }}
                  renderValue={(value) => {
                    if (value === "" || value === null || value === undefined) {
                      return lang("invoice.selectStatus");
                    }
                    const isPaid = String(value) === "1";
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isPaid ? colors.success : colors.warning }} />
                        {isPaid ? lang("invoice.paid") : lang("invoice.unpaid")}
                      </Box>
                    );
                  }}
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary }
                    }
                  }}
                >
                  <MenuItem value="" sx={{ backgroundColor: colors.cardBackground, color: colors.text }}>{lang("invoice.selectStatus")}</MenuItem>
                  <MenuItem value="1" sx={{ display: "flex", alignItems: "center", gap: 1, backgroundColor: colors.cardBackground, color: colors.text }}>
                    <Box sx={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.success }} />
                    {lang("invoice.paid")}
                  </MenuItem>
                  <MenuItem value="0" sx={{ display: "flex", alignItems: "center", gap: 1, backgroundColor: colors.cardBackground, color: colors.text }}>
                    <Box sx={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.warning }} />
                    {lang("invoice.unpaid")}
                  </MenuItem>
                </Select>
                {statusError && (
                  <FormHelperText sx={{ color: "#ef4444", mt: 0.5 }}>{statusError}</FormHelperText>
                )}
              </FormControl>
            </Grid> */}

            {/* Section 3: Line Items */}
            <Grid item xs={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 3,
                  mt: 2,
                }}
              >
                <Box
                  sx={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: "#2563eb",
                    borderRadius: "2px",
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {lang("invoice.items") || "Line Items"}
                </h4>
              </Box>
            </Grid>

            <Grid item xs={8}>
              <Box
                sx={{
                  mb: 3,
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  startIcon={<FiPlus />}
                  variant="contained"
                  size="small"
                  onClick={handleAddItem}
                  sx={{
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    padding: "8px 16px",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                  }}
                >
                  {lang("invoice.addItem") || "Add Item"}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: isDark
                    ? "0 0 20px rgba(14, 32, 56, 0.3)"
                    : "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.2fr 0.5fr 0.6fr 0.4fr 0.3fr",
                    gap: 1,
                    p: 2,
                    backgroundColor: colors.sectionBg,
                    fontWeight: "700",
                    fontSize: "13px",
                    color: colors.textMuted,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <Box>Item</Box>
                  <Box>Description</Box>
                  <Box>Qty</Box>
                  <Box>Rate</Box>
                  <Box>Amount</Box>
                  <Box sx={{ textAlign: "center" }}>Action</Box>
                </Box>

                {invoiceItems.map((row, idx) => (
                  <InvoiceItem
                    key={row.id || idx}
                    index={idx}
                    item={row}
                    onChange={handleItemChange}
                    onRemove={handleRemoveItem}
                    isDark={isDark}
                    priceWithCurrency={priceWithCurrency}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                }}
              >
                <Box sx={{ minWidth: 320, textAlign: "right" }}>
                  <Box
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: `2px solid ${colors.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: colors.textSecondary,
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {lang("invoice.subtotal") || "Subtotal"}
                    </span>
                    <span
                      style={{
                        fontWeight: "700",
                        color: colors.text,
                        fontSize: "16px",
                      }}
                    >
                      {priceWithCurrency(itemsTotal.toFixed(2))}
                    </span>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ color: colors.textSecondary, fontSize: "13px" }}
                    >
                      {lang("invoice.tax") || "Tax"}
                    </span>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Select
                        size="small"
                        value={selectedTax}
                        onChange={(e) => setSelectedTax(e.target.value)}
                        displayEmpty
                        sx={{
                          minWidth: 140,
                          backgroundColor: colors.cardBackground,
                          borderRadius: "8px",
                          color: colors.text,
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: colors.border },
                            "&:hover fieldset": {
                              borderColor: colors.borderHover,
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: colors.primary,
                            },
                          },
                        }}
                      >
                        <MenuItem
                          value=""
                          sx={{
                            backgroundColor: colors.cardBackground,
                            color: colors.text,
                          }}
                        >
                          {lang("finance.noTax") || "No Tax"}
                        </MenuItem>
                        {taxes.map((tax) => (
                          <MenuItem
                            key={tax.id}
                            value={tax.id}
                            sx={{
                              backgroundColor: colors.cardBackground,
                              color: colors.text,
                            }}
                          >
                            {tax.name} - {tax.value}%
                          </MenuItem>
                        ))}
                      </Select>
                      <span
                        style={{
                          minWidth: 90,
                          textAlign: "right",
                          fontWeight: "600",
                          color: colors.textMuted,
                          fontSize: "14px",
                        }}
                      >
                        {priceWithCurrency(taxAmount.toFixed(2))}
                      </span>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      pt: 2,
                      borderTop: `3px solid ${colors.primary}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {lang("invoice.total") || "Total"}
                    </span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: colors.primary,
                      }}
                    >
                      {priceWithCurrency(finalTotal.toFixed(2))}
                    </span>
                  </Box>
                </Box>
              </Box>

              {itemsError && (
                <FormHelperText error sx={{ mt: 2, fontSize: "13px" }}>
                  {itemsError}
                </FormHelperText>
              )}
            </Grid>

            {/* Section 4: Notes and Terms */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  mt: 2,
                }}
              >
                <Box
                  sx={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: "#2563eb",
                    borderRadius: "2px",
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {lang("invoice.additionalInfo") || "Additional Information"}
                </h4>
              </Box>
            </Grid>

            <Grid item xs={12} md={12}>
              <TextField
                label={lang("invoice.note") || "Invoice Note"}
                value={invoiceNote}
                onChange={(e) => setInvoiceNote(e.target.value)}
                placeholder={
                  lang("invoice.notePlaceholder") ||
                  "Enter any additional notes for this invoice..."
                }
                fullWidth
                multiline
                rows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            <Grid item xs={12} md={12}>
              <TextField
                label={
                  lang("invoice.termsAndConditions") || "Terms and Conditions"
                }
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder={
                  lang("invoice.termsPlaceholder") ||
                  "Enter terms and conditions..."
                }
                fullWidth
                multiline
                rows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            {/* Section 5: Actions */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 3,
                  pt: 3,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    color: colors.textSecondary,
                    borderColor: colors.border,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    padding: "10px 24px",
                    "&:hover": {
                      backgroundColor: colors.sectionBg,
                      borderColor: colors.borderHover,
                    },
                  }}
                >
                  {lang("common.cancel") || "Cancel"}
                </Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    backgroundColor: colors.primary,
                    color: "#fff",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    padding: "10px 32px",
                    minWidth: 140,
                    "&:hover": { backgroundColor: colors.primaryHover },
                    "&:disabled": {
                      backgroundColor: colors.border,
                      color: colors.textMuted,
                    },
                  }}
                >
                  {submitting ? lang("common.loading") : lang("common.save")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Address Edit Modal */}
      <Dialog
        open={addressModalOpen}
        onClose={handleCloseAddressModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 0 20px rgba(14, 32, 56, 0.3)"
              : "0 20px 25px rgba(0,0,0,0.15)",
            backgroundColor: colors.cardBackground,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: "700",
            color: colors.text,
            borderBottom: `1px solid ${colors.border}`,
            pb: 2,
          }}
        >
          {lang("invoice.editOfftakerAddress") || "Edit Offtaker Address"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                label={lang("projects.addressLine1") || "Address Line 1"}
                name="address_1"
                value={addressForm.address_1}
                onChange={handleAddressFormChange}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={lang("projects.addressLine2") || "Address Line 2"}
                name="address_2"
                value={addressForm.address_2}
                onChange={handleAddressFormChange}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    backgroundColor: colors.cardBackground,
                    px: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {lang("projects.country") || "Country"}
                </InputLabel>
                <Select
                  value={addressForm.country_id}
                  label={lang("projects.country") || "Country"}
                  onChange={(e) =>
                    handleLocationChange("country", e.target.value)
                  }
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary },
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                    }}
                  >
                    {lang("projects.selectCountry") || "Select Country"}
                  </MenuItem>
                  {countries.map((country) => (
                    <MenuItem
                      key={country.id}
                      value={country.id}
                      sx={{
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                      }}
                    >
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!addressForm.country_id || loadingStates}
              >
                <InputLabel
                  sx={{
                    backgroundColor: colors.cardBackground,
                    px: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {lang("projects.state") || "State"}
                </InputLabel>
                <Select
                  value={addressForm.state_id}
                  label={lang("projects.state") || "State"}
                  onChange={(e) =>
                    handleLocationChange("state", e.target.value)
                  }
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary },
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                    }}
                  >
                    {lang("projects.selectState") || "Select State"}
                  </MenuItem>
                  {states.map((state) => (
                    <MenuItem
                      key={state.id}
                      value={state.id}
                      sx={{
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                      }}
                    >
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!addressForm.state_id || loadingCities}
              >
                <InputLabel
                  sx={{
                    backgroundColor: colors.cardBackground,
                    px: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {lang("projects.city") || "City"}
                </InputLabel>
                <Select
                  value={addressForm.city_id}
                  label={lang("projects.city") || "City"}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  sx={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: colors.border },
                      "&:hover fieldset": { borderColor: colors.borderHover },
                      "&.Mui-focused fieldset": { borderColor: colors.primary },
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                    }}
                  >
                    {lang("projects.selectCity") || "Select City"}
                  </MenuItem>
                  {cities.map((city) => (
                    <MenuItem
                      key={city.id}
                      value={city.id}
                      sx={{
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                      }}
                    >
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={lang("projects.zipcode") || "Zipcode"}
                name="zipcode"
                value={addressForm.zipcode}
                onChange={handleAddressFormChange}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.cardBackground,
                    borderRadius: "8px",
                    color: colors.text,
                    "& fieldset": { borderColor: colors.border },
                    "&:hover fieldset": { borderColor: colors.borderHover },
                    "&.Mui-focused fieldset": { borderColor: colors.primary },
                  },
                  "& .MuiInputLabel-root": { color: colors.textSecondary },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            borderTop: `1px solid ${colors.border}`,
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseAddressModal}
            sx={{
              color: colors.textSecondary,
              textTransform: "none",
              fontWeight: "600",
              fontSize: "14px",
              "&:hover": { backgroundColor: colors.sectionBg },
            }}
          >
            {lang("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSaveAddress}
            variant="contained"
            sx={{
              backgroundColor: colors.primary,
              color: "#fff",
              textTransform: "none",
              fontWeight: "600",
              fontSize: "14px",
              borderRadius: "8px",
              "&:hover": { backgroundColor: colors.primaryHover },
            }}
          >
            {lang("common.save") || "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InvoiceCreateForm;

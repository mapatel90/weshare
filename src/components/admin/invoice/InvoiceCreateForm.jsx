"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FiEdit3, FiPlus } from "react-icons/fi";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { showSuccessToast } from "@/utils/topTost";
import { useRouter } from "next/navigation";
import useLocationData from "@/hooks/useLocationData";
import InvoiceItem from "./InvoiceItem";

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
  InputAdornment
} from "@mui/material";

const InvoiceCreateForm = ({ invoiceId = null }) => {
  const { lang } = useLanguage();
  const router = useRouter();
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

  const [projectOptions, setProjectOptions] = useState([]);
  const [offtakerOptions, setOfftakerOptions] = useState([]);
  const [loadingOfftakers, setLoadingOfftakers] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOfftaker, setSelectedOfftaker] = useState(null);
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [settingInvoiceNumberPrefix, setSettingInvoiceNumberPrefix] = useState("");
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
      setOfftakerOptions([{ label: lang("invoice.selectOfftaker"), value: "" }]);
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
      setInvoicePrefix(typeof prefixRaw === "string" ? prefixRaw : "");
      setSettingInvoiceNumberPrefix(typeof numberPrefix === "string" ? numberPrefix : "");
      setDefaultTax(defaultTaxSetting);
      setSelectedTax(defaultTaxSetting);
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
      setAddressForm((prev) => ({ ...prev, country_id: value, state_id: "", city_id: "" }));
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
        setInvoiceDate(item.invoice_date ? String(item.invoice_date).slice(0, 10) : "");
        setDueDate(item.due_date ? String(item.due_date).slice(0, 10) : "");
        
        // Set amounts
        setAmount(String(item.amount ?? ""));
        setTotalUnit(String(item.total_amount ?? ""));
        
        // Set status
        setStatus(
          item.status !== undefined && item.status !== null
            ? String(item.status)
            : ""
        );
        
        // Set currency
        setCurrency(item.currency ? String(item.currency) : "VND");

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
        setInvoiceItems(mappedItems.length ? mappedItems : [
          { item: "", description: "", unit: 1, price: 0, tax: "no-tax" },
        ]);
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
    const newStatusError = !status && status !== 0 ? "Status is required" : "";
    setErrors(newErrors);
    setStatusError(newStatusError);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;

    try {
      setSubmitting(true);
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
        status: parseInt(status),
        currency,
        tax: selectedTax || "",
        tax_amount: taxAmount,
        billing_adress_1: addressForm.address_1 || "",
        billing_adress_2: addressForm.address_2 || "",
        billing_city_id: addressForm.city_id ? parseInt(addressForm.city_id) : null,
        billing_state_id: addressForm.state_id ? parseInt(addressForm.state_id) : null,
        billing_country_id: addressForm.country_id ? parseInt(addressForm.country_id) : null,
        billing_zipcode: addressForm.zipcode ? parseInt(addressForm.zipcode) : null,
        items: preparedItems,
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
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <div className="col-12">
          <Box sx={{ mb: 2 }}>
            <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
              {invoiceId ? lang("invoice.updateInvoice") : lang("invoice.createInvoice")}
            </h3>
          </Box>
      <Card>
        <CardContent sx={{ mt: 2 }}>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.project}>
                <InputLabel id="project-select-label">
                  {lang("invoice.project")}
                </InputLabel>
                <Select
                  labelId="project-select-label"
                  value={selectedProject?.value || ""}
                  label={lang("invoice.project")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const option =
                      projectOptions.find((opt) => opt.value === value) ||
                      null;
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
                >
                  <MenuItem value="">
                    {lang("invoice.selectProject")}
                  </MenuItem>
                  {projectOptions
                    .filter((opt) => opt.value !== "")
                    .map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                </Select>
                {errors.project && (
                  <FormHelperText>{errors.project}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.offtaker} disabled={loadingOfftakers}>
                <InputLabel id="offtaker-select-label">
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
                >
                  {offtakerOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.offtaker && (
                  <FormHelperText>{errors.offtaker}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {offtakerAddress && (
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <strong>{lang("invoice.offtakerAddress") || "Offtaker Address"}:</strong>
                    <p style={{ margin: "8px 0 0 0" }}>{offtakerAddress}</p>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenAddressModal}
                    sx={{ ml: 2, whiteSpace: "nowrap" }}
                  >
                    <FiEdit3 style={{ marginRight: 4 }} />
                  </Button>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="currency-select-label">{lang("invoice.currency") || "Currency"}</InputLabel>
                <Select
                  labelId="currency-select-label"
                  value={currency}
                  label={lang("invoice.currency") || "Currency"}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <MenuItem value="VND">Vietnamese Dong (VND)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
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
                 InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{invoicePrefix}</InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={lang("invoice.invoiceDate") || "Invoice Date"}
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  setInvoiceDate(e.target.value);
                  if (errors.invoiceDate)
                    setErrors((prev) => ({ ...prev, invoiceDate: "" }));
                }}
                error={!!errors.invoiceDate}
                helperText={errors.invoiceDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
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
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  startIcon={<FiPlus />}
                  variant="outlined"
                  size="small"
                  onClick={handleAddItem}
                >
                  {lang("invoice.addItem") || "Add Item"}
                </Button>
              </Box>

              <Box sx={{ border: "1px solid #eef0f2", borderRadius: 1, overflowX: "auto" }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.2fr 0.5fr 0.6fr 0.4fr 0.3fr",
                    gap: 1,
                    p: 1,
                    backgroundColor: "#f9fafb",
                    fontWeight: 700,
                    fontSize: 14,
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
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 1,
                  fontWeight: 700,
                  gap: 3,
                }}
              >
                <Box sx={{ minWidth: 200 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="tax-select-label">{lang("invoice.tax") || "Tax"}</InputLabel>
                    <Select
                      labelId="tax-select-label"
                      value={selectedTax}
                      label={lang("invoice.tax") || "Tax"}
                      onChange={(e) => setSelectedTax(e.target.value)}
                    >
                      <MenuItem value="">{lang("finance.noTax") || "No Tax"}</MenuItem>
                      {taxes.map((tax) => (
                        <MenuItem key={tax.id} value={tax.id}>
                          {tax.name} - {tax.value}%
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ minWidth: 200, textAlign: "right" }}>
                  <Box sx={{ mb: 1, pb: 1, borderBottom: "1px solid #e0e0e0" }}>
                    {(lang("invoice.subtotal") || "Subtotal") + ": "}{itemsTotal.toFixed(2)}
                  </Box>
                  {taxAmount > 0 && (
                    <Box sx={{ fontSize: "0.9rem", color: "#666", mb: 1 }}>
                      {(lang("invoice.tax") || "Tax") + ": "}{taxAmount.toFixed(2)}
                    </Box>
                  )}
                  <Box sx={{ fontSize: "1.1rem", fontWeight: 800, pt: 1, borderTop: "2px solid #333" }}>
                    {(lang("invoice.total") || "Total") + ": "}{finalTotal.toFixed(2)}
                  </Box>
                </Box>
              </Box>

              {itemsError && (
                <FormHelperText error sx={{ mt: 0.5 }}>
                  {itemsError}
                </FormHelperText>
              )}
            </Grid>

            {/* <Grid item xs={12} md={4}>
              <TextField
                label={lang("invoice.amount")}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount)
                    setErrors((prev) => ({ ...prev, amount: "" }));
                }}
                error={!!errors.amount}
                helperText={errors.amount}
                placeholder="Amount"
                fullWidth
              />
            </Grid> */}

            {/* <Grid item xs={12} md={4}>
              <TextField
                label={lang("invoice.totalUnit")}
                type="number"
                inputMode="decimal"
                value={totalUnit}
                onChange={(e) => {
                  setTotalUnit(e.target.value);
                  if (errors.totalUnit)
                    setErrors((prev) => ({ ...prev, totalUnit: "" }));
                }}
                error={!!errors.totalUnit}
                helperText={errors.totalUnit}
                placeholder="Total Unit"
                fullWidth
              />
            </Grid> */}

            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!statusError}>
                <InputLabel id="status-select-label">
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
                >
                  <MenuItem value="">{lang("invoice.selectStatus")}</MenuItem>
                  <MenuItem value="1">{lang("invoice.paid")}</MenuItem>
                  <MenuItem value="0">{lang("invoice.unpaid")}</MenuItem>
                </Select>
                {statusError && (
                  <FormHelperText>{statusError}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={submitting}
                  className="common-grey-color"
                  sx={{ minWidth: 150 }}
                >
                  {submitting ? lang("common.loading") : lang("common.save")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Address Edit Modal */}
      <Dialog open={addressModalOpen} onClose={handleCloseAddressModal} maxWidth="sm" fullWidth>
        <DialogTitle>{lang("invoice.editOfftakerAddress") || "Edit Offtaker Address"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={lang("projects.addressLine1") || "Address Line 1"}
                name="address_1"
                value={addressForm.address_1}
                onChange={handleAddressFormChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={lang("projects.addressLine2") || "Address Line 2"}
                name="address_2"
                value={addressForm.address_2}
                onChange={handleAddressFormChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{lang("projects.country") || "Country"}</InputLabel>
                <Select
                  value={addressForm.country_id}
                  label={lang("projects.country") || "Country"}
                  onChange={(e) => handleLocationChange("country", e.target.value)}
                >
                  <MenuItem value="">
                    {lang("projects.selectCountry") || "Select Country"}
                  </MenuItem>
                  {countries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!addressForm.country_id || loadingStates}>
                <InputLabel>{lang("projects.state") || "State"}</InputLabel>
                <Select
                  value={addressForm.state_id}
                  label={lang("projects.state") || "State"}
                  onChange={(e) => handleLocationChange("state", e.target.value)}
                >
                  <MenuItem value="">
                    {lang("projects.selectState") || "Select State"}
                  </MenuItem>
                  {states.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!addressForm.state_id || loadingCities}>
                <InputLabel>{lang("projects.city") || "City"}</InputLabel>
                <Select
                  value={addressForm.city_id}
                  label={lang("projects.city") || "City"}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                >
                  <MenuItem value="">
                    {lang("projects.selectCity") || "Select City"}
                  </MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddressModal}>
            {lang("common.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSaveAddress} variant="contained">
            {lang("common.save") || "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InvoiceCreateForm;

'use client';
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CircularProgress, TextField, Button } from "@mui/material";
import { FiArrowRight, FiSave } from "react-icons/fi";
import { apiGet, apiPut } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";

const MeterView = ({ projectId, handleSaveAction }) => {
    const [form, setForm] = useState({
        meter_url: '',
        sim_number: '',
        sim_start_date: '',
        sim_expire_date: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { lang } = useLanguage();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const validateUrl = (url) => {
        if (!url) return true; // Empty is handled by required validation
        try {
            const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
            return urlPattern.test(url);
        } catch {
            return false;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Validate URL format for meter_url field
        if (name === 'meter_url' && value && !validateUrl(value)) {
            setFieldErrors((prev) => ({ ...prev, [name]: lang('validation.invalidUrl', 'Please enter a valid URL') }));
        } else {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const fetchMeterData = async () => {
        setLoading(true);
        try {
            const res = await apiGet(`/api/projects/meter/${projectId}`);
            // const data = await res.json();
            if (res?.success && res.data) {
                setForm(prev => ({
                    ...prev,
                    meter_url: res.data.meter_url || '',
                    sim_number: res.data.sim_number || '',
                    sim_start_date: res.data.sim_start_date ? new Date(res.data.sim_start_date).toISOString().split('T')[0] : '',
                    sim_expire_date: res.data.sim_expire_date ? new Date(res.data.sim_expire_date).toISOString().split('T')[0] : '',
                }));
            }
        } catch (error) {
            console.error('Failed to fetch meter data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeterData();
    }, [projectId]);

    const saveMeterData = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        // Validate required fields
        let errors = {};
        if (!form.meter_url) {
            errors.meter_url = lang('common.requiredField', 'This field is required');
        } else if (!validateUrl(form.meter_url)) {
            errors.meter_url = lang('validation.invalidUrl', 'Please enter a valid URL');
        }
        if (!form.sim_number) errors.sim_number = lang('common.requiredField', 'This field is required');
        if (!form.sim_start_date) errors.sim_start_date = lang('common.requiredField', 'This field is required');
        if (!form.sim_expire_date) errors.sim_expire_date = lang('common.requiredField', 'This field is required');
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setLoading(false);
            return false;
        }
        try {
            const res = await apiPut(`/api/projects/meter/${projectId}`, form);
            if (res.success) {
                setSuccess(true);
                showSuccessToast(lang('meter.meterUpdatedSuccessfully', 'Meter updated successfully'));
                setFieldErrors({});
                return true;
            } else {
                showErrorToast(res.message || 'Failed to save meter info');
                return false;
            }
        } catch (err) {
            setError('Network error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveMeterData();
    };

    const handleSaveActionLocal = async (action) => {
        const success = await saveMeterData();
        if (success) {
            handleSaveAction(action);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="card mb-4">
                <div className="card-header">
                    <h6 className="card-title mb-0">{lang('meter.meterInformation', 'Meter Information')}</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <TextField
                                fullWidth
                                type="text"
                                label={`${lang('meter.meterUrl', 'Meter Url')}`}
                                name="meter_url"
                                value={form.meter_url}
                                onChange={handleChange}
                                error={!!fieldErrors.meter_url}
                                helperText={fieldErrors.meter_url}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${lang('meter.enterMeterUrl', 'Enter Meter Url')}`}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <TextField
                                fullWidth
                                type="text"
                                label={`${lang('meter.simNumber', 'SIM Number')}`}
                                name="sim_number"
                                value={form.sim_number}
                                onChange={handleChange}
                                error={!!fieldErrors.sim_number}
                                helperText={fieldErrors.sim_number}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${lang('meter.enterSimNumber', 'Enter SIM number')}`}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <TextField
                                fullWidth
                                type="date"
                                label={`${lang('meter.simStartDate', 'SIM Start Date')}`}
                                InputLabelProps={{ shrink: true }}
                                name="sim_start_date"
                                value={form.sim_start_date}
                                onChange={handleChange}
                                error={!!fieldErrors.sim_start_date}
                                helperText={fieldErrors.sim_start_date}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${lang('meter.enterSimStartDate', 'Enter SIM start date')}`}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <TextField
                                fullWidth
                                label={`${lang('meter.simExpireDate', 'SIM Expire Date')}`}
                                InputLabelProps={{ shrink: true }}
                                type="date"
                                name="sim_expire_date"
                                value={form.sim_expire_date}
                                onChange={handleChange}
                                error={!!fieldErrors.sim_expire_date}
                                helperText={fieldErrors.sim_expire_date}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {/* Actions inside Address Information */}
                    <div className="col-12 d-flex justify-content-end gap-2">
                        <Button
                            type="button"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <FiSave />}
                            onClick={() => handleSaveActionLocal('saveAndClose')}
                            className="common-grey-color"
                            style={{
                                marginTop: "2px",
                                marginBottom: "2px",
                            }}
                        >
                            {loading
                                ? lang("common.saving", "Saving")
                                : lang("projects.saveAndClose", "Save & Close")}
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <FiSave />}
                            onClick={() => handleSaveActionLocal('saveNext')}
                            style={{
                                marginTop: "2px",
                                marginBottom: "2px",
                            }}
                        >
                            {loading
                                ? lang("common.saving", "Saving")
                                : lang("projects.saveNext", "Save & Next")}
                            <FiArrowRight />
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default MeterView;
'use client';
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CircularProgress, TextField, Button } from "@mui/material";
import { FiSave } from "react-icons/fi";
import { apiGet, apiPut } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";

const MeterView = ({ projectId }) => {
    const [form, setForm] = useState({
        meter_name: '',
        meter_number: '',
        sim_number: '',
        sim_start_date: '',
        sim_expire_date: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { lang } = useLanguage();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const fetchMeterData = async () => {
        setLoading(true);   
        try {
            const res = await apiGet(`/api/projects/meter/${projectId}`);
            // const data = await res.json();
            if (res?.success && res.data) {
                setForm(prev => ({
                    ...prev,
                    meter_name: res.data.meter_name || '',
                    meter_number: res.data.meter_number || '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        // Validate required fields
        let errors = {};
        if (!form.meter_name) errors.meter_name = lang('common.requiredField', 'This field is required');
        if (!form.meter_number) errors.meter_number = lang('common.requiredField', 'This field is required');
        if (!form.sim_number) errors.sim_number = lang('common.requiredField', 'This field is required');
        if (!form.sim_start_date) errors.sim_start_date = lang('common.requiredField', 'This field is required');
        if (!form.sim_expire_date) errors.sim_expire_date = lang('common.requiredField', 'This field is required');
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setLoading(false);
            return;
        }
        try {
            const res = await apiPut(`/api/projects/meter/${projectId}`, form);
            if (res.success) {
                setSuccess(true);
                showSuccessToast(lang('meter.meterUpdatedSuccessfully', 'Meter updated successfully'));
                setFieldErrors({});
            } else {
                showErrorToast(res.message || 'Failed to save meter info');
            }
        } catch (err) {
            setError('Network error');
        }
        setLoading(false);
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
                                label={`${lang('meter.meterName', 'Meter Name')}`}
                                name="meter_name"
                                value={form.meter_name}
                                onChange={handleChange}
                                error={!!fieldErrors.meter_name}
                                helperText={fieldErrors.meter_name}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${lang('meter.enterMeterName', 'Enter meter name')}`}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <TextField
                                fullWidth
                                type="text"
                                label={`${lang('meter.meterNumber', 'Meter Number')}`}
                                name="meter_number"
                                value={form.meter_number}
                                onChange={handleChange}
                                error={!!fieldErrors.meter_number}
                                helperText={fieldErrors.meter_number}
                                className="w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${lang('meter.enterMeterNumber', 'Enter meter number')}`}
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
                    <Button
                        type="submit"
                        disabled={loading}
                        className="common-grey-color"
                        style={{ float: 'inline-end' }}
                    >
                        {loading ? 'Saving...' : lang('common.save', 'Save')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default MeterView;
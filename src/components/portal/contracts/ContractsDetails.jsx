'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { showErrorToast, showSuccessToast } from '@/utils/topTost';


const Field = ({ label, value }) => (
    <div className="mb-4">
        <div className="font-semibold text-sm mb-1">{label}</div>
        <div className="text-gray-800">{value ?? '-'}</div>
    </div>
);

const ContractsDetails = ({ contractId }) => {
    const { lang } = useLanguage();
    const [contract, setContracts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    // Approve/Reject contract
    const handleContractAction = async (status) => {
        if (!contractId) return;
        setActionLoading(true);
        try {
            // status: 1 = Approved, 2 = Rejected
            let payload = { status };
            if (status === 2) {
                payload.reason = rejectReason;
            }
            const res = await apiPut(`/api/contracts/${contractId}/status`, payload);
            if (res?.success) {
                if (status === 1) {
                    showSuccessToast("Approved successfully.");
                } else {
                    showSuccessToast("Rejected successfully.");
                }
                await fetchContracts();
                setShowRejectModal(false);
                setRejectReason("");
            } else {
                showErrorToast("Failed to update contract status.");
            }
        } catch (e) {
            showErrorToast("Error updating contract status.");
        }
        setActionLoading(false);
    };

    const fetchContracts = async () => {
        setIsLoading(true);
        try {
            const res = await apiGet("/api/contracts?id=" + contractId);
            if (res?.success) {
                const all = Array.isArray(res.data) ? res.data : [];
                setContracts(all[0] || null);
            } else {
                setContracts(null);
            }
        } catch (e) {
            setContracts([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchContracts();
    }, [contractId]);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading contract details...</div>;
    }
    if (!contract) {
        return <div className="p-8 text-center text-red-500">Contract not found.</div>;
    }

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col items-center">
            <div className="w-full">
                <div className="bg-white rounded-xl p-8 mb-8">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900 border-b pb-2">{contract.contractTitle}</h1>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2 text-gray-800">Contract Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-6">
                            <div>
                                <Field label={lang('psrojects.projectName', 'Contract Name')} value={contract.project.project_name} />
                                <Field label={lang('prsojects.projectType', 'Contract Description')} value={contract.contractDescription} />
                            </div>
                            <div>
                                <Field label={lang('prosjects.selectOfftaker', 'Contract Date')} value={`${contract.contractDate ? new Date(contract.contractDate).toLocaleDateString('en-GB') : '-'}`.trim()} />
                                <Field label={lang('prosjects.selectOfftaker', 'Contract Document')} value={
                                    contract.documentUpload ? (
                                        <a
                                            href={contract.documentUpload}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 font-medium hover:underline"
                                        >
                                            View File
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">No file</span>
                                    )
                                }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Project Information</h2>
                        {/* <h2 className="text-xl font-semibold mb-2 text-blue-700">{contract.project.project_name}</h2> */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Field label={lang('projects.projectName', 'Project Name')} value={contract.project.project_name} />
                                <Field label={lang('projects.projectType', 'Project Type')} value={contract.project.project_type} />
                                <Field label={lang('meter.meterName', 'Meter Name')} value={contract.project.meter_name} />
                                <Field label={lang('projects.sim_number', 'SIM Number')} value={contract.project.sim_number} />
                            </div>
                            <div>
                                <Field label={lang('projects.status', 'Status')} value={contract.project.status === 1 ? lang('projects.active', 'Active') : lang('projects.inactive', 'Inactive')} />
                                <Field label={lang('projects.weshareprofite', 'Weshare profite')} value={contract.project.weshare_profit} />
                                <Field label={lang('meter.meterNumber', 'Meter Number')} value={contract.project.meter_number} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                            <Field label={lang('projects.country', 'Country')} value={contract.project.country?.name} />
                            <Field label={lang('projects.state', 'State')} value={contract.project.state?.name} />
                            <Field label={lang('projects.city', 'City')} value={contract.project.city?.name} />
                            <Field label={lang('projects.zipcode', 'Zip Code')} value={contract.project.zipcode} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Field label={lang('projects.addressLine1', 'Address Line 1')} value={contract.project.address_1} />
                            {/* <Field label={lang('projects.addressLine2', 'Address Line 2')} value={contract.project.address_2} /> */}
                        </div>
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <Field label={lang('common.createdAt', 'Created At')} value={contract.createdAt ? new Date(contract.createdAt).toLocaleString() : '-'} />
                                <Field label={lang('common.updatedAt', 'Updated At')} value={contract.updatedAt ? new Date(contract.updatedAt).toLocaleString() : '-'} />
                            </div> */}
                    </div>
                    {/* Action Buttons */}
                    {contract.status === 0 && (
                        <div className="flex justify-end mt-8">
                            <button
                                className="px-6 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 mr-4 disabled:opacity-50"
                                disabled={actionLoading}
                                onClick={() => handleContractAction(1)}
                            >
                                {actionLoading ? "Processing..." : "Approve"}
                            </button>

                            <button
                                className="px-6 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                disabled={actionLoading}
                                onClick={() => setShowRejectModal(true)}
                            >
                                {actionLoading ? "Processing..." : "Reject"}
                            </button>
                        </div>
                    )}
                    {/* Reject Reason Modal */}
                    {showRejectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
                            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4 text-gray-800">Reject Contract</h2>
                                <label className="block mb-2 font-medium text-gray-700">Reason for rejection</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 mb-2"
                                    rows={3}
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Enter reason..."
                                />
                                {rejectError && <div className="text-red-500 mb-2">{rejectError}</div>}
                                <div className="flex justify-end mt-4">
                                    <button
                                        className="px-4 py-2 mr-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                                        onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); }}
                                        disabled={actionLoading}
                                    >Cancel</button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            if (!rejectReason.trim()) {
                                                setRejectError("Reason is required.");
                                                return;
                                            }
                                            setRejectError("");
                                            await handleContractAction(2);
                                        }}
                                    >{actionLoading ? "Processing..." : "Reject"}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractsDetails;

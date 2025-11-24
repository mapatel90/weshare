'use client';

import React, { useState, useEffect }from 'react';
import { apiGet } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';


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
                                    {/* <Field label={lang('projects.selectOfftaker', 'Offtaker')} value={`${contract.project.offtaker?.fullName ?? ''}`.trim()} /> */}
                                </div>
                                <div>
                                    <Field label={lang('projects.status', 'Status')} value={contract.project.status === 1 ? lang('projects.active', 'Active') : lang('projects.inactive', 'Inactive')} />
                                    {/* <Field label={lang('projects.investorProfit', 'Investor Profit')} value={contract.project.investor_profit} /> */}
                                    <Field label={lang('projects.weshareprofite', 'Weshare profite')} value={contract.project.weshare_profit} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                <Field label={lang('projects.country', 'Country')} value={contract.project.country?.name} />
                                <Field label={lang('projects.state', 'State')} value={contract.project.state?.name} />
                                <Field label={lang('projects.city', 'City')} value={contract.project.city?.name} />
                                <Field label={lang('projects.zipcode', 'Zip Code')} value={contract.project.zipcode} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <Field label={lang('projects.addressLine1', 'Address Line 1')} value={contract.project.address1} />
                                {/* <Field label={lang('projects.addressLine2', 'Address Line 2')} value={contract.project.address2} /> */}
                            </div>
                            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <Field label={lang('common.createdAt', 'Created At')} value={contract.createdAt ? new Date(contract.createdAt).toLocaleString() : '-'} />
                                <Field label={lang('common.updatedAt', 'Updated At')} value={contract.updatedAt ? new Date(contract.updatedAt).toLocaleString() : '-'} />
                            </div> */}
                        </div>
                           
                    </div>
                </div>
            </div>
        );
};

export default ContractsDetails;

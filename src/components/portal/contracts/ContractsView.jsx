'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { Search, Calendar, ChevronDown, MapPin } from 'lucide-react';

// Fetch contracts from API and set state
const ContractsView = () => {
    const pathName = usePathname();
    const parts = pathName.split("/").filter(Boolean);
    const { user } = useAuth();
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

    const fetchContracts = async () => {
        setIsLoading(true);
        try {
            let contractsData = [];
            if (parts[0] === "investor") {
                const investorRes = await apiGet("/api/investors/?userId=" + user.id);
                console.log("investorRes", investorRes);
                if (investorRes?.success && Array.isArray(investorRes.data) && investorRes.data.length) {
                    // Get all investor ids
                    const investorIds = investorRes.data.map(inv => inv.id);
                    console.log("investorIds", investorIds);
                    // Fetch contracts for each investorId and combine results
                    let allContracts = [];
                    for (const investorId of investorIds) {
                        const contractsRes = await apiGet("/api/contracts?investorId=" + investorId);
                        console.log(`contracts for investorId ${investorId}`, contractsRes);
                        if (contractsRes?.success && Array.isArray(contractsRes.data)) {
                            allContracts = allContracts.concat(contractsRes.data);
                        }
                    }
                    contractsData = allContracts;
                }
            } else {
                const res = await apiGet("/api/contracts?offtakerId=" + user.id);
                if (res?.success) {
                    contractsData = Array.isArray(res.data) ? res.data : [];
                    console.log("fetched contracts", contractsData);
                }
            }
            setContracts(contractsData);
        } catch (e) {
            setContracts([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleView = (number) => {
        // View logic here
        router.push("/offtaker/billings/invoice");
    };


    const getInitials = (str = '') => {
        if (!str) return '';
        const words = str.split(' ');
        return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : words[0][0].toUpperCase();
    };

        // Filter and sort contracts
        const filteredContracts = contracts
            .filter(contract => {
                const title = contract.contract_title || '';
                const userName = contract.user_name || '';
                const projectName = contract.project_name || '';
                const search = searchTerm.toLowerCase();
                return (
                    title.toLowerCase().includes(search) ||
                    userName.toLowerCase().includes(search) ||
                    projectName.toLowerCase().includes(search)
                );
            })
            .sort((a, b) => {
                if (sortOption === 'newest') {
                    return new Date(b.contractDate) - new Date(a.contractDate);
                } else if (sortOption === 'oldest') {
                    return new Date(a.contractDate) - new Date(b.contractDate);
                } else if (sortOption === 'az') {
                    const aTitle = (a.projectName || a.contractTitle || '').toLowerCase();
                    const bTitle = (b.projectName || b.contractTitle || '').toLowerCase();
                    return aTitle.localeCompare(bTitle);
                }
                return 0;
            });


    const ContractCard = ({ contract }) => {
        const title = contract.contract_title ? contract.contract_title : '-';
        const description = contract.contract_description ? contract.contract_description : '-';
        const date = contract.contract_date ? new Date(contract.contract_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const initials = getInitials(title);

        return (
            <div className="bg-white rounded-2xl shadow border border-gray-100 flex flex-row items-center w-fullmax-w-md mx-auto p-6 min-h-[110px]">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg mr-4">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-gray-900 truncate">{title}</div>
                    <div className="text-xs text-gray-400 mt-1">{date}</div>
                    <div className="text-sm text-gray-600 mt-2 truncate">{description}</div>
                </div>
                <div className="flex flex-col items-end justify-between h-full ml-4">
                      {parts[0] === "investor" ? (
                        <a
                        href={`/investor/contracts/details/${contract.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                        View
                        </a>
                    ) : (
                        <a
                        href={`/offtaker/contracts/details/${contract.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                        View
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full from-slate-50 to-slate-100 p-4">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Search Input */}
                            <div className="flex-1 min-w-[250px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                                    style={{ backgroundColor: "#F5F5F5" }}
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative date-filter-dropdown ">
                                <select
                                    value={sortOption}
                                    onChange={e => setSortOption(e.target.value)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    style={{ minWidth: 140 }}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="az">Project A→Z</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Card Grid */}
                    <div className="px-6 py-4"> 
                            {isLoading ? (
                                <div className="text-center text-sm text-gray-500 py-8">Loading contracts...</div>
                            ) : filteredContracts.length ? (
                                <div className="flex flex-wrap gap-6 float-left pb-6">
                                    {filteredContracts.map((contract) => (
                                        <ContractCard key={contract.id} contract={contract} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-8">No data available.</div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractsView;
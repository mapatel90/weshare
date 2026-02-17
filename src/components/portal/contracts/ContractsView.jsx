'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { apiGet, apiUpload } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/utils/topTost';
import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, Clock, CheckCircle, AlertCircle, XCircle, Eye, User, Building2, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildUploadUrl } from '@/utils/common';

// Fetch contracts from API and set state
const ContractsView = () => {
    const pathName = usePathname();
    const parts = pathName.split("/").filter(Boolean);
    const { user } = useAuth();
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState(""); // For debounced search
    const [sortOption, setSortOption] = useState("newest");
    const [statusFilter, setStatusFilter] = useState("all"); // Status filter
    const { lang } = useLanguage();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(4);

    // Modal states for approve/reject
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveFile, setApproveFile] = useState(null);
    const [approveError, setApproveError] = useState("");

    // Build query params for API
    const buildQueryParams = () => {
        const params = new URLSearchParams();

        // User filter based on role
        if (parts[0] === "investor") {
            params.append("investorId", user.id);
        } else {
            params.append("offtakerId", user.id);
        }

        // Pagination
        params.append("page", currentPage);
        params.append("limit", perPage);

        // Search
        if (searchTerm.trim()) {
            params.append("search", searchTerm.trim());
        }

        // Status filter
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }

        // Sort
        params.append("sortBy", sortOption);

        return params.toString();
    };

    const fetchContracts = async () => {
        setIsLoading(true);
        try {
            const queryString = buildQueryParams();
            const res = await apiGet(`/api/contracts?${queryString}`);

            if (res?.success) {
                const contractsData = Array.isArray(res.data) ? res.data : [];
                setContracts(contractsData);

                // Set pagination info from response
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages || res.pagination.pages || 1);
                    setTotalCount(res.pagination.total || contractsData.length);
                } else {
                    setTotalPages(1);
                    setTotalCount(contractsData.length);
                }
            } else {
                setContracts([]);
                setTotalPages(1);
                setTotalCount(0);
            }
        } catch (e) {
            setContracts([]);
            setTotalPages(1);
            setTotalCount(0);
        }
        setIsLoading(false);
    };

    // Fetch when filters change
    useEffect(() => {
        fetchContracts();
    }, [currentPage, searchTerm, statusFilter, sortOption, perPage]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchTerm) {
                setSearchTerm(searchInput);
                setCurrentPage(1); // Reset to first page on search
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset page when filters change
    const handleFilterChange = (filterType, value) => {
        setCurrentPage(1);
        if (filterType === 'status') setStatusFilter(value);
        if (filterType === 'sort') setSortOption(value);
    };

    // Handle approve/reject contract
    const handleContractAction = async (status, file = null) => {
        if (!selectedContract?.id) return;
        setActionLoading(true);
        try {
            let payload = new FormData();
            payload.append("status", status);

            if (status === 2) {
                payload.append("reason", rejectReason);
            }

            if (status === 1 && file) {
                payload.append("file", file);
            }

            const res = await apiUpload(
                `/api/contracts/${selectedContract.id}/status`,
                payload,
                { method: "PUT" }
            );

            if (res?.success) {
                if (status === 1) {
                    showSuccessToast(lang("common.approvedSuccess") || "Approved successfully.");
                } else {
                    showSuccessToast(lang("common.rejectedSuccess") || "Rejected successfully.");
                }
                await fetchContracts();
                closeModals();
            } else {
                showErrorToast(lang("common.updateFailed") || "Failed to update contract status.");
            }
        } catch (e) {
            showErrorToast(lang("common.errorUpdating") || "Error updating contract status.");
        }
        setActionLoading(false);
    };

    // Close all modals and reset states
    const closeModals = () => {
        setShowRejectModal(false);
        setShowApproveModal(false);
        setSelectedContract(null);
        setRejectReason("");
        setRejectError("");
        setApproveFile(null);
        setApproveError("");
    };

    // Open approve modal
    const openApproveModal = (contract) => {
        setSelectedContract(contract);
        setShowApproveModal(true);
    };

    // Open reject modal
    const openRejectModal = (contract) => {
        setSelectedContract(contract);
        setShowRejectModal(true);
    };

    const getInitials = (str = '') => {
        if (!str || typeof str !== 'string') return '';
        const words = str.trim().split(' ').filter(Boolean);
        if (words.length === 0) return '';
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return words[0][0].toUpperCase();
    };

    // Pagination handlers
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };


    // Status configuration with colors and icons
    const getStatusConfig = (status) => {
        switch (status) {
            case 0:
                return {
                    label: lang("common.pending") || "Pending",
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-700',
                    borderColor: 'border-amber-200',
                    icon: Clock,
                    dotColor: 'bg-amber-500'
                };
            case 1:
                return {
                    label: lang("common.approved") || "Approved",
                    bgColor: 'bg-emerald-50',
                    textColor: 'text-emerald-700',
                    borderColor: 'border-emerald-200',
                    icon: CheckCircle,
                    dotColor: 'bg-emerald-500'
                };
            case 2: // Rejected
                return {
                    label: lang("common.rejected") || "Rejected",
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-200',
                    icon: XCircle,
                    dotColor: 'bg-red-500'
                };
            case 3:
                return {
                    label: lang("contract.cancel") || "Cancelled",
                    bgColor: 'bg-slate-50',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-200',
                    icon: AlertCircle,
                    dotColor: 'bg-red-500'
                };
            default:
                return {
                    label: lang("common.unknown") || "Unknown",
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-600',
                    borderColor: 'border-gray-200',
                    icon: FileText,
                    dotColor: 'bg-gray-400'
                };
        }
    };

    const ContractCard = ({ contract }) => {
        const title = String(contract.contract_title || '-');
        const description = String(contract.contract_description || '-');
        const contractDate = contract.contract_date;
        const date = contractDate && !isNaN(new Date(contractDate).getTime())
            ? new Date(contractDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
        const status = contract.status ?? contract.contract_status;
        const statusConfig = getStatusConfig(status);
        const projectName = String(contract.project_name || '');
        const projectImage = contract.projects?.project_images[0]?.path || null;
        const offtakerName = String(contract.projects?.offtaker?.full_name || '-');
        const investorName = String(contract.projects?.investor?.full_name || '-');
        const initials = getInitials(title);

        const viewUrl = parts[0] === "investor"
            ? `/investor/contracts/details/${contract.id}`
            : `/offtaker/contracts/details/${contract.id}`;

        // Check if pending (status 0) - show approve/reject buttons
        const isPending = status === 0;

        return (
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Header Image Section */}
                <div className="relative h-32 sm:h-36 overflow-hidden">
                    {projectImage ? (
                        <img
                            src={buildUploadUrl(projectImage) || "/uploads/general/noimage.jpeg"}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/uploads/general/noimage.jpeg";
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <pattern id="grain" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                            <circle cx="25" cy="25" r="1" fill="white" opacity="0.1" />
                                            <circle cx="75" cy="75" r="1" fill="white" opacity="0.1" />
                                            <circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15" />
                                        </pattern>
                                    </defs>
                                    <rect width="100" height="100" fill="url(#grain)" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Overlay with Title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Logo + Title on Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-700 font-bold text-sm shadow-lg flex-shrink-0">
                            {initials || <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base truncate drop-shadow-md">
                                {title}
                            </h3>
                            {projectName && (
                                <p className="text-xs text-white/80 truncate">{projectName}</p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium backdrop-blur-sm ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                        {statusConfig.label}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                    {/* Offtaker & Investor Row */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-700 uppercase tracking-wide mb-1">{lang("home.exchangeHub.offtaker") || "Offtaker"}</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{offtakerName}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-700 uppercase tracking-wide mb-1">{lang("authentication.becomeInvestor") || "Investor"}</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-3 h-3 text-emerald-600" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{investorName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
                        {description}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-700 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{date || '-'}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {isPending ? (
                            <>
                                <button
                                    onClick={() => openApproveModal(contract)}
                                    disabled={actionLoading}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{lang("common.approve") || "Approve"}</span>
                                </button>
                                <button
                                    onClick={() => openRejectModal(contract)}
                                    disabled={actionLoading}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>{lang("common.reject") || "Reject"}</span>
                                </button>
                                <a
                                    href={viewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                    title={lang("navigation.view")}
                                >
                                    <Eye className="w-4 h-4" />
                                </a>
                            </>
                        ) : (
                            <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                {lang("navigation.view")}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-6">
            <div className="mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Filters */}
                    <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1 relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={lang("common.search") || "Search contracts..."}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Status Filter Dropdown */}
                            <div className="w-full sm:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={e => handleFilterChange('status', e.target.value)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors cursor-pointer outline-none"
                                    style={{ minWidth: 140 }}
                                >
                                    <option value="all">{lang("common.allStatus") || "All Status"}</option>
                                    <option value="0">{lang("common.pending") || "Pending"}</option>
                                    <option value="1">{lang("common.approved") || "Approved"}</option>
                                    <option value="2">{lang("common.rejected") || "Rejected"}</option>
                                    <option value="3">{lang("contract.cancel") || "Cancelled"}</option>
                                </select>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="w-full sm:w-auto">
                                <select
                                    value={sortOption}
                                    onChange={e => handleFilterChange('sort', e.target.value)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors cursor-pointer outline-none"
                                    style={{ minWidth: 140 }}
                                >
                                    <option value="newest">{lang("common.Newest") || "Newest"}</option>
                                    <option value="oldest">{lang("common.Oldest") || "Oldest"}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Card Grid */}
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-gray-500">{lang("common.loading")}</p>
                            </div>
                        ) : contracts.length ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {contracts.map((contract) => (
                                        <ContractCard key={contract.id} contract={contract} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                                    {/* Page info */}
                                    {/* <p className="text-sm text-gray-500 order-2 sm:order-1">
                                            {lang("common.page") || "Page"} {currentPage} {"of"} {totalPages}
                                        </p> */}
                                    {/* Results count */}
                                    {!isLoading && (
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-xs text-gray-500">
                                                {/* {lang("common.showing") || "Showing"} {contracts.length} {lang("common.of") || "of"} {totalCount} {lang("common.contracts") || "contracts"} */}
                                            </p>
                                            {/* Per page selector */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{lang("common.showing") || "Per page"}:</span>
                                                <select
                                                    value={perPage}
                                                    onChange={(e) => {
                                                        setPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    <option value={4}>4</option>
                                                    <option value={8}>8</option>
                                                    <option value={12}>12</option>
                                                    <option value={16}>16</option>
                                                    <option value={20}>20</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pagination controls */}
                                    <div className="flex items-center gap-1 order-1 sm:order-2">
                                        {/* First page */}
                                        <button
                                            onClick={() => goToPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title={lang("common.firstPage") || "First page"}
                                        >
                                            <ChevronsLeft className="w-4 h-4" />
                                        </button>

                                        {/* Previous page */}
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title={lang("common.previousPage") || "Previous"}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        {/* Page numbers */}
                                        <div className="flex items-center gap-1 mx-1">
                                            {getPageNumbers().map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => goToPage(page)}
                                                    className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                        ? 'bg-slate-800 text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Next page */}
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title={lang("common.nextPage") || "Next"}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>

                                        {/* Last page */}
                                        <button
                                            onClick={() => goToPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title={lang("common.lastPage") || "Last page"}
                                        >
                                            <ChevronsRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">{lang("common.noData")}</p>
                                <p className="text-sm text-gray-400 mt-1">{lang("common.noContractsFound") || "No contracts found"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reject Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {lang("common.rejectContract") || "Reject Contract"}
                            </h2>
                        </div>

                        {selectedContract && (
                            <p className="text-sm text-gray-500 mb-4">
                                {lang("common.rejectingContract") || "Rejecting"}: <span className="font-medium text-gray-700">{selectedContract.contract_title}</span>
                            </p>
                        )}

                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            {lang("common.reasonForRejection") || "Reason for rejection"} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 mb-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition-all resize-none"
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={lang("common.enterReason") || "Enter reason..."}
                        />
                        {rejectError && (
                            <div className="text-red-500 text-sm mb-2">{rejectError}</div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                                onClick={closeModals}
                                disabled={actionLoading}
                            >
                                {lang("common.cancel") || "Cancel"}
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                                disabled={actionLoading}
                                onClick={async () => {
                                    if (!rejectReason.trim()) {
                                        setRejectError(lang("common.reasonRequired") || "Reason is required.");
                                        return;
                                    }
                                    setRejectError("");
                                    await handleContractAction(2);
                                }}
                            >
                                {actionLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        {lang("common.processing") || "Processing..."}
                                    </span>
                                ) : (
                                    lang("common.reject") || "Reject"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal with File Upload */}
            {showApproveModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {lang("common.approveContract") || "Approve Contract"}
                            </h2>
                        </div>

                        {selectedContract && (
                            <p className="text-sm text-gray-500 mb-4">
                                {lang("common.approvingContract") || "Approving"}: <span className="font-medium text-gray-700">{selectedContract.contract_title}</span>
                            </p>
                        )}

                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            {lang("common.uploadSignedDocument") || "Upload Signed Document (PDF only)"} <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-2 bg-gray-50 hover:bg-gray-100 hover:border-emerald-300 transition-all cursor-pointer">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.type !== "application/pdf") {
                                            setApproveError(lang("common.onlyPdfAllowed") || "Only PDF files are allowed.");
                                            setApproveFile(null);
                                        } else {
                                            setApproveFile(file);
                                            setApproveError("");
                                        }
                                    }
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            />
                        </div>
                        {approveFile && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <p className="text-sm text-emerald-700 truncate">{approveFile.name}</p>
                            </div>
                        )}
                        {approveError && (
                            <div className="text-red-500 text-sm mb-2">{approveError}</div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                                onClick={closeModals}
                                disabled={actionLoading}
                            >
                                {lang("common.cancel") || "Cancel"}
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition-colors disabled:opacity-50"
                                disabled={actionLoading}
                                onClick={async () => {
                                    if (!approveFile) {
                                        setApproveError(lang("common.fileRequired") || "File upload is required.");
                                        return;
                                    }
                                    setApproveError("");
                                    await handleContractAction(1, approveFile);
                                }}
                            >
                                {actionLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        {lang("common.processing") || "Processing..."}
                                    </span>
                                ) : (
                                    lang("common.approve") || "Approve"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsView;
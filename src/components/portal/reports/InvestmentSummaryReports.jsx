'use client';

import React from 'react';



const staticSavingReportsData = [
    {
        projectName: 'Project Alpha',
        inverterName: 'Inverter X',
        date: '2025-11-19',
        startTime: '09:05',
        endTime: '09:25',
        generatedKW: '1.6 kw',
    },
    {
        projectName: 'Project Beta',
        inverterName: 'Inverter Y',
        date: '2025-11-18',
        startTime: '09:28',
        endTime: '09:33',
        generatedKW: '1.2 kw',
    },
    {
        projectName: 'Project Gamma',
        inverterName: 'Inverter Z',
        date: '2025-11-17',
        startTime: '09:43',
        endTime: '10:03',
        generatedKW: '2.1 kw',
    },
];



const InvestmentSummaryReports = () => {
    const savingReportsData = staticSavingReportsData;

    // Download CSV handler
    const handleDownloadCSV = () => {
        const header = ['Project Name', 'Inverter Name', 'Date', 'Start Time', 'End Time', 'Generated kW'];
        const rows = savingReportsData.map(row => [row.projectName, row.inverterName, row.date, row.startTime, row.endTime, row.generatedKW]);
        let csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'saving_reports.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="flex flex-wrap gap-2 mb-4">
                <select
                    id="projectFilter"
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto"
                >
                    <option value="">All Projects</option>
                </select>
                <select
                    id="inverterFilter"
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto"
                >
                    <option value="">All Inverter</option>
                </select>
                <button
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto"
                    onClick={handleDownloadCSV}
                >
                    Download CSV
                </button>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-semibold">PROJECT NAME</th>
                            <th className="px-4 py-3 font-semibold">INVERTER NAME</th>
                            <th className="px-2 py-3 font-semibold">DATE</th>
                            <th className="px-2 py-3 font-semibold">START TIME</th>
                            <th className="px-2 py-3 font-semibold">END TIME</th>
                            <th className="px-2 py-3 font-semibold">GENERATED KW</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savingReportsData.map((inv, idx) => (
                            <tr key={inv.number} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 whitespace-nowrap">{inv.projectName}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{inv.inverterName}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.date}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.startTime}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.endTime}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.generatedKW}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3 mt-3">
                {savingReportsData.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-8">No data found</div>
                ) : (
                    savingReportsData.map((inv, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                                    {inv.projectName}
                                </h3>
                                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{inv.date}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Inverter Name:</span>
                                    <span className="font-medium text-gray-900">{inv.inverterName}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Start Time:</span>
                                    <span className="font-medium text-gray-900">{inv.startTime}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">End Time:</span>
                                    <span className="font-medium text-gray-900">{inv.endTime}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Generated KW:</span>
                                    <span className="font-medium text-gray-900">{inv.generatedKW}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InvestmentSummaryReports;
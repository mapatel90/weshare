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



const RoiReports = () => {
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
            <div className="flex flex-col md:flex-row md:items-end md:justify-end mb-4 gap-2">
                <div className="flex items-start gap-2">
                    <select
                        id="projectFilter"
                        className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Projects</option>
                    </select>
                </div>
                <div className="flex items-end gap-2">
                    <select
                        id="inverterFilter"
                        className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Inverter</option>
                    </select>
                </div>
                <div className="flex items-end gap-2">
                    <button className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" onClick={handleDownloadCSV}>
                        Download CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto border">
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
        </div>
    );
};

export default RoiReports;
'use client';

import React from 'react';



const staticSavingReportsData = [
    {
        projectName: 'Project Alpha',
        inverterName: 'Inverter X',
        date: '2025-11-19',
        startTime: '09:00',
        endTime: '17:00',
        generatedKW: '1200',
    },
    {
        projectName: 'Project Beta',
        inverterName: 'Inverter Y',
        date: '2025-11-18',
        startTime: '08:30',
        endTime: '16:30',
        generatedKW: '950',
    },
    {
        projectName: 'Project Gamma',
        inverterName: 'Inverter Z',
        date: '2025-11-17',
        startTime: '10:00',
        endTime: '18:00',
        generatedKW: '1100',
    },
];



const ConjunctionReports = () => {
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
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-end align-items-center mb-4">
                {/* <h2 className="fw-bold text-primary">Saving Reports</h2> */}
                <button className="btn btn-primary" onClick={handleDownloadCSV}>
                    Download CSV
                </button>
            </div>
            <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle bg-white">
                    <thead className="table-light">
                        <tr>
                            <th>Project Name</th>
                            <th>Inverter Name</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Generated kW</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savingReportsData.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.projectName}</td>
                                <td>{row.inverterName}</td>
                                <td>{row.date}</td>
                                <td>{row.startTime}</td>
                                <td>{row.endTime}</td>
                                <td>{row.generatedKW}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConjunctionReports;
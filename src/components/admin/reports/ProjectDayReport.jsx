'use client';

import React, { useEffect, useState } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet, apiPost } from '@/lib/api';

const ProjectDayReport = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState('');

    const fetch_project_list = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiGet(`/api/projects/dropdown/project`);
            console.log("API Response:", res); // Check the structure

            // FIX HERE: Check the actual response structure
            if (res && res.data) {
                // If API returns { data: [...] }
                setProjects(res.data);
            } else if (Array.isArray(res)) {
                // If API directly returns array
                setProjects(res);
            } else {
                console.error("Unexpected response format:", res);
                setProjects([]);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setError(err?.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch_project_list();
    }, []);

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-2 mb-4 mt-4">
                <select
                    id="projectFilter"
                    className="theme-btn-blue-color border rounded-md px-3 me-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                >
                    <option value="">All Projects</option>
                    {projects.map((p, index) => (
                        <option key={p?.id ?? index} value={p?.id}>
                            {p?.project_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                {/* Your table here */}
            </div>
        </div>
    );
};

export default ProjectDayReport;
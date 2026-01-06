'use client';

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';

const formatDataForChart = (apiData, viewMode, selectedDate) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    // ================= DAY VIEW =================
    if (viewMode === "day") {
        const daysInMonth = dayjs(selectedDate + "-01").daysInMonth();

        // Map API data by day number
        const map = {};
        apiData.forEach(item => {
            const day = dayjs(item.label).date();
            map[day] = item;
        });

        // Build FULL 1 → 31 array
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            return {
                day,
                evn: map[day]?.evn > 0 ? map[day].evn : null,
                weshare: map[day]?.weshare > 0 ? map[day].weshare : null,

            };
        });
    }

    if (viewMode === "month") {
        const months = Array.from({ length: 12 }, (_, i) =>
            dayjs().month(i).format("MMM")
        );

        // Map API data by month index (0–11)
        const map = {};
        apiData.forEach(item => {
            const monthIndex = dayjs(item.label + "-01").month(); // 0–11
            map[monthIndex] = item;
        });

        return months.map((monthLabel, index) => ({
            label: monthLabel,
            evn: map[index]?.evn > 0 ? map[index].evn : null,
            weshare: map[index]?.weshare > 0 ? map[index].weshare : null,
        }));
    }

    // ================= YEAR VIEW =================
    if (viewMode === "year") {
        const currentYear = dayjs().year();

        // Build last 5 years (past 4 + current)
        const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

        // Map API data by year
        const map = {};
        apiData.forEach(item => {
            map[item.label] = item;
        });

        return years.map(year => ({
            label: String(year),
            evn: map[year]?.evn > 0 ? map[year].evn : null,
            weshare: map[year]?.weshare > 0 ? map[year].weshare : null,
        }));
    }

};


const ElectricityCostOverviewChart = ({
    data,
    loading = false,
    viewMode = "day",
    onViewModeChange,
    selectedDate,
    onDateChange,
    isDark = false,
    selectedInverterId
}) => {
    const { lang } = useLanguage();

    const chartData = useMemo(() => formatDataForChart(data, viewMode, selectedDate), [data, viewMode, selectedDate]);

    const handleDateChange = (date) => {
        if (!date) return;
        if (viewMode === 'day') {
            const monthYear = dayjs(date).format('YYYY-MM');
            onDateChange?.(monthYear);
        } else if (viewMode === 'month') {
            const year = dayjs(date).format('YYYY');
            onDateChange?.(year + '-01'); // Store as YYYY-MM for consistency
        }
    };

    const getSelectedDateForPicker = () => {
        if (!selectedDate) return new Date();
        if (viewMode === 'day') {
            return dayjs(selectedDate, 'YYYY-MM').toDate();
        } else if (viewMode === 'month') {
            return dayjs(selectedDate.slice(0, 4), 'YYYY').toDate();
        }
        return new Date();
    };

    const xAxisDataKey = 'label';
    const xAxisLabel = viewMode === 'day' ? 'Day' : viewMode === 'month' ? 'Month' : 'Year';

    // Generate ticks for day view to show all days properly
    const dayTicks = useMemo(() => {
        if (viewMode === 'day' && chartData.length > 0) {
            const maxDay = Math.max(...chartData.map(d => d.day));
            return Array.from({ length: maxDay }, (_, i) => i + 1);
        }
        return undefined;
    }, [viewMode, chartData]);

    return (
        // <div
        //     style={{
        //         width: '100%',
        //         height: '80vh',
        //         padding: 24,
        //         borderRadius: 12,
        //         background: isDark ? '#0f172a' : '#ffffff',
        //     }}
        // >
        <>
            <style jsx>{`
                .date-picker-wrapper {
                    margin-bottom: 16px;
                    width: 200px;
                }
                .date-picker-wrapper :global(.react-datepicker-wrapper) {
                    width: 100%;
                }
                .date-picker-wrapper :global(.react-datepicker__input-container input) {
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
                    background: ${isDark ? '#121a2d' : '#fff'};
                    color: ${isDark ? '#ffffff' : '#111827'};
                    font-size: 14px;
                }
                .date-picker-wrapper :global(.react-datepicker__input-container input:focus) {
                    outline: none;
                    border-color: #3b82f6;
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 45 }}>
                {!selectedInverterId && (
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",        // ✅ mobile safe
                        }}
                    >
                        {["day", "month", "year"].map((mode) => {
                            const isActive = viewMode === mode;

                            return (
                                <button
                                    key={mode}
                                    onClick={() => onViewModeChange?.(mode)}
                                    style={{
                                        padding: "6px 14px",
                                        fontSize: "14px",
                                        borderRadius: "6px",
                                        border: isActive
                                            ? "1px solid #f97316"
                                            : `1px solid ${isDark ? "#1b2436" : "#d1d5db"}`,
                                        backgroundColor: isActive
                                            ? "#f97316"
                                            : isDark
                                                ? "#121a2d"
                                                : "#ffffff",
                                        color: isActive
                                            ? "#ffffff"
                                            : isDark
                                                ? "#ffffff"
                                                : "#374151",
                                        cursor: "pointer",
                                        fontWeight: isActive ? 600 : 400,
                                        transition: "all 0.2s ease",
                                        minWidth: "72px",   // ✅ equal width
                                        textAlign: "center",
                                    }}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Date Picker - only show for day and month modes */}
                {(viewMode === 'day' || viewMode === 'month') && (
                    <div className="date-picker-wrapper">
                        {/* <DatePicker
                            selected={getSelectedDateForPicker()}
                            onChange={handleDateChange}
                            showMonthYearPicker={viewMode === 'day'}
                            showYearPicker={viewMode === 'month'}
                            dateFormat={viewMode === 'day' ? 'MM / yyyy' : 'yyyy'}
                            placeholderText={
                                viewMode === 'day' ? 'Select month' : 'Select year'
                            }
                        /> */}
                    </div>
                )}
            </div>

            {loading ? (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300,
                        color: isDark ? '#cbd5f5' : '#374151',
                    }}
                >
                    Loading...
                </div>
            ) : chartData.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300,
                        color: isDark ? '#cbd5f5' : '#374151',
                    }}
                >
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={400} minWidth={630} style={{ marginTop: 30 }}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDark ? '#1b2436' : '#e5e7eb'} />

                        <XAxis
                            dataKey={viewMode === "day" ? "day" : "label"}
                            type={viewMode === "day" ? "number" : "category"}
                            domain={viewMode === "day" ? [1, 'dataMax'] : undefined}
                            ticks={viewMode === "day" ? dayTicks : undefined}
                            allowDecimals={false}
                            interval={viewMode === "day" ? 0 : 0}
                            tick={{ fill: isDark ? '#cbd5f5' : '#374151', fontSize: 12 }}
                            tickFormatter={(v) => viewMode === "day" ? String(Math.round(v)) : v}
                            label={{
                                value: xAxisLabel,
                                position: 'insideBottom',
                                offset: -1,
                                style: { fill: isDark ? '#cbd5f5' : '#374151' },
                            }}
                        />

                        <YAxis
                            tickFormatter={(v) => `${(v).toFixed(1)}M`}
                            tick={{ fill: isDark ? '#cbd5f5' : '#374151' }}
                            label={{
                                value: 'Cost (VND)',
                                angle: -90,
                                dx: -30,
                                position: 'insideLeft',
                                style: { fill: isDark ? '#cbd5f5' : '#374151' },
                            }}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#121a2d' : '#ffffff',
                                border: `1px solid ${isDark ? '#1b2436' : '#d1d5db'}`,
                                borderRadius: '8px',
                                color: isDark ? '#ffffff' : '#111827',
                            }}
                            formatter={(value) => `${value.toLocaleString()} VND`}
                        />

                        <Legend />

                        {/* EVN Line */}
                        <Line
                            type="monotone"
                            dataKey="evn"
                            name="EVN Cost"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#2563eb' }}
                            // activeDot={{ r: 6 }}
                            connectNulls={false}
                        />

                        {/* WeShare Line */}
                        <Line
                            type="monotone"
                            dataKey="weshare"
                            name="WeShare Cost"
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#f97316' }}
                            // activeDot={{ r: 6 }}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </>
        // </div>
    );
};

export default ElectricityCostOverviewChart;

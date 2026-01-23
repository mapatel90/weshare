'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import 'react-datepicker/dist/react-datepicker.css';
import { formatShort } from '@/utils/common';

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
                saving: map[day]?.saving > 0 ? map[day].saving : null,

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
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

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
                    margin-bottom: ${isMobile ? '8px' : '0px'};
                    width: ${isMobile ? '100%' : '200px'};
                }
                .date-picker-wrapper :global(.react-datepicker-wrapper) {
                    width: 100%;
                }
                .date-picker-wrapper :global(.react-datepicker__input-container input) {
                    width: 100%;
                    padding: ${isMobile ? '10px 12px' : '8px 12px'};
                    border-radius: 8px;
                    border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
                    background: ${isDark ? '#121a2d' : '#fff'};
                    color: ${isDark ? '#ffffff' : '#111827'};
                    font-size: ${isMobile ? '13px' : '14px'};
                }
                .date-picker-wrapper :global(.react-datepicker__input-container input:focus) {
                    outline: none;
                    border-color: #3b82f6;
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                {/* {!selectedInverterId && (
                    <div
                        style={{
                            display: "flex",
                            gap: isMobile ? "6px" : "8px",
                            flexWrap: isMobile ? "wrap" : "nowrap",
                            justifyContent: isMobile ? "center" : "flex-start"
                        }}
                    >
                        {["day", "month", "year"].map((mode) => {
                            const isActive = viewMode === mode;

                            return (
                                <button
                                    key={mode}
                                    onClick={() => onViewModeChange?.(mode)}
                                    style={{
                                        padding: isMobile ? "8px 12px" : "6px 14px",
                                        fontSize: isMobile ? "13px" : "14px",
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
                                        minWidth: isMobile ? "65px" : "72px",
                                        textAlign: "center",
                                        flex: isMobile ? "1" : "0 0 auto"
                                    }}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            );
                        })}
                    </div>
                )} */}

                {/* Date Picker - only show for day and month modes */}
                {(viewMode === 'day' || viewMode === 'month') && (
                    <div className="date-picker-wrapper" style={{ width: isMobile ? '100%' : '200px' }}>
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
                    {viewMode === "day" ? (
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDark ? '#1b2436' : '#e5e7eb'} />

                            <XAxis
                                dataKey="day"
                                type="number"
                                domain={[0.5, 'dataMax']}
                                ticks={dayTicks}
                                allowDecimals={false}
                                interval={0}
                                padding={{ left: 10, right: 10 }}
                                tick={{ fill: isDark ? '#cbd5f5' : '#374151', fontSize: 12 }}
                                tickFormatter={(v) => String(Math.round(v))}
                                label={{
                                    value: 'Day',
                                    position: 'insideBottom',
                                    offset: -1,
                                    style: { fill: isDark ? '#cbd5f5' : '#374151' },
                                }}
                            />

                            <YAxis
                                tickFormatter={(v) => `${formatShort(v)}`}
                                tick={{ fill: isDark ? '#cbd5f5' : '#374151' }}
                                label={{
                                    value: lang('projects.costVND', 'Cost (VND)'),
                                    angle: -90,
                                    dx: -30,
                                    position: 'insideLeft',
                                    style: { fill: isDark ? '#cbd5f5' : '#374151' },
                                }}
                            />

                            <Tooltip
                                labelFormatter={(label) =>
                                    dayjs(`${selectedDate}-${label}`).format("DD MMM YYYY")
                                }
                                formatter={(value) => `${formatShort(value).toLocaleString()}`}
                                contentStyle={{
                                    backgroundColor: isDark ? '#121a2d' : '#ffffff',
                                    border: `1px solid ${isDark ? '#1b2436' : '#d1d5db'}`,
                                    borderRadius: '8px',
                                    color: isDark ? '#ffffff' : '#111827',
                                }}
                            />

                            <Legend />

                            <Bar
                                dataKey="evn"
                                name= {lang('reports.evnCost', 'EVN Cost')}
                                fill="#2563eb"
                                barSize={12}
                            />
                            <Bar
                                dataKey="weshare"
                                name= {lang('reports.weshareCost', 'WeShare Cost')}
                                fill="#f97316"
                                barSize={12}
                            />
                            <Bar
                                dataKey="saving"
                                name={lang('reports.savingCost', 'Saving Cost')}
                                fill="#fbbf24"
                                barSize={12}
                            />
                        </BarChart>
                    ) : (
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDark ? '#1b2436' : '#e5e7eb'} />

                            <XAxis
                                dataKey="label"
                                type="category"
                                allowDecimals={false}
                                interval={0}
                                tick={{ fill: isDark ? '#cbd5f5' : '#374151', fontSize: 12 }}
                                label={{
                                    value: xAxisLabel,
                                    position: 'insideBottom',
                                    offset: -1,
                                    style: { fill: isDark ? '#cbd5f5' : '#374151' },
                                }}
                            />

                            <YAxis
                                tickFormatter={(v) => `${formatShort(v)}`}
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
                                labelFormatter={(label) => label}
                                formatter={(value) => `${formatShort(value).toLocaleString()}`}
                                contentStyle={{
                                    backgroundColor: isDark ? '#121a2d' : '#ffffff',
                                    border: `1px solid ${isDark ? '#1b2436' : '#d1d5db'}`,
                                    borderRadius: '8px',
                                    color: isDark ? '#ffffff' : '#111827',
                                }}
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="evn"
                                name="EVN Cost"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#2563eb' }}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="weshare"
                                name="WeShare Cost"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#f97316' }}
                                connectNulls={false}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            )}
        </>
        // </div>
    );
};

export default ElectricityCostOverviewChart;

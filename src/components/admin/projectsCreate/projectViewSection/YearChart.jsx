'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useMemo, useState, useEffect } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import { formatShort } from '@/utils/common';


const buildYearChartData = (yearData, selectedEnergyYear) => {
    const months = Array.from({ length: 12 }, (_, i) =>
        String(i + 1).padStart(2, "0")
    );

    const monthMap = {};

    months.forEach(m => {
        monthMap[m] = {
            month: m,
            yield: 0,
            consumed: 0,
            exporting: 0,
            importing: 0,
            earning: 0,
            fullLoadHours: 0,
            days: 0,
        };
    });

    (yearData || []).forEach(item => {
        const month = dayjs(item.date).format("MM");
        if (!monthMap[month]) return;

        monthMap[month].yield += item.energy || 0;
        monthMap[month].consumed += item.consume_energy || 0;
        monthMap[month].exporting += item.home_grid_energy || 0;
        monthMap[month].importing += item.grid_purchased_energy || 0;
        monthMap[month].earning += (item.money || 0) / 1000; // K VND
        monthMap[month].fullLoadHours += item.full_hour || 0;
        monthMap[month].days += 1;
    });

    return months.map(m => ({
        month: m,
        yield: monthMap[m].yield,
        consumed: monthMap[m].consumed,
        exporting: monthMap[m].exporting,
        importing: monthMap[m].importing,
        earning: monthMap[m].earning > 0 ? monthMap[m].earning.toFixed(2) : null,
        fullLoadHours: monthMap[m].fullLoadHours > 0 ? monthMap[m].fullLoadHours.toFixed(2) : null,
    }));

};

const getMax = (data, keys) =>
    Math.max(
        0,
        ...data.flatMap(d => keys.map(k => (d[k] != null ? d[k] : 0)))
    );

const generateTicks = (max, step) =>
    Array.from(
        { length: Math.ceil(max / step) + 1 },
        (_, i) => i * step
    );
const generateHoursTicks = (max, step) =>
    Array.from(
        { length: Math.ceil(max / step) + 2 },
        (_, i) => i * step
    );


const EnergyYearChart = ({ ChartYearData, selectedEnergyYear, onYearChange, isDark }) => {
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

    const selectedYearDate = useMemo(
        () => dayjs(selectedEnergyYear, 'YYYY').toDate(),
        [selectedEnergyYear]
    );


    const handleYearChange = (date) => {
        if (!date) return;
        const year = dayjs(date).format('YYYY');
        onYearChange?.(year);
    };

    const data = useMemo(
        () => buildYearChartData(ChartYearData, selectedYearDate),
        [ChartYearData, selectedYearDate]
    );

    const maxKwh = getMax(data, ['yield', 'consumed', 'exporting', 'importing']);
    const maxMoney = getMax(data, ['earning']);
    const maxHours = getMax(data, ['fullLoadHours']);

    // Add padding to prevent cutting off dots/lines at the top
    const paddedMaxMoney = maxMoney > 0 ? maxMoney * 1.1 : 0;
    const paddedMaxKwh = maxKwh > 0 ? maxKwh * 1.1 : 0;
    const paddedMaxHours = maxHours > 0 ? maxHours * 1.04 : 0;
    return (
        <>
            <style jsx>{`
                .container {
                background: ${isDark ? "#121a2d" : "#fff"};
                padding: ${isMobile ? '0px' : isTablet ? '20px' : '24px'};
                }
                .picker-wrapper {
                margin-bottom: ${isMobile ? '0px' : '16px'};
                width: ${isMobile ? '100%' : isTablet ? '30%' : '520px'};
                }
                .picker-wrapper :global(.react-datepicker-wrapper) {
                width: ${isMobile ? '100%' : '20%'};
                }
                .picker-wrapper :global(.react-datepicker__input-container input) {
                width: 100%;
                padding: ${isMobile ? '10px 12px' : '8px 12px'};
                border-radius: 8px;
                border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
                background: ${isDark ? '#121a2d' : '#fff'};
                color: ${isDark ? '#ffffff' : '#111827'};
                font-size: ${isMobile ? '13px' : '14px'};
                }
      `}</style>

            <div className="container" style={{
                overflowX: isMobile || isTablet ? 'auto' : 'visible'
            }}>
                <div className="picker-wrapper">
                    <DatePicker
                        selected={selectedYearDate}
                        onChange={handleYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                    />
                </div>

                <ResponsiveContainer
                    width="100%"
                    height={isMobile ? 350 : isTablet ? 380 : 400}
                    minWidth={isMobile ? 320 : isTablet ? 700 : 0}
                >
                    <ComposedChart
                        data={data}
                        margin={{
                            top: isMobile ? 30 : 40,
                            right: isMobile ? 20 : isTablet ? 40 : 60,
                            left: isMobile ? 20 : isTablet ? 50 : 80,
                            bottom: isMobile ? 5 : 10
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1b2436' : '#e0e0e0'} opacity={0.3} />

                        {/* kWh */}
                        <YAxis
                            yAxisId="kwh"
                            orientation="left"
                            width={isMobile ? 40 : isTablet ? 50 : 60}
                            label={!isMobile ? {
                                value: "kWh",
                                position: "top",
                                dy: -10,
                                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
                            } : undefined}
                            domain={[0, paddedMaxKwh]}
                            ticks={generateTicks(maxKwh, 50)}
                            stroke={isDark ? '#cbd5f5' : '#666'}
                            tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
                        />

                        {/* Money */}
                        <YAxis
                            yAxisId="money"
                            orientation="left"
                            offset={isMobile ? 40 : isTablet ? 50 : 60}
                            width={isMobile ? 40 : isTablet ? 50 : 60}
                            label={!isMobile ? {
                                value: "M VND",
                                position: "top",
                                dy: -10,
                                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
                            } : undefined}
                            domain={[0, paddedMaxMoney]}
                            ticks={generateTicks(maxMoney, 50)}
                            stroke={isDark ? '#cbd5f5' : '#666'}
                            tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
                        />

                        {/* Hours */}
                        <YAxis
                            yAxisId="hours"
                            orientation="right"
                            width={isMobile ? 40 : isTablet ? 50 : 60}
                            label={!isMobile ? {
                                value: "h",
                                position: "top",
                                dy: -10,
                                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
                            } : undefined}
                            domain={[0, paddedMaxHours]}
                            ticks={generateHoursTicks(maxHours, 0.5)}
                            stroke={isDark ? '#cbd5f5' : '#666'}
                            tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
                        />

                        <XAxis
                            dataKey="month"
                            stroke={isDark ? '#cbd5f5' : '#666'}
                            tick={{ fontSize: isMobile ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
                        />

                        <Tooltip
                            labelFormatter={(day) =>
                                dayjs(selectedYearDate)
                                    .date(Number(day))
                                    .format("YYYY-MM-DD")
                            }
                            formatter={(value, name) => {
                                if (name === "Revenue") {
                                    return [`${formatShort(value)} VND`, name];
                                }
                                if (name === "Hours") {
                                    return [`${value} h`, name];
                                }
                                return [`${formatShort(value)} kWh`, name];
                            }}
                            contentStyle={{
                                backgroundColor: isDark ? '#121a2d' : 'rgba(255, 255, 255, 0.95)',
                                border: `1px solid ${isDark ? '#1b2436' : '#ccc'}`,
                                borderRadius: '8px',
                                padding: isMobile ? '8px' : '10px',
                                fontSize: isMobile ? '11px' : '12px',
                                color: isDark ? '#ffffff' : '#111827'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={isMobile ? 28 : 36}
                            wrapperStyle={{
                                fontSize: isMobile ? '10px' : '12px',
                                paddingTop: isMobile ? '8px' : '12px'
                            }}
                            iconSize={isMobile ? 10 : 14}
                        />

                        {/* Bars */}
                        <Bar
                            yAxisId="kwh"
                            dataKey="yield"
                            fill="#f0cf00"
                            barSize={isMobile ? 12 : isTablet ? 18 : 24}
                        />
                        <Bar
                            yAxisId="kwh"
                            dataKey="exporting"
                            fill="#5f91cb"
                            barSize={isMobile ? 12 : isTablet ? 18 : 24}
                        />
                        <Bar
                            yAxisId="kwh"
                            dataKey="importing"
                            fill="#E84855"
                            barSize={isMobile ? 12 : isTablet ? 18 : 24}
                        />
                        <Bar
                            yAxisId="kwh"
                            dataKey="consumed"
                            fill="#fda23a"
                            barSize={isMobile ? 12 : isTablet ? 18 : 24}
                        />

                        <Line
                            yAxisId="hours"
                            dataKey="fullLoadHours"
                            stroke="#4a7fbc"
                            name="Hours"
                            yAxisOffset={10}
                            strokeWidth={isMobile ? 1.5 : 2}
                            dot={isMobile ? false : { r: 5, fill: "#2563eb" }}
                            activeDot={isMobile ? false : { r: 6 }}
                        />

                        <Line
                            yAxisId="money"
                            dataKey="earning"
                            stroke="#f08519"
                            name="Revenue"
                            yAxisOffset={10}
                            strokeWidth={isMobile ? 1.5 : 2}
                            dot={isMobile ? false : { r: 5, fill: "#f08519" }}
                            activeDot={isMobile ? false : { r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default EnergyYearChart;

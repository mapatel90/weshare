'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useMemo, useState } from 'react';
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


const buildYearChartData = (yearData, selectedYear) => {
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
        { length: Math.ceil(max / step) + 1 },
        (_, i) => i * step
    );


const EnergyYearChart = ({ ChartYearData, selectedYear, isDark }) => {
    const { lang } = useLanguage();

    const selectedYearDate = useMemo(
        () => dayjs(selectedYear, 'YYYY').toDate(),
        [selectedYear]
    );

    const handleYearChange = (date) => {
        if (!date) return;
        const year = dayjs(date).format('YYYY');
        onYearChange(year);
    };

    const data = useMemo(
        () => buildYearChartData(ChartYearData, selectedYear),
        [ChartYearData, selectedYear]
    );

    const maxKwh = getMax(data, ['yield', 'consumed', 'exporting', 'importing']);
    const maxMoney = getMax(data, ['earning']);
    const maxHours = getMax(data, ['fullLoadHours']);

    // Add padding to prevent cutting off dots/lines at the top
    const paddedMaxMoney = maxMoney > 0 ? maxMoney * 1.1 : 0;
    const paddedMaxKwh = maxKwh > 0 ? maxKwh * 1.1 : 0;
    const paddedMaxHours = maxHours > 0 ? maxHours * 1.1 : 0;
    return (
        <>
            <style jsx>{`
        .container {
          width: 100%;
          height: 100%;
          padding: 24px;
          background: ${isDark ? "#121a2d" : "#fff"};
        }
        .picker-wrapper {
          margin-bottom: 16px;
          width: 520px;
        }
        .picker-wrapper :global(.react-datepicker-wrapper) {
          width: 20%;
        }
        .picker-wrapper :global(.react-datepicker__input-container input) {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
          background: ${isDark ? '#121a2d' : '#fff'};
          color: ${isDark ? '#ffffff' : '#111827'};
          font-size: 14px;
        }
      `}</style>

            <div className="container">
                <div className="picker-wrapper">
                    <DatePicker
                        selected={selectedYearDate}
                        onChange={handleYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                    />
                </div>

                <ResponsiveContainer width="100%" height={420}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 40, right: 60, left: 140, bottom: 40 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        {/* kWh */}
                        <YAxis
                            yAxisId="kwh"
                            orientation="left"
                            label={{ value: "kWh", position: "top", dy: -10 }}
                            domain={[0, paddedMaxKwh]}
                            ticks={generateTicks(maxKwh, 200)}
                        />

                        {/* Money */}
                        <YAxis
                            yAxisId="money"
                            orientation="left"
                            offset={60}
                            label={{ value: "M VND", position: "top", dy: -10 }}
                            domain={[0, paddedMaxMoney]}
                            ticks={generateTicks(maxMoney, 200)}
                        />

                        {/* Hours */}
                        <YAxis
                            yAxisId="hours"
                            orientation="right"
                            label={{ value: "h", position: "top", dy: -10 }}
                            domain={[0, paddedMaxHours]}
                            ticks={generateHoursTicks(maxHours, 0.5)}
                            
                        />

                        <XAxis dataKey="month" />

                        <Tooltip />
                        <Legend verticalAlign="bottom" />

                        {/* Bars */}
                        <Bar yAxisId="kwh" dataKey="yield" fill="#FDB515" />
                        <Bar yAxisId="kwh" dataKey="exporting" fill="#4A90E2" />
                        <Bar yAxisId="kwh" dataKey="importing" fill="#E84855" />
                        <Bar yAxisId="kwh" dataKey="consumed" fill="#FF8C42" />

                        <Line
                            yAxisId="hours"
                            dataKey="fullLoadHours"
                            stroke="#2563eb"
                            name="Hours"
                            strokeWidth={2}
                            dot={{ r: 5, fill: "#2563eb" }}
                            activeDot={{ r: 6 }}
                        />

                        <Line
                            yAxisId="money"
                            dataKey="earning"
                            stroke="#f97316"
                            name="Earning"
                            yAxisOffset={10}
                            strokeWidth={2}
                            dot={{ r: 5, fill: "#f97316" }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default EnergyYearChart;

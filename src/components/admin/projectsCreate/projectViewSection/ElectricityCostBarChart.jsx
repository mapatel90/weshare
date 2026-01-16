'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import { formatShort } from '@/utils/common';

const ElectricityCostBarChart = ({
    electricityMonthCostData,
    electricityMonthCostDataLoading,
    selectedYear,
    onYearChange,
    isDark,
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

    const handleYearChange = (date) => {
        if (!date) return;
        const year = dayjs(date).format('YYYY');
        onYearChange?.(year);
    };

    const data = electricityMonthCostData ?? [];

    const { roundedMax, ticks } = useMemo(() => {
        const maxValue = Math.max(
            ...data.map((d) => Math.max(d.evn || 0, d.weshare || 0)),
            0
        );

        // choose step size
        const step =
            maxValue <= 20000 ? 500 :
                maxValue <= 100000 ? 10000 :
                    50000;

        const roundedMax = Math.ceil(maxValue / step) * step;

        const ticks = Array.from(
            { length: roundedMax / step + 1 },
            (_, i) => i * step
        );

        return { roundedMax, ticks };
    }, [data]);

    return (
        <>
            <style jsx>{`
        .container {
          width: 100%;
          height: 100%;
          padding: ${isMobile ? '16px' : '24px'};
          background: ${isDark ? "#121a2d" : "#fff"};
        }
        .picker-wrapper {
          margin-bottom: ${isMobile ? '12px' : '16px'};
          width: ${isMobile ? '100%' : isTablet ? '200px' : '432px'};
        }
        .picker-wrapper :global(.react-datepicker-wrapper) {
          margin-left: ${isMobile ? '0' : '8%'};
          width: ${isMobile ? '100%' : '30%'};
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
            <div style={{
                width: '100%',
                height: isMobile ? 400 : isTablet ? 450 : 400,
                overflowX: isMobile || isTablet ? 'auto' : 'visible'
            }}>
                <div className="picker-wrapper">
                    <DatePicker
                        selected={selectedYear ? dayjs(selectedYear, 'YYYY').toDate() : null}
                        onChange={handleYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                    />
                </div>

                <ResponsiveContainer
                    width={isMobile ? '100%' : '94%'}
                    height={isMobile ? '85%' : '86%'}
                    minWidth={isMobile ? 280 : isTablet ? 350 : 0}
                >
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
                    >
                        {/* Month labels on X-axis */}
                        <XAxis
                            type="category"
                            dataKey="month"
                            tick={{ fontSize: 14 }}
                        />

                        {/* Cost scale on Y-axis */}
                        <YAxis
                            type="number"
                            domain={[0, roundedMax]}
                            ticks={ticks}
                            label={{
                                value: 'Cost (VND)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                dx: -30,
                                style: { fill: isDark ? '#cbd5f5' : '#374151' },
                            }}
                            allowDecimals={false}
                            tick={{ fill: isDark ? '#e5e7eb' : '#111827' }}
                            tickFormatter={(v) => `${formatShort(v).toLocaleString()}`}
                        />

                        <Tooltip
                            formatter={(value) => `${formatShort(value).toLocaleString()} VND`}
                            contentStyle={{
                                backgroundColor: isDark ? '#121a2d' : '#ffffff',
                                border: `1px solid ${isDark ? '#1b2436' : '#d1d5db'}`,
                                borderRadius: '8px',
                                color: isDark ? '#ffffff' : '#111827',
                                fontSize: isMobile ? '11px' : '12px',
                            }}
                        />

                        <Legend
                            wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
                            iconSize={isMobile ? 10 : 14}
                        />

                        {/* EVN bar */}
                        <Bar
                            dataKey="evn"
                            name="EVN"
                            fill={isDark ? '#2563eb' : '#2563eb'}
                            barSize={isMobile ? 8 : isTablet ? 10 : 12}
                        />

                        {/* WeShare bar */}
                        <Bar
                            dataKey="weshare"
                            name="WeShare"
                            fill={isDark ? '#f97316' : '#f97316'}
                            barSize={isMobile ? 8 : isTablet ? 10 : 12}
                        />

                        {/* Saving bar */}
                        <Bar
                            dataKey="saving"
                            name="Saving"
                            fill={isDark ? '#fbbf24' : '#fbbf24'}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default ElectricityCostBarChart;

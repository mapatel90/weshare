'use client';

import React, { useMemo } from 'react';
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

const SavingCostBarChart = ({
    electricityMonthCostData,
    electricityMonthCostDataLoading,
    selectedYear,
    onYearChange,
    isDark,
}) => {
    const { lang } = useLanguage();

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
          padding: 24px;
          background: ${isDark ? "#121a2d" : "#fff"};
        }
        .picker-wrapper {
          margin-bottom: 16px;
          width: 432px;
        }
        .picker-wrapper :global(.react-datepicker-wrapper) {
          margin-left:8%;
          width: 30%;
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
            <div style={{ width: '100%', height: 500 }}>
                <div className="picker-wrapper">
                    <DatePicker
                        selected={selectedYear ? dayjs(selectedYear, 'YYYY').toDate() : null}
                        onChange={handleYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                    />
                </div>

                <ResponsiveContainer width="94%" height="86%" minWidth={400}>
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
                                value: 'Cost',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                style: { fill: isDark ? '#cbd5f5' : '#374151' },
                            }}
                            allowDecimals={false}
                            tick={{ fill: isDark ? '#e5e7eb' : '#111827' }}
                            tickFormatter={(v) => `${formatShort(v).toLocaleString()} VND`}
                        />

                        <Tooltip
                            formatter={(value) => `${formatShort(value).toLocaleString()} VND`}

                        />

                        <Legend />

                        {/* EVN bar */}
                        <Bar
                            dataKey="evn"
                            name="EVN"
                            fill={isDark ? '#2563eb' : '#2563eb'}
                            barSize={12}
                        />

                        {/* WeShare bar */}
                        <Bar
                            dataKey="weshare"
                            name="WeShare"
                            fill={isDark ? '#f97316' : '#f97316'}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default SavingCostBarChart;

'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import DatePicker from 'react-datepicker';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from "dayjs";

const buildChartData = (chartMonthData) => {
  const monthYear = '2026-01';
  const daysInMonth = dayjs(monthYear).daysInMonth();

  // Create empty map for quick lookup
  const dataMap = {};
  chartMonthData.forEach(item => {
    const day = dayjs(item.date).format("DD");
    dataMap[day] = item;
  });

  // Generate all days of month
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const row = dataMap[day];
    const money = row?.money ? row.money / 1000 : 0; // Convert to K VND

    return {
      day,
      yield: row?.energy ?? 0,
      exporting: row?.home_grid_energy ?? 0,
      importing: row?.grid_purchased_energy ?? 0,
      consumed: row?.consume_energy ?? 0,
      fullLoadHours: row?.full_hour ?? 0,
      earning: money ?? 0
    };
  });
};



const EnergyChart = ({ chartMonthData }) => {
  const { lang } = useLanguage();
  const data = buildChartData(chartMonthData || []);
  return (
    <>
      <style jsx>{`
        .container {
          width: 100%;
          height: 100vh;
          background-color: #ffffff;
          padding: 32px;
          box-sizing: border-box;
        }
        .chart-wrapper {
          width: 100%;
          height: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 24px;
          box-sizing: border-box;
        }
      `}</style>

      <div className="container">
        <div className='mb-2'>
          <DatePicker dateFormat="MMMM yyyy" showMonthYearPicker views={['month', 'year']} />
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

              {/* Left Y-axis for K VND */}
              {/* <YAxis
                yAxisId="left"
                orientation="left"
                label={{ value: 'K VND', angle: 0, position: 'top', offset: 10, dx: -30 }}
                domain={[0, 425]}
                ticks={[0, 85, 170, 255, 340, 425]}
                stroke="#666"
              /> */}

              {/* Middle Y-axis for kWh */}
              <YAxis
                yAxisId="middle"
                orientation="left"
                width={50}
                label={{
                  value: 'kWh',
                  position: 'top',
                  dx: 20,
                }}
                domain={[0, 940]}
                ticks={[0, 188, 376, 564, 752, 940]}
                stroke="#666"
              />

              <YAxis
                yAxisId="left"
                orientation="left"
                width={70}
                label={{
                  value: 'K VND',
                  position: 'top',
                  dx: -30,
                }}
                domain={[0, 425]}
                ticks={[0, 85, 170, 255, 340, 425]}
                stroke="#666"
              />

              {/* Right Y-axis for h */}
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'h', angle: 0, position: 'top', offset: 10, dx: -30 }}
                domain={[0, 4]}
                ticks={[0, 0.8, 1.6, 2.4, 3.2, 4]}
                stroke="#666"
              />

              <XAxis
                dataKey="day"
                stroke="#666"
                interval={0}
                tick={{ fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="rect"
                wrapperStyle={{ paddingTop: '20px' }}
              />

              {/* Bars */}
              <Bar
                yAxisId="middle"
                dataKey="yield"
                name="Yield"
                fill="#FDB515"
                barSize={12}
              />
              <Bar
                yAxisId="middle"
                dataKey="exporting"
                name="Exporting"
                fill="#4A90E2"
                barSize={12}
              />
              <Bar
                yAxisId="middle"
                dataKey="importing"
                name="Importing"
                fill="#E84855"
                barSize={12}
              />
              <Bar
                yAxisId="middle"
                dataKey="consumed"
                name="Consumed"
                fill="#FF8C42"
                barSize={12}
              />

              {/* Lines */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="fullLoadHours"
                name="Full Load Hours"
                stroke="#4A90E2"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="earning"
                name="Earning"
                stroke="#FF8C42"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default EnergyChart;
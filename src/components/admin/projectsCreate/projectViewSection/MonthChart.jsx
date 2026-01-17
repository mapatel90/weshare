'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from "dayjs";
import 'react-datepicker/dist/react-datepicker.css';
import { formatShort } from '@/utils/common';

const buildChartData = (chartMonthData = [], selectedDate) => {
  const month_data = Array.isArray(chartMonthData) ? chartMonthData : [];
  const monthYear = selectedDate ? dayjs(selectedDate).format('YYYY-MM') : dayjs().format('YYYY-MM');
  const daysInMonth = dayjs(monthYear).daysInMonth();

  // Create empty map for quick lookup
  const dataMap = {};
  month_data.forEach(item => {
    const day = dayjs(item.date).format("DD");
    dataMap[day] = item;
  });

  // Generate all days of month
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const row = dataMap[day];
    const money = row?.money ? row.money / 1000 : null; // Convert to K VND

    return {
      day,
      yield: row?.energy ?? 0,
      exporting: row?.home_grid_energy ?? 0,
      importing: row?.grid_purchased_energy ?? 0,
      consumed: row?.consume_energy ?? 0,
      fullLoadHours: row?.full_hour ?? null,
      earning: money ?? null
    };
  });
};

const containerStyle = {
  width: '100%',
  minWidth: '600px',
  height: '60vh',
  backgroundColor: '#ffffff',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
};


const getStyles = (isDark = false) => {
  const colors = {
    bg: isDark ? '#121a2d' : '#ffffff',
    text: isDark ? '#ffffff' : '#111827',
    textMuted: isDark ? '#b1b4c0' : '#6b7280',
    border: isDark ? '#1b2436' : '#e5e7eb',
    boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.08)',
  }

  return {
    containerStyle: {
      backgroundColor: colors.bg,
      padding: '32px',
      boxSizing: 'border-box',
    },
    datePickerWrapperStyle: {
      marginBottom: '8px',
    },
    datePickerInputStyle: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: isDark ? colors.bg : '#fff',
      color: colors.text,
      fontSize: '14px',
      outline: 'none',
    },
    datePickerWrapperWidth: {
      width: '10%',
    },
    headerRowStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px',
    },
    stateMessageStyle: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textMuted,
      fontSize: '14px',
    },
    tooltipWrapStyle: {
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '10px 12px',
      boxShadow: colors.boxShadow,
    },
    tooltipTitleStyle: {
      fontSize: 13,
      fontWeight: 600,
      color: colors.textMuted,
      marginBottom: 8,
    },
  }
}


// const getMaxKwh = (data = []) =>
//   Math.max(
//     ...data.map(d =>
//       Math.max(d.yield, d.exporting, d.importing, d.consumed)
//     ),
//     0
//   );

const getMaxKwh = (data = []) => {
  const rawMax = Math.max(
    ...data.flatMap(d => [
      d.yield || 0,
      d.exporting || 0,
      d.importing || 0,
      d.consumed || 0
    ]),
    0
  );

  let step = 10; // ✅ number, not string

  if (rawMax > 100 && rawMax <= 500) step = 50;
  else if (rawMax > 500) step = 100;

  console.log("rawMax", rawMax, "step", step);

  return Math.ceil(rawMax / step) * step;
};

const getMaxMoney = (data = []) =>
  Math.max(...data.map(d => d.earning), 0);

const getMaxHours = (data = []) =>
  Math.max(...data.map(d => d.fullLoadHours), 0);

const generateTicks = (max, step) => {
  const ticks = [];
  for (let i = 0; i <= max; i += step) {
    ticks.push(i);
  }
  return ticks;
};


const EnergyChart = ({ chartMonthData, selectedMonthYear, onMonthYearChange, isDark = false, monthlyChartDataLoading }) => {
  const { lang } = useLanguage();
  const styles = getStyles(isDark);
  const [isTablet, setIsTablet] = useState();
  const [selectedDate, setSelectedDate] = useState(
    selectedMonthYear ? dayjs(selectedMonthYear, 'YYYY-MM').toDate() : new Date()
  );
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
      const onResize = () => {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        setIsTablet(width >= 768 && width < 1024);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

  useEffect(() => {
    if (selectedMonthYear) {
      setSelectedDate(dayjs(selectedMonthYear, 'YYYY-MM').toDate());
    }
  }, [selectedMonthYear]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date && onMonthYearChange) {
      const monthYear = dayjs(date).format('YYYY-MM');
      onMonthYearChange(monthYear);
    }
  };

  // const data = buildChartData(chartMonthData || [], selectedDate);

  const data = useMemo(
    () => buildChartData(chartMonthData, selectedDate),
    [chartMonthData, selectedDate]
  );

  // const maxKwh = Math.ceil(getMaxKwh(data) / 100) * 100 || 10;
  const maxKwh = getMaxKwh(data);
  const maxMoney = Math.ceil(getMaxMoney(data) / 50) * 50 || 50;
  const maxHours = Math.ceil(getMaxHours(data) * 2) / 2 || 1;

  return (
    <>
      <style>{`
        .date-picker-wrapper .react-datepicker__input-container input {
          width: 100%;
          padding: ${isMobile ? '10px 12px' : '8px 12px'};
          border-radius: 8px;
          border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
          background: ${isDark ? '#121a2d' : '#fff'};
          color: ${isDark ? '#ffffff' : '#111827'};
          font-size: ${isMobile ? '13px' : '14px'};
        }
        .date-picker-wrapper .react-datepicker__input-container input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>

      <div style={{
        ...styles.containerStyle,
        padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
      }}>
        <div className='date-picker-wrapper' style={{  width: isMobile ? '30%' : isTablet ? '50%' : '10%', }}>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM / yyyy"
            showMonthYearPicker
            views={['month', 'year']}
            placeholderText="Select month and year"
            style={{ width: '100px' }}
          />
        </div>
      </div>
      <div style={{
        width: '100%',
        height: isMobile ? '400px' : isTablet ? '450px' : 'calc(60vh - 120px)',
        minHeight: isMobile ? '350px' : '420px',
        overflowX: isMobile || isTablet ? 'auto' : 'visible'
      }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={isMobile ? 320 : isTablet ? 600 : 0}
        >
          <ComposedChart
            data={data}
            margin={{
              top: isMobile ? 30 : 40,
              right: isMobile ? 20 : isTablet ? 40 : 60,
              left: isMobile ? 10 : isTablet ? 20 : 40,
              bottom: isMobile ? 10 : 20
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1b2436' : '#e0e0e0'} opacity={0.3} />

            {/* Left Y-axis for K VND */}
            <YAxis
              yAxisId="money"
              orientation="left"
              width={isMobile ? 40 : isTablet ? 50 : 60}
              label={!isMobile ? {
                value: 'K VND',
                position: 'top',
                dx: 0,
                dy: -10,
                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
              } : undefined}
              domain={[0, maxMoney]}
              ticks={generateTicks(maxMoney, 50)}
              stroke={isDark ? '#cbd5f5' : '#666'}
              tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
            />

            {/* Middle Y-axis for kWh */}
            <YAxis
              yAxisId="kwh"
              orientation="left"
              width={isMobile ? 40 : isTablet ? 50 : 60}
              label={!isMobile ? {
                value: 'kWh',
                position: 'top',
                dx: 20,
                dy: -10,
                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
              } : undefined}
              domain={[0, maxKwh]}
              ticks={generateTicks(maxKwh, 10)}
              stroke={isDark ? '#cbd5f5' : '#666'}
              tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
            />

            {/* Right Y-axis for h */}
            <YAxis
              yAxisId="hours"
              orientation="right"
              width={isMobile ? 40 : isTablet ? 50 : 60}
              label={!isMobile ? {
                value: 'h',
                angle: 0,
                position: 'top',
                dx: -30,
                dy: -10,
                style: { fontSize: isMobile ? 10 : 12, fill: isDark ? '#cbd5f5' : '#666' }
              } : undefined}
              domain={[0, maxHours]}
              ticks={generateTicks(maxHours, 0.5)}
              stroke={isDark ? '#cbd5f5' : '#666'}
              tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
            />

            <XAxis
              dataKey="day"
              stroke={isDark ? '#cbd5f5' : '#666'}
              interval={isMobile ? 2 : isTablet ? 1 : 0}
              tick={{ fontSize: isMobile ? 9 : 11, fill: isDark ? '#cbd5f5' : '#666' }}
            />

            <Tooltip
              labelFormatter={(day) =>
                dayjs(selectedDate)
                  .date(Number(day))
                  .format("YYYY-MM-DD")
              }
              formatter={(value, name) => {
                if (name === "Revenue") {
                  return [`${formatShort(value)} VND`, name];
                }
                if (name === "Full Load Hours") {
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
                paddingTop: isMobile ? '10px' : '20px',
                fontSize: isMobile ? '10px' : '12px'
              }}
              iconSize={isMobile ? 10 : 14}
            />

            {/* Bars */}
            <Bar
              yAxisId="kwh"
              dataKey="yield"
              name="Yield"
              fill="#f0cf00"
              barSize={isMobile ? 12 : isTablet ? 18 : 24}
            />
            <Bar
              yAxisId="kwh"
              dataKey="exporting"
              name="Exporting"
              fill="#5f91cb"
              barSize={isMobile ? 12 : isTablet ? 18 : 24}
            />
            <Bar
              yAxisId="kwh"
              dataKey="importing"
              name="Importing"
              fill="#E84855"
              barSize={isMobile ? 12 : isTablet ? 18 : 24}
            />
            <Bar
              yAxisId="kwh"
              dataKey="consumed"
              name="Consumed"
              fill="#fda23a"
              barSize={isMobile ? 12 : isTablet ? 18 : 24}
            />

            {/* Lines */}
            <Line
              yAxisId="hours"
              type="linear"
              dataKey="fullLoadHours"
              name="Full Load Hours"
              stroke="#4a7fbc"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={false}
            />
            <Line
              yAxisId="money"
              type="linear"
              dataKey="earning"
              name="Revenue"
              stroke="#f08519"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default EnergyChart;
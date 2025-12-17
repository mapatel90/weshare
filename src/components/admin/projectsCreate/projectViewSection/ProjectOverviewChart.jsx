"use client";
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const TIME_TICK_HOURS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const xAxisTicks = [...TIME_TICK_HOURS];
const yAxisTicks = [0, 3, 6, 9, 12, 15];

const normalizeDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const extractHourMinute = (value) => {
  if (value === undefined || value === null) return { hour: 0, minute: 0 };

  let raw = String(value).trim();
  if (!raw) return { hour: 0, minute: 0 };

  raw = raw.replace('T', ' ');

  const meridiem = /pm/i.test(raw) ? 'pm' : /am/i.test(raw) ? 'am' : null;
  raw = raw.replace(/am|pm/gi, '').trim();

  const spaceSegments = raw.split(' ').filter(Boolean);
  let timePortion =
    spaceSegments.find((segment) => segment.includes(':')) ||
    spaceSegments[spaceSegments.length - 1] ||
    spaceSegments[0];

  if (!timePortion) timePortion = raw;

  const timePieces = timePortion.split(':');
  let hourNumber = parseInt(timePieces[0], 10);
  let minuteNumber = parseInt(timePieces[1], 10);

  if (Number.isNaN(hourNumber)) hourNumber = 0;
  if (Number.isNaN(minuteNumber)) minuteNumber = 0;

  if (meridiem === 'pm' && hourNumber < 12) hourNumber += 12;
  if (meridiem === 'am' && hourNumber === 12) hourNumber = 0;

  return {
    hour: hourNumber,
    minute: Math.max(0, Math.min(59, minuteNumber)),
  };
};

const normalizeTimeLabel = (value) => {
  const { hour, minute } = extractHourMinute(value);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const normalizePowerValueKw = (value) => {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  // convert from W to kW and round to 3 decimals
  return Number((numeric / 1000).toFixed(3));
};

const containerStyle = {
  width: '100%',
  height: '60vh',
  backgroundColor: '#ffffff',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
};

const stateMessageStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  fontSize: '14px',
};

// Project-level single-series chart (no inverter selection)
const ProjectOverviewChart = ({ projectId, readings = [], loading = false, selectedDate, onDateChange }) => {
  const { lang } = useLanguage();
  const { chartData, xAxisProps, yAxisDomain } = useMemo(() => {
    const selectedKey = normalizeDateKey(selectedDate);

    // Filter readings by selected date (if provided) and build time-series
    const rawPoints = (readings || [])
      .filter((entry) => {
        if (!selectedKey) return true;
        const entryKey = normalizeDateKey(entry.date);
        return entryKey === selectedKey;
      })
      .map((entry) => {
        const normalizedTime = normalizeTimeLabel(entry.time);
        const { hour, minute } = extractHourMinute(entry.time);
        const hourValue = Number((hour + minute / 60).toFixed(2));
        const pv = normalizePowerValueKw(entry?.pv);
        const grid = normalizePowerValueKw(entry?.grid);
        const load = normalizePowerValueKw(entry?.load);
        return {
          hourValue,
          displayTime: entry.time || normalizedTime,
          pv,
          grid,
          load,
        };
      })
      .sort((a, b) => a.hourValue - b.hourValue);

    // Merge with fixed ticks to avoid stretched line segments
    const hourSet = new Set(rawPoints.map((p) => p.hourValue));
    xAxisTicks.forEach((t) => hourSet.add(t));
    const allHours = Array.from(hourSet).sort((a, b) => a - b);

    const data = allHours.map((hv) => {
      const hh = Math.floor(hv);
      const mm = Math.round((hv - hh) * 60);
      const baseLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const exact = rawPoints.find((p) => Math.abs(p.hourValue - hv) < 0.01);
      return {
        xValue: hv,
        displayTime: exact ? exact.displayTime : baseLabel,
        pv: exact ? exact.pv : null,
        grid: exact ? exact.grid : null,
        load: exact ? exact.load : null,
      };
    });

    const xProps = {
      dataKey: 'xValue',
      type: 'number',
      domain: [2, 22],
      ticks: xAxisTicks,
      tickFormatter: (value) => `${value}`,
    };

    // dynamic y-domain based on data max (all series)
    let maxY = 0;
    data.forEach((row) => {
      ['pv', 'grid', 'load'].forEach((key) => {
        const v = row[key];
        if (v !== null && v !== undefined && !Number.isNaN(Number(v))) {
          maxY = Math.max(maxY, Number(v));
        }
      });
    });
    const upper = maxY > 0 ? Math.ceil(maxY * 1.1) : 15;

    return { chartData: data, xAxisProps: xProps, yAxisDomain: [0, upper] };
  }, [readings, selectedDate]);

  const isEmptyState = !loading && (!chartData || !chartData.length);

  const tooltipLabelFormatter = (label, payload) => {
    const displayTime = payload && payload.length ? payload[0]?.payload?.displayTime || String(label) : label;
    return `${displayTime || label}`;
  };

  return (
    <div style={containerStyle}>
      {/* Header Controls */}
      <div style={headerRowStyle}>
        {/* Date input (project-level) */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-black text-white border rounded-md px-3 py-2 me-2 text-sm"
          placeholder={lang("common.endDate") || "End Date"}
        />
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: '420px' }}>
        {loading ? (
          <div style={stateMessageStyle}>
            Loading project data...
          </div>
        ) : isEmptyState ? (
          <div style={{ ...stateMessageStyle, flexDirection: 'column' }}>
            No project readings available for this date.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
                <XAxis
                  dataKey={xAxisProps.dataKey || 'xValue'}
                  type={xAxisProps.type || 'category'}
                  domain={xAxisProps.domain}
                  ticks={xAxisProps.ticks}
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  allowDecimals={false}
                  tickFormatter={xAxisProps.tickFormatter}
                />
                <YAxis
                  label={{ value: 'kW', angle: -90, position: 'insideLeft', style: { fill: '#666', fontSize: 14 } }}
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  domain={yAxisDomain}
                  ticks={yAxisTicks}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  formatter={(value, name) => {
                    const num = Number(value);
                    if (Number.isNaN(num)) {
                      return ['0 kW', name];
                    }
                    return [`${num.toFixed(3)} kW`, name];
                  }}
                  labelFormatter={tooltipLabelFormatter}
                />

                {/* Project power series: PV, Grid, Load */}
                <Line
                  type="monotone"
                  dataKey="pv"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={false}
                  name="PV (kW)"
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                  connectNulls={true}
                  fill="none"
                  fillOpacity={0}
                  strokeOpacity={0.95}
                  legendType="line"
                />
                <Line
                  type="monotone"
                  dataKey="grid"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Grid (kW)"
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                  connectNulls={true}
                  fill="none"
                  fillOpacity={0}
                  strokeOpacity={0.95}
                  legendType="line"
                />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Load (kW)"
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                  connectNulls={true}
                  fill="none"
                  fillOpacity={0}
                  strokeOpacity={0.95}
                  legendType="line"
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectOverviewChart;

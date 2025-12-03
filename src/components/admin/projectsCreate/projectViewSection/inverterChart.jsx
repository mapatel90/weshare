import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

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

const timeToMinutes = (value) => {
  if (!value) return 0;
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
};

const pickPowerValue = (entry) => {
  const candidates = [
    entry?.generate_kw,
    entry?.generated_kw,
    entry?.power,
  ];
  const value = candidates.find((v) => v !== undefined && v !== null);
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Number(numeric.toFixed(2));
};

const buttonBaseStyle = {
  padding: '8px 24px',
  borderRadius: '8px',
  fontWeight: 500,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, color 0.2s ease',
};

const buttonActiveStyle = {
  backgroundColor: '#f97316',
  borderColor: '#f97316',
  color: '#ffffff',
};

const navIconButtonStyle = {
  padding: '6px',
  borderRadius: '6px',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
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

const dateSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  // gap: '8px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '4px 0px',
  width: 'fit-content'
};

const viewButtonsWrapperStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
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

const legendWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '16px',
};

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#4b5563',
};

const legendDotStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '9999px',
  backgroundColor: '#f97316',
};

const PowerConsumptionDashboard = ({ projectId, readings = [], loading = false }) => {
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [viewType, setViewType] = useState('day');

  // add responsive state to switch styles on small screens
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 600 : false);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // compute style: single-row buttons with horizontal scroll on small screens
  const viewButtonsStyle = {
    ...viewButtonsWrapperStyle,
    flexWrap: isSmallScreen ? 'nowrap' : viewButtonsWrapperStyle.flexWrap,
    overflowX: isSmallScreen ? 'auto' : undefined,
    WebkitOverflowScrolling: isSmallScreen ? 'touch' : undefined,
    paddingBottom: isSmallScreen ? '6px' : undefined,
  };

  const readingsByDate = useMemo(() => {
    return readings.reduce((acc, entry) => {
      const key = normalizeDateKey(entry.date);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});
  }, [readings]);

  const availableDates = useMemo(() => {
    return Object.keys(readingsByDate).sort((a, b) => new Date(a) - new Date(b));
  }, [readingsByDate]);

  useEffect(() => {
    if (!availableDates.length) {
      setSelectedDateKey(null);
      return;
    }
    setSelectedDateKey((prev) => {
      if (prev && availableDates.includes(prev)) return prev;
      return availableDates[availableDates.length - 1];
    });
  }, [availableDates]);
 
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };
 
  const handlePrevDay = () => {
    if (!selectedDateKey) return;
    const currentIndex = availableDates.indexOf(selectedDateKey);
    if (currentIndex > 0) setSelectedDateKey(availableDates[currentIndex - 1]);
  };
 
  const handleNextDay = () => {
    if (!selectedDateKey) return;
    const currentIndex = availableDates.indexOf(selectedDateKey);
    if (currentIndex < availableDates.length - 1) setSelectedDateKey(availableDates[currentIndex + 1]);
  };
 
  const handleExport = () => {
    alert('Export functionality would download the data as CSV/Excel');
  };
 
  const selectedDayData = useMemo(() => {
    if (!selectedDateKey) return [];
    const entries = readingsByDate[selectedDateKey] || [];
    // normalize and keep power as Number (kW)
    const points = entries
      .map((entry) => {
        const normalizedTime = normalizeTimeLabel(entry.time);
        const { hour, minute } = extractHourMinute(entry.time);
        const hourValue = Number((hour + minute / 60).toFixed(2));
        return {
          time: normalizedTime,
          displayTime: entry.time || normalizedTime,
          hourValue,
          // keep numeric value (kW) so recharts treats it as number
          power: Number((pickPowerValue(entry) / 1000)),
        };
      })
      .filter((point) => Boolean(point.time) && !Number.isNaN(point.hourValue))
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    if (!points.length) return [];

    // Ensure chart stays at 0 until the first actual reading:
    // add a baseline point at the earliest x-axis tick (e.g. 2) with power 0,
    // then append actual points. Use a step line to avoid a diagonal spike.
    const startTick = xAxisTicks[0] ?? 2;
    const baseline = { time: normalizeTimeLabel(`${Math.floor(startTick)}:00`), displayTime: null, hourValue: startTick, power: 0 };

    // If there's already a point at or before startTick, don't duplicate baseline
    const filled = (points[0].hourValue > startTick) ? [baseline, ...points] : [...points];

    // ensure sorted
    return filled.sort((a, b) => a.hourValue - b.hourValue);
  }, [readingsByDate, selectedDateKey]);

  const isEmptyState = !loading && (!selectedDayData || !selectedDayData.length);

  const tooltipLabelFormatter = (label, payload) => {
    const dateLabel = formatDate(selectedDateKey);
    const displayTime = payload && payload.length ? payload[0]?.payload?.displayTime || label : label;
    if (!dateLabel) return `Time: ${displayTime}`;
    return `${dateLabel} • ${displayTime || label}`;
  };

  return (
    <div style={containerStyle}>
      {/* Header Controls */}
      <div style={headerRowStyle}>
        {/* Date Navigation */}
        <div style={dateSelectorStyle}>
          <button
            type="button"
            onClick={handlePrevDay}
            style={navIconButtonStyle}
          >
            <ChevronLeft color="#4b5563" size={20} />
          </button>
          <span style={{ padding: '4px 16px', color: '#374151', fontWeight: 500, minWidth: '120px', textAlign: 'center' }}>
            {formatDate(selectedDateKey)}
          </span>
          <button
            type="button"
            onClick={handleNextDay}
            style={navIconButtonStyle}
          >
            <ChevronRight color="#4b5563" size={20} />
          </button>
        </div>
 
        {/* View Type Buttons */}
        <div style={viewButtonsStyle}>
          {['day', 'month', 'year', 'total'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setViewType(label)}
              style={{
                ...buttonBaseStyle,
                ...(viewType === label ? buttonActiveStyle : {}),
                whiteSpace: 'nowrap'
              }}
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </button>
          ))}
          {/* <button
            type="button"
            onClick={handleExport}
            style={{ ...buttonBaseStyle, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <Download size={16} />
            Export
          </button> */}
        </div>
      </div>
 
      {/* Chart */}
      <div style={{ width: '100%', height: 'calc(100vh - 180px)' }}>
        {loading ? (
          <div style={stateMessageStyle}>
            Loading inverter data...
          </div>
        ) : isEmptyState ? (
          <div style={{ ...stateMessageStyle, flexDirection: 'column' }}>
            No inverter readings available for this date.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={selectedDayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hourValue"
                  type="number"
                  domain={[2, 22]}
                  ticks={xAxisTicks}
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  allowDecimals={false}
                  tickFormatter={(value) => `${value}`}
                />
                <YAxis
                  label={{ value: 'kW', angle: -90, position: 'insideLeft', style: { fill: '#666', fontSize: 14 } }}
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                  axisLine={{ stroke: '#ccc' }}
                  domain={[0, 15]}
                  ticks={yAxisTicks}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  // format numeric value and ensure 3 decimals
                  formatter={(value) => [`${Number(value).toFixed(3)} kW`, 'Generated']}
                  labelFormatter={tooltipLabelFormatter}
                />
                <Line
                  // use a step line so chart stays flat at 0 until the first reading then jumps
                  type="stepAfter"
                  dataKey="power"
                  stroke="#ff8c00"
                  strokeWidth={2}
                  dot={false}
                  name="Total Power"
                />
              </LineChart>
            </ResponsiveContainer>
        
            {/* Legend */}
            <div style={legendWrapperStyle}>
              <div style={legendItemStyle}>
                <div style={legendDotStyle}></div>
                <span>Generated kW</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
 
export default PowerConsumptionDashboard;

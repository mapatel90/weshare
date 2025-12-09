"use client";
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
  gap: '12px',
  flexWrap: 'wrap',
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

// Changed: support multiple inverter series & single inverter selection
const PowerConsumptionDashboard = ({ projectId, readings = [], loading = false, selectedInverterId = '', projectInverters = [] }) => {
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

  // Helper: extract a stable inverter id from a reading (tries several common keys)
  const getInverterId = (entry) => {
    return String(entry?.inverter_id ?? entry?.inverterId ?? entry?.projectInverterId ?? entry?.project_inverter_id ?? entry?.project_inverterid ?? entry?.project_inverter_id ?? entry?.inverter?.id ?? 'unknown');
  };

  // Map inverter id to friendly name (from projectInverters if available)
  const inverterNameFor = (invId) => {
    const pi = projectInverters.find(p => String(p.inverter_id) === String(invId) || String(p.id) === String(invId));
    if (pi) {
      const inv = pi.inverter || {};
      return inv.inverterName ? `${inv.inverterName} (S: ${pi.inverter_serial_number || 'N/A'})` : `Inverter ${pi.inverter_id || pi.id}`;
    }
    return `Inverter ${invId}`;
  };

  // palette for multiple inverter lines
  const palette = ['#10B981', '#F59E0B', '#3B82F6', '#ef4444', '#8B5CF6', '#06B6D4', '#A78BFA'];

  // Build chart data for the selected date. If no inverter selected => build multiple series.
  const { chartData, seriesInfo } = useMemo(() => {
    if (!selectedDateKey) return { chartData: [], seriesInfo: [] };
    const entries = readingsByDate[selectedDateKey] || [];
    if (!entries.length) return { chartData: [], seriesInfo: [] };

    // group by inverter id
    const perInv = entries.reduce((acc, e) => {
      const invId = getInverterId(e);
      if (!acc[invId]) acc[invId] = [];
      acc[invId].push(e);
      return acc;
    }, {});

    // If specific inverter selected, only keep that one
    const inverterIds = selectedInverterId ? [String(selectedInverterId)] : Object.keys(perInv);

    // Build all hourValues present across all inverters (as number: hour + minute/60)
    const hourSet = new Set();

    const invPoints = {};
    inverterIds.forEach((invId) => {
      const list = (perInv[invId] || []).map((entry) => {
        const normalizedTime = normalizeTimeLabel(entry.time);
        const { hour, minute } = extractHourMinute(entry.time);
        const hourValue = Number((hour + minute / 60).toFixed(2));
        const powerKW = Number((pickPowerValue(entry) / 1000));
        hourSet.add(hourValue);
        return { hourValue, displayTime: entry.time || normalizedTime, power: powerKW };
      }).sort((a, b) => a.hourValue - b.hourValue);

      // keep
      invPoints[invId] = list;
    });

    // include xAxis baseline ticks as possible domain points
    xAxisTicks.forEach(t => hourSet.add(t));

    const allHours = Array.from(hourSet).sort((a, b) => a - b);

    // Create merged objects where each inverter has a key p_${invId}
    const data = allHours.map((hv) => {
      const obj = { hourValue: hv };
      // create displayTime from hv
      const hh = Math.floor(hv);
      const mm = Math.round((hv - hh) * 60);
      const displayTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      obj.displayTime = displayTime;

      inverterIds.forEach(invId => {
        const points = invPoints[invId] || [];
        // find exact point with same hourValue (could be decimals) or nearest earlier one
        const exact = points.find(p => Math.abs(p.hourValue - hv) < 0.01);
        if (exact) {
          obj[`p_${invId}`] = exact.power;
        } else {
          // default 0 to keep flat until the reading appears
          obj[`p_${invId}`] = 0;
        }
      });

      return obj;
    });

    // series info for rendering lines
    const series = inverterIds.map((invId, idx) => ({
      id: invId,
      key: `p_${invId}`,
      color: palette[idx % palette.length],
      name: inverterNameFor(invId),
    }));

    return { chartData: data, seriesInfo: series };
  }, [readingsByDate, selectedDateKey, selectedInverterId, projectInverters]);

  const isEmptyState = !loading && (!chartData || !chartData.length);

  const tooltipLabelFormatter = (label, payload) => {
    const dateLabel = formatDate(selectedDateKey);
    const displayTime = payload && payload.length ? payload[0]?.payload?.displayTime || (String(label)) : label;
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
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
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
                  formatter={(value, name) => [`${Number(value).toFixed(3)} kW`, name]}
                  labelFormatter={tooltipLabelFormatter}
                />

                {/* Render series: if single inverter selected, seriesInfo will contain only that */}
                {seriesInfo.map((s) => (
                  <Line
                    key={s.key}
                    type="linear"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={false}
                    name={s.name}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls={false}
                    // explicitly disable any area fill that can appear with multiple series
                    fill="none"
                    fillOpacity={0}
                    strokeOpacity={0.95}
                    legendType="line"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={legendWrapperStyle}>
              {seriesInfo.map(s => (
                <div key={s.id} style={legendItemStyle}>
                  <div style={{ ...legendDotStyle, backgroundColor: s.color }}></div>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PowerConsumptionDashboard;

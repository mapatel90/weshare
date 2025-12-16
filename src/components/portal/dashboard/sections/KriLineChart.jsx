"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
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

// map month index to short label
const monthLabel = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const daysInMonth = (year, monthIndex) => {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 31;
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Changed: support multiple inverter series & single inverter selection
const KriLineChart = ({ projectId, readings = [], loading = false, selectedInverterId = '', projectInverters = [], selectedDate, onDateChange, setSelectedDate }) => {
  const [viewType, setViewType] = useState('day');
  const { lang } = useLanguage();

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

  // Build chart data based on view type.
  const { chartData, seriesInfo, xAxisProps, yAxisDomain } = useMemo(() => {
    // group by inverter id for the full dataset (we'll filter per view)
    const grouped = (readings || []).reduce((acc, entry) => {
      const key = normalizeDateKey(entry.date);
      if (!key) return acc;
      const invId = getInverterId(entry);
      if (!acc[invId]) acc[invId] = [];
      acc[invId].push({ ...entry, dateKey: key });
      return acc;
    }, {});

    const inverterIds = selectedInverterId
      ? [String(selectedInverterId)]
      : Object.keys(grouped);

    const filtered = {};
    inverterIds.forEach((invId) => {
      const list = grouped[invId] || [];
      filtered[invId] = list.filter((e) => {
        if (viewType === 'month') {
          return d.getFullYear() === baseDate.getFullYear() && d.getMonth() === baseDate.getMonth();
        }
        if (viewType === 'year') {
          return d.getFullYear() === baseDate.getFullYear();
        }
        return true; // total
      });
    });

    // Build helpers per view
    let data = [];
    let xProps = {};

    if (viewType === 'day') {
      // time-series within the selected day
      const hourSet = new Set();
      const invPoints = {};
      inverterIds.forEach((invId) => {
        const list = (filtered[invId] || []).map((entry) => {
          const normalizedTime = normalizeTimeLabel(entry.time);
          const { hour, minute } = extractHourMinute(entry.time);
          const hourValue = Number((hour + minute / 60).toFixed(2));
          const powerKW = Number(pickPowerValue(entry) / 1000);
          hourSet.add(hourValue);
          return { hourValue, displayTime: entry.time || normalizedTime, power: powerKW };
        }).sort((a, b) => a.hourValue - b.hourValue);
        invPoints[invId] = list;
      });

      xAxisTicks.forEach(t => hourSet.add(t));
      const allHours = Array.from(hourSet).sort((a, b) => a - b);

      data = allHours.map((hv) => {
        const obj = { xValue: hv };
        const hh = Math.floor(hv);
        const mm = Math.round((hv - hh) * 60);
        obj.displayTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        inverterIds.forEach((invId) => {
          const points = invPoints[invId] || [];
          const exact = points.find(p => Math.abs(p.hourValue - hv) < 0.01);
          obj[`p_${invId}`] = exact ? exact.power : null;
        });
        return obj;
      });

      xProps = {
        dataKey: 'xValue',
        type: 'number',
        domain: [2, 22],
        ticks: xAxisTicks,
        tickFormatter: (value) => `${value}`,
      };
    } else {
      // aggregation buckets for month/year/total (category axis for readable labels)
      const bucketMap = {};
      const addBucket = (key, label, order, invId, value) => {
        if (!bucketMap[key]) {
          bucketMap[key] = { xValue: label, order, displayTime: label };
          inverterIds.forEach(id => { bucketMap[key][`p_${id}`] = null; });
        }
        bucketMap[key][`p_${invId}`] = (bucketMap[key][`p_${invId}`] || 0) + value;
      };

      // month view: pre-create all days of the month to avoid stretched lines
      if (viewType === 'month' && baseDate) {
        const dim = daysInMonth(baseDate.getFullYear(), baseDate.getMonth());
        for (let day = 1; day <= dim; day += 1) {
          addBucket(
            `day-${day}`,
            `${String(day).padStart(2, '0')}/${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
            day,
            inverterIds[0] ?? '0',
            0
          );
          // reset to null for all inverter ids
          inverterIds.forEach(id => { bucketMap[`day-${day}`][`p_${id}`] = null; });
        }
      }

      inverterIds.forEach((invId) => {
        (filtered[invId] || []).forEach((entry) => {
          const d = new Date(entry.dateKey);
          const powerKW = Number(pickPowerValue(entry) / 1000);
          if (viewType === 'month') {
            const day = d.getDate();
            addBucket(
              `day-${day}`,
              `${String(day).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
              day,
              invId,
              powerKW
            );
          } else if (viewType === 'year') {
            const m = d.getMonth();
            addBucket(`month-${m}`, monthLabel[m], m + 1, invId, powerKW);
          } else {
            // total
            const order = d.getTime();
            addBucket(entry.dateKey, entry.dateKey, order, invId, powerKW);
          }
        });
      });

      data = Object.values(bucketMap).sort((a, b) => a.order - b.order);

      xProps = {
        dataKey: 'xValue',
        type: 'category',
        ticks: data.map(d => d.xValue),
        tickFormatter: (value) => value,
      };
    }

    const series = inverterIds.map((invId, idx) => ({
      id: invId,
      key: `p_${invId}`,
      color: palette[idx % palette.length],
      name: inverterNameFor(invId),
    }));

    // dynamic y-domain based on data max
    let maxY = 0;
    data.forEach((row) => {
      inverterIds.forEach((invId) => {
        const v = row[`p_${invId}`];
        if (v !== null && v !== undefined) {
          maxY = Math.max(maxY, Number(v));
        }
      });
    });
    const upper = maxY > 0 ? Math.ceil(maxY * 1.1) : 15;

    return { chartData: data, seriesInfo: series, xAxisProps: xProps, yAxisDomain: [0, upper] };
  }, [readings, selectedInverterId, projectInverters, viewType]);

  const isEmptyState = !loading && (!chartData || !chartData.length);

  const tooltipLabelFormatter = (label, payload) => {
    const displayTime = payload && payload.length ? payload[0]?.payload?.displayTime || (String(label)) : label;
    // if (!dateLabel) return `Time: ${displayTime}`;
    return `${displayTime || label}`;
  };

  return (
    <div style={containerStyle}>
      {/* Header Controls */}
      <div style={headerRowStyle}>
        {/* Date Navigation */}
        <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
                placeholder={lang("common.endDate") || "End Date"}
            />
        
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: '420px' }}>
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
                  formatter={(value, name) => [`${Number(value).toFixed(3)} kW`, name]}
                  labelFormatter={tooltipLabelFormatter}
                />

                {/* Render series: if single inverter selected, seriesInfo will contain only that */}
                {seriesInfo.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={false}
                    name={s.name}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls={true}
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
            {/* <div style={legendWrapperStyle}>
              {seriesInfo.map(s => (
                <div key={s.id} style={legendItemStyle}>
                  <div style={{ ...legendDotStyle, backgroundColor: s.color }}></div>
                  <span>{s.name}</span>
                </div>
              ))}
            </div> */}
          </>
        )}
      </div>
    </div>
  );
};

export default KriLineChart;

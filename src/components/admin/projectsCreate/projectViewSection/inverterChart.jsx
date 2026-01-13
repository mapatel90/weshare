"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend } from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TIME_TICK_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const xAxisTicks = [...TIME_TICK_HOURS];

const formatHourTick = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  const hh = Math.floor(num);
  const mm = Math.round((num - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// Create "nice" Y-axis ticks like 0,2,4,6... based on data range.
const buildNiceTicks = (minValue, maxValue, preferredStep = 2, maxTicks = 60) => {
  const min = Number(minValue);
  const max = Number(maxValue);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  // Keep step >= 1 and prefer whole numbers for readability.
  let step = Number(preferredStep);
  if (!Number.isFinite(step) || step <= 0) step = 1;

  const snapDown = (v) => Math.floor(v / step) * step;
  const snapUp = (v) => Math.ceil(v / step) * step;

  let start = snapDown(min);
  let end = snapUp(max);

  // If too many ticks, increase step until we fit.
  while (Number.isFinite(start) && Number.isFinite(end) && (end - start) / step + 1 > maxTicks) {
    step *= 2;
    start = snapDown(min);
    end = snapUp(max);
  }

  const total = Math.floor((end - start) / step) + 1;
  if (!Number.isFinite(total) || total < 2 || total > maxTicks) return null;
  return Array.from({ length: total }, (_, idx) => start + idx * step);
};

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
  minWidth: '600px',
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
const PowerConsumptionDashboard = ({ projectId, readings = [], loading = false, selectedInverterId = '', projectInverters = [], selectedDate, onDateChange, setSelectedDate, isDark = false }) => {
  const [viewType, setViewType] = useState('day');
  const { lang } = useLanguage();

  // add responsive state to switch styles on small screens
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(() => typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // compute style: single-row buttons with horizontal scroll on small screens
  const viewButtonsStyle = {
    ...viewButtonsWrapperStyle,
    flexWrap: isMobile ? 'nowrap' : viewButtonsWrapperStyle.flexWrap,
    overflowX: isMobile ? 'auto' : undefined,
    WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
    paddingBottom: isMobile ? '6px' : undefined,
  };

  const responsiveContainerStyle = {
    ...containerStyle,
    minWidth: isMobile ? '320px' : isTablet ? '600px' : '600px',
    padding: isMobile ? '16px' : '24px',
    backgroundColor: isDark ? '#121a2d' : '#ffffff',
    overflowX: isMobile || isTablet ? 'auto' : 'visible',
  };

  const responsiveHeaderRowStyle = {
    ...headerRowStyle,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? '12px' : '0',
    marginBottom: isMobile ? '20px' : '32px',
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
  const { chartData, seriesInfo, xAxisProps, yAxisDomain, yAxisTicks } = useMemo(() => {
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
        domain: [0, 22],
        ticks: xAxisTicks,
        tickFormatter: formatHourTick,
      };
    } else {
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

    // dynamic y-domain based on actual min/max across all series
    let minY = null;
    let maxY = null;
    data.forEach((row) => {
      inverterIds.forEach((invId) => {
        const v = row[`p_${invId}`];
        const num = Number(v);
        if (v !== null && v !== undefined && !Number.isNaN(num)) {
          minY = minY === null ? num : Math.min(minY, num);
          maxY = maxY === null ? num : Math.max(maxY, num);
        }
      });
    });

    let domainMin;
    let domainMax;
    if (minY === null || maxY === null) {
      domainMin = 0;
      domainMax = 15;
    } else {
      const range = maxY - minY;
      const padUp = range === 0 ? 1 : range * 0.1;
      domainMin = 0;
      domainMax = Math.ceil(maxY + padUp);

      if (!Number.isFinite(domainMin) || !Number.isFinite(domainMax)) {
        domainMin = 0;
        domainMax = 15;
      } else if (domainMax <= domainMin) {
        domainMax = domainMin + 1;
      }
    }

    const ticks = buildNiceTicks(domainMin, domainMax, 2, 60);
    // If we generated ticks, snap domain to the tick endpoints for clean axis labels.
    const finalDomainMin = ticks?.length ? ticks[0] : domainMin;
    const finalDomainMax = ticks?.length ? ticks[ticks.length - 1] : domainMax;

    return {
      chartData: data,
      seriesInfo: series,
      xAxisProps: xProps,
      yAxisDomain: [finalDomainMin, finalDomainMax],
      yAxisTicks: ticks,
    };
  }, [readings, selectedInverterId, projectInverters, viewType]);

  const isEmptyState = !loading && (!chartData || !chartData.length);

  const tooltipLabelFormatter = (label, payload) => {
    const displayTime = payload && payload.length ? payload[0]?.payload?.displayTime || (String(label)) : label;
    // if (!dateLabel) return `Time: ${displayTime}`;
    return `${displayTime || label}`;
  };

  return (
    <div style={responsiveContainerStyle}>
      {/* Header Controls */}
      <div style={responsiveHeaderRowStyle}>
        {/* Date Navigation */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            backgroundColor: isDark ? '#121a2d' : '#fff',
            color: isDark ? '#ffffff' : '#111827',
            border: `1px solid ${isDark ? '#1b2436' : '#e5e7eb'}`,
            borderRadius: '6px',
            padding: isMobile ? '10px 12px' : '8px 12px',
            fontSize: isMobile ? '13px' : '14px',
            width: isMobile ? '100%' : 'auto',
          }}
          placeholder={lang("common.endDate") || "End Date"}
        />
      </div>

      {/* Chart */}
      <div style={{
        width: '100%',
        height: isMobile ? '350px' : isTablet ? '400px' : 'calc(100vh - 180px)',
        minHeight: isMobile ? '300px' : '420px'
      }}>
        {loading ? (
          <div style={{
            ...stateMessageStyle,
            color: isDark ? '#b1b4c0' : '#6b7280'
          }}>
            Loading inverter data...
          </div>
        ) : isEmptyState ? (
          <div style={{
            ...stateMessageStyle,
            flexDirection: 'column',
            color: isDark ? '#b1b4c0' : '#6b7280'
          }}>
            No inverter readings available for this date.
          </div>
        ) : (
          <>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={isMobile ? 300 : isTablet ? 500 : 0}
            >
              <LineChart
                data={chartData}
                margin={{
                  top: isMobile ? 15 : 20,
                  right: isMobile ? 10 : isTablet ? 20 : 30,
                  left: isMobile ? 10 : 20,
                  bottom: isMobile ? 40 : 60
                }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#1b2436' : '#f0f0f0'} opacity={0.3} />
                <XAxis
                  dataKey={xAxisProps.dataKey || 'xValue'}
                  type={xAxisProps.type || 'category'}
                  domain={xAxisProps.domain}
                  ticks={xAxisProps.ticks}
                  tick={{ fill: isDark ? '#b1b4c0' : '#666', fontSize: isMobile ? 10 : 12 }}
                  tickLine={{ stroke: isDark ? '#1b2436' : '#ccc' }}
                  axisLine={{ stroke: isDark ? '#1b2436' : '#ccc' }}
                  allowDecimals={false}
                  tickFormatter={xAxisProps.tickFormatter}
                  interval={isMobile ? 1 : 0}
                />
                <YAxis
                  label={!isMobile ? {
                    value: 'kW',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: isDark ? '#b1b4c0' : '#666', fontSize: isMobile ? 12 : 14 }
                  } : undefined}
                  tick={{ fill: isDark ? '#b1b4c0' : '#666', fontSize: isMobile ? 10 : 12 }}
                  tickLine={{ stroke: isDark ? '#1b2436' : '#ccc' }}
                  axisLine={{ stroke: isDark ? '#1b2436' : '#ccc' }}
                  domain={yAxisDomain}
                  ticks={yAxisTicks || undefined}
                  tickCount={yAxisTicks ? undefined : 6}
                  width={isMobile ? 45 : isTablet ? 55 : 60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#121a2d' : 'white',
                    border: `1px solid ${isDark ? '#1b2436' : '#ccc'}`,
                    borderRadius: '8px',
                    padding: isMobile ? '6px 10px' : '8px 12px',
                    fontSize: isMobile ? '11px' : '12px',
                    color: isDark ? '#ffffff' : '#111827'
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(3)} kW`, name]}
                  labelFormatter={tooltipLabelFormatter}
                />

                <Legend
                  verticalAlign="bottom"
                  height={isMobile ? 30 : 40}
                  wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                  iconSize={isMobile ? 10 : 14}
                />

                {/* Render series: if single inverter selected, seriesInfo will contain only that */}
                {seriesInfo.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={isMobile ? 2 : 2.5}
                    dot={isMobile ? false : { r: 3 }}
                    name={s.name}
                    activeDot={isMobile ? false : { r: 5 }}
                    isAnimationActive={false}
                    connectNulls={true}
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

export default PowerConsumptionDashboard;

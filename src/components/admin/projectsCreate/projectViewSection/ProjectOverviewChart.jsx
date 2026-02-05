"use client";
import React, { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const TIME_TICK_HOURS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const xAxisTicks = [...TIME_TICK_HOURS];

const SERIES_CONFIG = [
  { key: 'load', labelKey: 'chart_label.load', defaultLabel: 'Load', stroke: '#fdaa4c' },
  { key: 'pv', labelKey: 'chart_label.pv', defaultLabel: 'PV', stroke: '#f0cf03' },
  { key: 'grid', labelKey: 'chart_label.grid', defaultLabel: 'Grid', stroke: '#25a4b8' },
];

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
      width: '100%',
      height: '60vh',
      backgroundColor: colors.bg,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
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


const tooltipRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 14,
  lineHeight: 1.6,
};

const formatKw = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 kW';
  return `${num.toFixed(3)} kW`;
};

const CustomTooltip = ({ active, payload, label, isDark = false, isMobile = false, series = [] }) => {
  if (!active || !payload?.length) return null;
  const styles = getStyles(isDark);

  const displayTime = payload?.[0]?.payload?.displayTime || label;
  const byKey = new Map(payload.map((p) => [p.dataKey, p]));

  return (
    <div style={{
      ...styles.tooltipWrapStyle,
      padding: isMobile ? '8px 10px' : '10px 12px',
      fontSize: isMobile ? '11px' : '12px'
    }}>
      <div style={{
        ...styles.tooltipTitleStyle,
        fontSize: isMobile ? 11 : 13
      }}>{displayTime}</div>
      {series.map((s) => {
        const entry = byKey.get(s.key);
        const value = entry?.value;
        return (
          <div key={s.key} style={{
            ...tooltipRowStyle,
            fontSize: isMobile ? 12 : 14
          }}>
            <span style={{ color: s.stroke, fontWeight: 600 }}>{s.name} :</span>
            <span style={{ color: s.stroke, fontWeight: 600 }}>{formatKw(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

// Project-level single-series chart (no inverter selection)
const ProjectOverviewChart = ({ projectId, readings = [], loading = false, selectedDate, onDateChange, isDark = false }) => {
  const { lang } = useLanguage();
  const styles = getStyles(isDark);
  
  // Create translated series with proper lang() usage inside component
  const SERIES = useMemo(() => 
    SERIES_CONFIG.map(s => ({
      ...s,
      name: lang(s.labelKey, s.defaultLabel) + ' (kW)'
    })), [lang]);
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = React.useState(() => typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false);

  React.useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { chartData, xAxisProps, yAxisDomain, yAxisTicks } = useMemo(() => {
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

    let minY = null;
    let maxY = null;

    data.forEach((row) => {
      ['pv', 'grid', 'load'].forEach((key) => {
        const v = row[key];
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
      domainMax = 10;
    } else {
      domainMin = Math.floor(minY) - 2;
      domainMax = Math.ceil(maxY) + 2;

      // Prevent invalid / flat domains
      if (!Number.isFinite(domainMin) || !Number.isFinite(domainMax)) {
        domainMin = 0;
        domainMax = 10;
      } else if (domainMax <= domainMin) {
        domainMax = domainMin + 1;
      }
    }

    // Prefer tick steps of 2 units (…, -39, -37, -35, …) when the range allows it.
    // If it would generate too many ticks, fall back to recharts' automatic ticks.
    const TICK_STEP = 2;
    const MAX_TICKS = 60;

    let ticks = null;
    if (Number.isFinite(domainMin) && Number.isFinite(domainMax) && domainMax > domainMin) {
      const snappedMin = Math.floor(domainMin / TICK_STEP) * TICK_STEP;
      const snappedMax = Math.ceil(domainMax / TICK_STEP) * TICK_STEP;

      const tickTotal = Math.floor((snappedMax - snappedMin) / TICK_STEP) + 1;
      if (tickTotal > 1 && tickTotal <= MAX_TICKS) {
        ticks = Array.from({ length: tickTotal }, (_, idx) => snappedMin + idx * TICK_STEP);
        domainMin = snappedMin;
        domainMax = snappedMax;
      }
    }

    return { chartData: data, xAxisProps: xProps, yAxisDomain: [domainMin, domainMax], yAxisTicks: ticks };
  }, [readings, selectedDate]);

  const isEmptyState = !loading && (!chartData || !chartData.length);

  const responsiveContainerStyle = {
    ...styles.containerStyle,
    height: isMobile ? 'auto' : '60vh',
    padding: isMobile ? '16px' : '24px',
    overflowX: isMobile || isTablet ? 'auto' : 'visible',
  };

  const responsiveHeaderRowStyle = {
    ...styles.headerRowStyle,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? '12px' : '0',
    marginBottom: isMobile ? '20px' : '32px',
  };

  return (
    <div style={responsiveContainerStyle}>
      {/* Header Controls */}
      <div style={responsiveHeaderRowStyle}>
        {/* Date input (project-level) */}
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
            marginRight: isMobile ? '0' : '8px',
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
          <div style={styles.stateMessageStyle}>
            Loading project data...
          </div>
        ) : isEmptyState ? (
          <div style={{ ...styles.stateMessageStyle, flexDirection: 'column' }}>
            No project readings available for this date.
          </div>
        ) : (
          <>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={isMobile ? 300 : isTablet ? 500 : 0}
            >
              <ComposedChart
                data={chartData}
                margin={{
                  top: isMobile ? 15 : 20,
                  right: isMobile ? 10 : isTablet ? 20 : 30,
                  left: isMobile ? 10 : 20,
                  bottom: isMobile ? 40 : 60
                }}
              >
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.key} id={`${s.key}Fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.stroke} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={s.stroke} stopOpacity={0.06} />
                    </linearGradient>
                  ))}
                </defs>
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
                  content={<CustomTooltip isDark={isDark} isMobile={isMobile} series={SERIES} />}
                />
                <Legend
                  verticalAlign="bottom"
                  height={isMobile ? 30 : 40}
                  wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                  iconSize={isMobile ? 10 : 14}
                />

                {SERIES.map((s) => (
                  <Area
                    key={`${s.key}-area`}
                    type="monotone"
                    dataKey={s.key}
                    legendType="none"
                    stroke="none"
                    fill={`url(#${s.key}Fill)`}
                    baseValue={0}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}

                {/* Lines on top */}
                {SERIES.map((s) => (
                  <Line
                    key={`${s.key}-line`}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.stroke}
                    strokeWidth={isMobile ? (s.key === 'pv' ? 2 : 1.5) : (s.key === 'pv' ? 2.5 : 2)}
                    dot={false}
                    name={s.name}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                    strokeOpacity={0.95}
                    legendType="line"
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectOverviewChart;

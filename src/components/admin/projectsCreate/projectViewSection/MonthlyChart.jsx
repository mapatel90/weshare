import React, { useEffect, useRef, useState } from 'react';

// Color palette for inverters
const inverterColors = ['#fbbf24', '#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4'];

// Helper function to lighten colors
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

const BarChartComponent = ({ revenue = [], months = [], inverters = [] }) => {
  const canvasRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState({ monthIndex: null, inverterIndex: null });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!revenue || !revenue.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = months && months.length ? months : defaultMonths.slice(0, revenue.length || 12);

    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barSpacing = chartWidth / labels.length;

    // Find max number of inverters in any month
    const maxInvertersPerMonth = Math.max(
      ...inverters.map(monthInverters => (monthInverters && monthInverters.length) || 0),
      1
    );

    // Calculate individual bar width (smaller when more inverters)
    const groupWidth = barSpacing * 0.7; // Width allocated for all bars in a month group
    const individualBarWidth = maxInvertersPerMonth > 1 
      ? (groupWidth / maxInvertersPerMonth) * 0.85 // Leave some gap between bars
      : groupWidth * 0.6;

    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Find max value across all inverters
    let maxValue = 1;
    inverters.forEach(monthInverters => {
      if (monthInverters && monthInverters.length > 0) {
        monthInverters.forEach(inv => {
          if (inv.totalKw > maxValue) maxValue = inv.totalKw;
        });
      }
    });
    // Fallback to revenue if no inverter data
    if (maxValue === 1) {
      maxValue = Math.max(...revenue, 1);
    }

    // Draw bars for each month
    labels.forEach((month, monthIndex) => {
      const monthInverters = inverters[monthIndex] || [];
      const groupStartX = padding + barSpacing * monthIndex + (barSpacing - groupWidth) / 2;

      if (monthInverters.length > 0) {
        // Draw separate bars for each inverter
        monthInverters.forEach((inv, invIndex) => {
          const barX = groupStartX + (invIndex * (groupWidth / maxInvertersPerMonth));
          const barHeight = inv.totalKw > 0 ? (inv.totalKw / maxValue) * chartHeight : 0;
          const barY = padding + chartHeight - barHeight;

          const isHovered = hoveredBar.monthIndex === monthIndex && hoveredBar.inverterIndex === invIndex;
          const color = inverterColors[invIndex % inverterColors.length];

          // Draw bar with gradient
          const gradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
          if (isHovered) {
            // Lighter when hovered
            gradient.addColorStop(0, lightenColor(color, 20));
            gradient.addColorStop(1, color);
          } else {
            gradient.addColorStop(0, lightenColor(color, 10));
            gradient.addColorStop(1, color);
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          if (ctx.roundRect && barHeight > 0) {
            ctx.roundRect(barX, barY, individualBarWidth, barHeight, [8, 8, 0, 0]);
          } else if (barHeight > 0) {
            ctx.rect(barX, barY, individualBarWidth, barHeight);
          }
          ctx.fill();
        });
      } else {
        // Fallback: draw single bar if no inverter data
        const value = revenue[monthIndex] || 0;
        const barX = groupStartX + (groupWidth - individualBarWidth) / 2;
        const barHeight = value > 0 ? (value / maxValue) * chartHeight : 0;
        const barY = padding + chartHeight - barHeight;

        const isHovered = hoveredBar.monthIndex === monthIndex && hoveredBar.inverterIndex === null;
        const gradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
        if (isHovered) {
          gradient.addColorStop(0, '#818cf8');
          gradient.addColorStop(1, '#6366f1');
        } else {
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#4f46e5');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect && barHeight > 0) ctx.roundRect(barX, barY, individualBarWidth, barHeight, [8, 8, 0, 0]);
        else if (barHeight > 0) ctx.rect(barX, barY, individualBarWidth, barHeight);
        ctx.fill();
      }
    });

    // Draw month labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((month, i) => {
      const x = padding + barSpacing * i + barSpacing / 2;
      ctx.fillText(month, x, height - 20);
    });

    // Draw Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4);
    }
  }, [revenue, months, inverters, hoveredBar]);

  const handleMouseMove = (e) => {
    if (!revenue || !revenue.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate tooltip position with boundary checks
    const tooltipWidth = 300;
    const tooltipHeight = 100;
    let tooltipX = e.clientX + 10;
    let tooltipY = e.clientY - 40;

    // Prevent tooltip from going off right edge
    if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = e.clientX - tooltipWidth - 10;
    }

    // Prevent tooltip from going off top edge
    if (tooltipY < 10) {
      tooltipY = e.clientY + 20;
    }

    // Prevent tooltip from going off bottom edge
    if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = window.innerHeight - tooltipHeight - 10;
    }

    setMousePos({ x: tooltipX, y: tooltipY });

    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const barSpacing = chartWidth / months.length;

    // Find max inverters per month
    const maxInvertersPerMonth = Math.max(
      ...inverters.map(monthInverters => (monthInverters && monthInverters.length) || 0),
      1
    );
    const groupWidth = barSpacing * 0.7;
    const individualBarWidth = maxInvertersPerMonth > 1 
      ? (groupWidth / maxInvertersPerMonth) * 0.85
      : groupWidth * 0.6;

    // Find which specific inverter bar is being hovered
    let hoveredMonthIndex = null;
    let hoveredInverterIndex = null;

    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const groupStartX = padding + barSpacing * monthIndex + (barSpacing - groupWidth) / 2;
      
      if (x >= groupStartX && x <= groupStartX + groupWidth) {
        hoveredMonthIndex = monthIndex;
        const monthInverters = inverters[monthIndex] || [];
        
        if (monthInverters.length > 0) {
          // Check which specific inverter bar
          for (let invIndex = 0; invIndex < monthInverters.length; invIndex++) {
            const barX = groupStartX + (invIndex * (groupWidth / maxInvertersPerMonth));
            if (x >= barX && x <= barX + individualBarWidth) {
              hoveredInverterIndex = invIndex;
              break;
            }
          }
        } else {
          // Fallback: single bar
          hoveredInverterIndex = null;
        }
        break;
      }
    }

    setHoveredBar({ monthIndex: hoveredMonthIndex, inverterIndex: hoveredInverterIndex });
  };

  const handleMouseLeave = () => {
    setHoveredBar({ monthIndex: null, inverterIndex: null });
  };

  if (!revenue || !revenue.length) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>No revenue data available for this project.</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={320} 
        style={{ width: '100%', cursor: hoveredBar.monthIndex !== null ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredBar.monthIndex !== null && (
        (() => {
          const monthIndex = hoveredBar.monthIndex;
          const inverterIndex = hoveredBar.inverterIndex;
          const monthInverters = inverters[monthIndex] || [];
          
          // Show specific inverter if hovering a specific bar, otherwise show all inverters for that month
          const invertersToShow = inverterIndex !== null && monthInverters[inverterIndex]
            ? [monthInverters[inverterIndex]]
            : monthInverters;
          
          const hasData = inverterIndex !== null 
            ? (monthInverters[inverterIndex]?.totalKw > 0)
            : (revenue[monthIndex] > 0 || monthInverters.length > 0);

          if (!hasData) return null;

          return (
            <div
              style={{
                position: 'fixed',
                left: `${mousePos.x}px`,
                top: `${mousePos.y}px`,
                backgroundColor: '#1f2937',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                pointerEvents: 'none',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxWidth: '300px',
                minWidth: '200px',
              }}
            >
              {/* Date header */}
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                fontSize: '13px'
              }}>
                {months[monthIndex]}
              </div>
              
              {/* Show single inverter or all inverters */}
              {invertersToShow.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {invertersToShow.map((inv, idx) => {
                    const actualIndex = inverterIndex !== null ? inverterIndex : idx;
                    const color = inverterColors[actualIndex % inverterColors.length];
                    const inverterLabel = inv.inverterName || `Inverter ${inv.inverterId}`;
                    const serialText = inv.serialNumber ? ` (S: ${inv.serialNumber})` : '';
                    const fullLabel = `${inverterLabel}${serialText}`;
                    
                    return (
                      <div 
                        key={inv.inverterId || idx}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 0',
                          borderBottom: idx < invertersToShow.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{ 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            backgroundColor: color,
                            flexShrink: 0
                          }}></div>
                          <div style={{ 
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '500',
                            wordBreak: 'break-word'
                          }}>
                            {fullLabel}
                          </div>
                        </div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: color,
                          fontSize: '12px',
                          marginLeft: '8px',
                          whiteSpace: 'nowrap'
                        }}>
                          : {inv.totalKw?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kW
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>Generate: {revenue[monthIndex]?.toLocaleString()} kW</div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
};

const MonthlyChart = ({ revenue = [], months = [], inverters = [], summaryCards = [], loading = false }) => {
  const hasSummary = summaryCards && summaryCards.length;

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Monthly Revenue</h3>
        </div>
        <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>Loading monthly data...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Monthly Revenue</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
        </div>
      </div>
      <BarChartComponent revenue={revenue} months={months} inverters={inverters} />
    </div>
  );
};

export default MonthlyChart;
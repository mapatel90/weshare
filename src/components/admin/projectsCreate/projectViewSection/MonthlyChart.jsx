import React, { useEffect, useRef } from 'react';

const BarChartComponent = ({ revenue = [], months = [] }) => {
  const canvasRef = useRef(null);

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
    const barWidth = (chartWidth / labels.length) * 0.6;

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const maxValue = Math.max(...revenue);
    revenue.forEach((value, i) => {
      const x = padding + (chartWidth / labels.length) * i + ((chartWidth / labels.length - barWidth) / 2);
      const barHeight = (value / maxValue) * chartHeight;
      const y = padding + chartHeight - barHeight;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#4f46e5');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
      else ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((month, i) => {
      const x = padding + (chartWidth / labels.length) * i + (chartWidth / labels.length) / 2;
      ctx.fillText(month, x, height - 20);
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillText(Math.round(value / 1000) + 'K', padding - 10, y + 4);
    }
  }, [revenue, months]);

  if (!revenue || !revenue.length) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>No revenue data available for this project.</div>;
  }

  return <canvas ref={canvasRef} width={600} height={320} style={{ width: '100%' }} />;
};

const MonthlyChart = ({ revenue = [], months = [], summaryCards = [] }) => {
  const hasSummary = summaryCards && summaryCards.length;

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
      <BarChartComponent revenue={revenue} months={months} />
      {hasSummary ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {summaryCards.map((card) => (
            <div key={card.label} style={{ textAlign: 'center', padding: '12px', backgroundColor: card.bgColor, borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{card.label}</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: card.valueColor }}>{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MonthlyChart;
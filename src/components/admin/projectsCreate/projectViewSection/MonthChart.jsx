import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnergyChart = () => {
  // Generate data for 31 days
  const data = Array.from({ length: 31 }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return {
      day,
      yield: Math.random() * 100 + 50,
      exporting: Math.random() * 200 + 100,
      importing: Math.random() * 250 + 150,
      consumed: Math.random() * 350 + 200,
      fullLoadHours: Math.random() * 2 + 1.5,
      earning: Math.random() * 2 + 1.5
    };
  });

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
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              
              {/* Left Y-axis for K VND */}
              <YAxis 
                yAxisId="left"
                orientation="left"
                label={{ value: 'K VND', angle: 0, position: 'top', offset: 10, dx: -30 }}
                domain={[0, 425]}
                ticks={[0, 85, 170, 255, 340, 425]}
                stroke="#666"
              />
              
              {/* Middle Y-axis for kWh */}
              <YAxis 
                yAxisId="middle"
                orientation="left"
                label={{ value: 'kWh', angle: 0, position: 'top', offset: 10, dx: 90 }}
                domain={[0, 940]}
                ticks={[0, 188, 376, 564, 752, 940]}
                stroke="#666"
                dx={-40}
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
                yAxisId="right"
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
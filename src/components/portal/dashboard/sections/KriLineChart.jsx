import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const labels = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00'
];

const data = {
  labels,
  datasets: [
    {
      label: 'Solar KW Generated',
      data: [3, 6, 8, 12, 19, 15, 19, 20, 18, 22.5, 25, 20, 24, 21],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#2563eb',
      fill: true,
    },
    {
      label: 'Conjunction KW',
      data: [2, 1.6, 2.2, 1.9, 1.5, 1.9, 1.8, 5.3, 6.3, 8.2, 4.6, 3.7, 2.0, 1.8], // Example data
      borderColor: '#f59e42',
      backgroundColor: 'rgba(245,158,66,0.1)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#f59e42',
      fill: true,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time',
      },
    },
    y: {
      title: {
        display: true,
        text: 'KW Value',
      },
      beginAtZero: true,
    },
  },
};

export default function KriLineChart() {
  return <Line data={data} options={options} />;
}

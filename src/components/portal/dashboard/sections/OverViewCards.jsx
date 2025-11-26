import React from 'react';

export default function OverViewCards() {

    return (
        <div className="stats-grid">
            <div className="stat-card blue">
                <div className="stat-icon flex items-center gap-2">
                    <img
                        src="/images/icons/power.png"
                        alt="Power Icon"
                        className="w-8 h-6"
                    />
                    <span className="text-gray-800 font-medium">Power</span>
                </div>
                <div className="stat-value">52.4 W</div>
                <div className="stat-label">Capacity : 10kWp</div>
                {/*<div className="stat-change">↗ +4.2% vs yesterday</div> */}
            </div>

            <div className="stat-card purple ">
                <div className="stat-icon flex items-center gap-2">
                    <img
                        src="/images/icons/daily_yield.png"
                        alt="Daily Yield Icon"
                        className="w-8 h-6"
                    />
                    <span className="text-gray-800 font-medium">Daily Yield</span>
                </div>
                <div className="stat-value">40.7 kWh</div>
                <div className="stat-label">Today Earning : 0VND</div>
                {/*<div className="stat-change negative">↘ -1.7% vs yesterday</div> */}
            </div>

            <div className="stat-card cyan ">
                <div className="stat-icon flex items-center gap-2">
                    <img
                        src="/images/icons/monthly_yiled.png"
                        alt="Monthly Yield Icon"
                        className="w-8 h-6"
                    />
                    <span className="text-gray-800 font-medium">Monthly Yield</span>
                </div>
                <div className="stat-value">36.8 kWh</div>
                <div className="stat-label">Monthly Earning : 0VND</div>
            </div>

            <div className="stat-card green">
                <div className="stat-icon flex items-center gap-2">
                    <img
                        src="/images/icons/total_yield.png"
                        alt="Total Yield Icon"
                        className="w-8 h-6"
                    />
                    <span className="text-gray-800 font-medium">Total Yield</span>
                </div>
                <div className="stat-value">3,124 kWh</div>
                <div className="stat-label">Total Earning : 0VND</div>
            </div>
        </div>
    );

}
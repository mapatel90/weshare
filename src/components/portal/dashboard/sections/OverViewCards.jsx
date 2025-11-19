import React from 'react';

export default function OverViewCards() {

    return (
        <div className="stats-grid">
            <div className="stat-card blue">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">52.4 kWh</div>
                <div className="stat-label">Daily Generation</div>
                <div className="stat-change">↗ +4.2% vs yesterday</div>
            </div>

            <div className="stat-card purple">
                <div className="stat-icon">🏠</div>
                <div className="stat-value">40.7 kWh</div>
                <div className="stat-label">Daily Consumption</div>
                <div className="stat-change negative">↘ -1.7% vs yesterday</div>
            </div>

            <div className="stat-card cyan">
                <div className="stat-icon">💰</div>
                <div className="stat-value">36.8 %</div>
                <div className="stat-label">Savings vs EVN</div>
                <div className="stat-change">📈 Improving efficiency</div>
            </div>

            <div className="stat-card green">
                <div className="stat-icon">💵</div>
                <div className="stat-value">đ3,124 K</div>
                <div className="stat-label">Solar Savings</div>
                <div className="stat-change">🔄 Updated daily</div>
            </div>
        </div>
    );

}
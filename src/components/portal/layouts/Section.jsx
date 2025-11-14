import React from "react";
import PropTypes from "prop-types";

/**
 * Summary stats grid for portal layout.
 * - Converts static HTML to a reusable React component
 * - Uses className (React) instead of class
 * - Accepts `stats` prop; falls back to sensible defaults
 */
const SectionStats = ({ stats }) => {
    const items = stats && stats.length ? stats : [
        { id: "gen", color: "blue", icon: "⚡", value: "52.4 kWh", label: "Daily Generation", change: "↗ +4.2% vs yesterday", changeType: "positive" },
        { id: "cons", color: "purple", icon: "🏠", value: "40.7 kWh", label: "Daily Consumption", change: "↘ -1.7% vs yesterday", changeType: "negative" },
        { id: "savPct", color: "cyan", icon: "💰", value: "36.8 %", label: "Savings vs EVN", change: "📈 Improving efficiency", changeType: "neutral" },
        { id: "savVal", color: "green", icon: "💵", value: "đ3,124 K", label: "Solar Savings", change: "🔄 Updated daily", changeType: "neutral" },
    ];

    return (
        <section className="stats-grid" aria-label="summary statistics">
            {items.map(item => (
                <div
                    key={item.id}
                    className={`stat-card ${item.color}`}
                    role="group"
                    aria-labelledby={`stat-${item.id}-label`}
                >
                    <div className="stat-icon" aria-hidden="true">{item.icon}</div>
                    <div className="stat-value" id={`stat-${item.id}-value`}>{item.value}</div>
                    <div className="stat-label" id={`stat-${item.id}-label`}>{item.label}</div>
                    <div className={`stat-change${item.changeType === "negative" ? " negative" : ""}`}>
                        {item.change}
                    </div>
                </div>
            ))}
        </section>
    );
};

SectionStats.propTypes = {
    stats: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            color: PropTypes.string,
            icon: PropTypes.string,
            value: PropTypes.string,
            label: PropTypes.string,
            change: PropTypes.string,
            changeType: PropTypes.oneOf(["positive", "negative", "neutral"]),
        })
    ),
};

export default SectionStats;
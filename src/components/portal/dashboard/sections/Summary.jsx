import React from "react";

const baseCardStyle = {
	display: "flex",
	flexDirection: "column",
	gap: "12px",
	padding: "20px",
	backgroundColor: "#fff",
	borderRadius: "8px",
	border: "1px solid #e5e7eb",
	boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
	transition: "all 0.3s ease",
};

const labelStyle = {
	fontSize: "12px",
	color: "#6b7280",
	fontWeight: 600,
	textTransform: "uppercase",
	letterSpacing: "0.5px",
};

const descriptionStyle = {
	fontSize: "12px",
	color: "#9ca3af",
	fontWeight: 500,
};

const numberStyle = {
	fontSize: "32px",
	fontWeight: "700",
	lineHeight: 1,
};

const formatNumber = (value) => {
	if (value === null || value === undefined) return "0";
	const num = Number(value);
	if (Number.isNaN(num)) return "0";
	return num.toLocaleString("en-IN");
};

const createHoverHandlers = (color) => ({
	onMouseEnter: (e) => {
		e.currentTarget.style.boxShadow = `0 8px 16px ${color}`;
		e.currentTarget.style.transform = "translateY(-2px)";
	},
	onMouseLeave: (e) => {
		e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
		e.currentTarget.style.transform = "translateY(0)";
	},
});

function Summary({
	lang,
	totalProjects = 0,
	runningProjects = 0,
	payoutTotal = 0,
	totalContracts = 0,
	contractStatuses = { accepted: 0, rejected: 0, cancelled: 0 },
	summaryLoading = false,
	showRunningProjects = false,
	payoutLabel,
	payoutDescription,
	projectsDescription,
}) {
	const cards = [
		{
			key: "total-projects",
			label: lang?.("dashboard.totalProjects", "Total Projects") ?? "Total Projects",
			value: summaryLoading ? "—" : formatNumber(totalProjects),
			description: projectsDescription || "All your investments",
			color: "#4f46e5",
            textColor: "#1f2937",
			hoverShadow: "rgba(79, 70, 229, 0.12)",
			emoji: "📊",
		},
		showRunningProjects
			? {
					key: "running-projects",
					label: lang?.("dashboard.running_projects", "Running Projects") ?? "Running Projects",
					value: summaryLoading ? "—" : formatNumber(runningProjects),
					description: lang?.("dashboard.active_and_generating_energy", "Active & generating energy") ?? "Active & generating energy",
					color: "#777b86",
                    textColor: "#1f2937",
					hoverShadow: "rgba(34, 197, 94, 0.12)",
					emoji: "⚡",
				}
			: null,
		{
			key: "payout-total",
			label:
				payoutLabel ||
				(lang?.("dashboard.payout_total", "Payout Total") ?? "Payout Total"),
			value: summaryLoading ? "—" : `₫${formatNumber(payoutTotal)}`,
			description: payoutDescription || "Total earnings received",
			color: "#d906a4",
            textColor: "#1f2937",
			hoverShadow: "rgba(217, 119, 6, 0.12)",
			emoji: "💰",
		},
		{
			key: "total-contracts",
			label: lang?.("dashboard.total_contracts", "Total Contracts") ?? "Total Contracts",
			value: summaryLoading ? "—" : formatNumber(totalContracts),
			description: summaryLoading ? "Agreement documents" : `${lang?.("common.approved", "Accepted") ?? "Accepted"}: ${formatNumber(contractStatuses?.accepted ?? 0)} • ${lang?.("common.rejected", "Rejected") ?? "Rejected"}: ${formatNumber(contractStatuses?.rejected ?? 0)} • ${lang?.("common.cancelled", "Cancelled") ?? "Cancelled"}: ${formatNumber(contractStatuses?.cancelled ?? 0)}`,
			color: "#a855f7",
            textColor: "#1f2937",
			hoverShadow: "rgba(168, 85, 247, 0.12)",
			emoji: "📜",
		},
	].filter(Boolean);

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				gap: "20px",
				marginBottom: "32px",
                marginTop: "20px",
			}}
		>
			{cards.map((card) => {
				const hoverHandlers = createHoverHandlers(card.hoverShadow);
				return (
					<div
						key={card.key}
						style={{
							...baseCardStyle,
							borderLeft: `4px solid ${card.color}`,
						}}
						onMouseEnter={hoverHandlers.onMouseEnter}
						onMouseLeave={hoverHandlers.onMouseLeave}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<span style={labelStyle}>{card.label}</span>
							<span style={{ fontSize: "20px" }}>{card.emoji}</span>
						</div>
						<div style={{ ...numberStyle, color: card.textColor }}>{card.value}</div>
						<div style={descriptionStyle}>{card.description}</div>
					</div>
				);
			})}
		</div>
	);
}

export default Summary;

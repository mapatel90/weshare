import React, { useMemo } from "react";
import {
	Box,
	TextField,
	IconButton,
	Typography,
} from "@mui/material";
import { FiTrash2 } from "react-icons/fi";

const InvoiceItem = ({ index, item, onChange, onRemove, isDark = false, priceWithCurrency, lang }) => {
	
	const amount = useMemo(() => {
		const qty = Number(item.unit) || 0;
		const rate = Number(item.price) || 0;
		return qty * rate;
	}, [item.unit, item.price]);

	const handleField = (field) => (e) => {
		onChange(index, field, e.target.value);
	};

	const mobileLabelSx = {
		display: { xs: "block", md: "none" },
		mb: 0.5,
		fontSize: "12px",
		fontWeight: 600,
		color: isDark ? "#94a3b8" : "#64748b",
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: {
					xs: "1fr",
					sm: "1fr 1fr",
					md: "1.2fr 1.2fr 0.5fr 0.6fr 0.4fr 0.3fr",
				},
				gap: { xs: 1.25, md: 1 },
				alignItems: "stretch",
				p: 2,
				mb: { xs: 1.5, md: 0 },
				borderBottom: {
					xs: "none",
					md: isDark ? "1px solid #374151" : "1px solid #e2e8f0",
				},
				border: {
					xs: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
					md: "none",
				},
				borderRadius: { xs: "10px", md: 0 },
				backgroundColor: isDark ? "#1f2937" : "#fff",
				"&:hover": { backgroundColor: isDark ? "#374151" : "#f8fafc" },
				transition: "background-color 0.2s ease"
			}}
		>
			<Box>
				<Typography sx={mobileLabelSx}>{lang("invoice.items") || "Item"}</Typography>
				<TextField
					placeholder={lang("invoice.items", "Item name")}
					value={item.item}
					onChange={handleField("item")}
					multiline
					minRows={2}
					size="small"
					sx={{
						"& .MuiOutlinedInput-root": {
							backgroundColor: isDark ? "#374151" : "#fff",
							color: isDark ? "#1f2937" : "inherit",
							borderRadius: "6px",
							fontSize: "14px",
							"& fieldset": { borderColor: isDark ? "#4b5563" : "#e2e8f0" },
							"&:hover fieldset": { borderColor: isDark ? "#6b7280" : "#cbd5e1" },
							"&.Mui-focused fieldset": { borderColor: "#2563eb" }
						},
						"& .MuiInputBase-input::placeholder": {
							color: isDark ? "#9ca3af" : "inherit",
							opacity: 1
						}
					}}
				/>
			</Box>

			<Box>
				<Typography sx={mobileLabelSx}>{lang("common.description") || "Description"}</Typography>
				<TextField
					placeholder={lang("common.description") || "Description"}
					value={item.description}
					onChange={handleField("description")}
					multiline
					minRows={2}
					size="small"
					sx={{
						"& .MuiOutlinedInput-root": {
							backgroundColor: isDark ? "#374151" : "#fff",
							color: isDark ? "#1f2937" : "inherit",
							borderRadius: "6px",
							fontSize: "14px",
							"& fieldset": { borderColor: isDark ? "#4b5563" : "#e2e8f0" },
							"&:hover fieldset": { borderColor: isDark ? "#6b7280" : "#cbd5e1" },
							"&.Mui-focused fieldset": { borderColor: "#2563eb" }
						},
						"& .MuiInputBase-input::placeholder": {
							color: isDark ? "#9ca3af" : "inherit",
							opacity: 1
						}
					}}
				/>
			</Box>

			<Box>
				<Typography sx={mobileLabelSx}>{lang("invoice.quantity") || "Qty"}</Typography>
				<TextField
					type="number"
					inputProps={{ min: 0, step: "any" }}
					value={item.unit}
					onChange={handleField("unit")}
					size="small"
					sx={{
						"& .MuiOutlinedInput-root": {
							backgroundColor: isDark ? "#374151" : "#fff",
							color: isDark ? "#1f2937" : "inherit",
							borderRadius: "6px",
							fontSize: "14px",
							"& fieldset": { borderColor: isDark ? "#4b5563" : "#e2e8f0" },
							"&:hover fieldset": { borderColor: isDark ? "#6b7280" : "#cbd5e1" },
							"&.Mui-focused fieldset": { borderColor: "#2563eb" }
						}
					}}
				/>
			</Box>

			<Box>
				<Typography sx={mobileLabelSx}>{lang("common.rate") || "Rate"}</Typography>
				<TextField
					placeholder="0"
					type="number"
					inputProps={{ min: 0, step: "any" }}
					value={item.price}
					onChange={handleField("price")}
					size="small"
					sx={{
						"& .MuiOutlinedInput-root": {
							backgroundColor: isDark ? "#374151" : "#fff",
							color: isDark ? "#1f2937" : "inherit",
							borderRadius: "6px",
							fontSize: "14px",
							"& fieldset": { borderColor: isDark ? "#4b5563" : "#e2e8f0" },
							"&:hover fieldset": { borderColor: isDark ? "#6b7280" : "#cbd5e1" },
							"&.Mui-focused fieldset": { borderColor: "#2563eb" }
						},
						"& .MuiInputBase-input::placeholder": {
							color: isDark ? "#9ca3af" : "inherit",
							opacity: 1
						}
					}}
				/>
			</Box>

			<Box sx={{ gridColumn: { xs: "auto", md: "auto" } }}>
				<Typography sx={mobileLabelSx}>{lang("invoice.amount") || "Amount"}</Typography>
				<TextField
					value={priceWithCurrency(amount.toFixed(2))}
					size="small"
					fullWidth
					InputProps={{ readOnly: true }}
					sx={{
						"& .MuiOutlinedInput-root": {
							backgroundColor: isDark ? "#1e293b" : "#f8fafc",
							color: isDark ? "#93c5fd" : "#2563eb",
							borderRadius: "6px",
							fontSize: "14px",
							fontWeight: "600",
							"& fieldset": { borderColor: isDark ? "#334155" : "#e2e8f0" },
							"&:hover fieldset": { borderColor: isDark ? "#475569" : "#cbd5e1" },
							"&.Mui-focused fieldset": { borderColor: "#2563eb" }
						},
						"& .MuiInputBase-input": {
							textAlign: "right",
						}
					}}
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: { xs: "flex-end", md: "center" },
				}}
			>
				<IconButton 
					color="error" 
					onClick={() => onRemove(index)} 
					size="small"
					sx={{
						color: "#ef4444",
						"&:hover": { backgroundColor: isDark ? "#7f1d1d" : "#fee2e2" }
					}}
				>
					<FiTrash2 size={18} />
				</IconButton>
			</Box>
		</Box>
	);
};

export default InvoiceItem;

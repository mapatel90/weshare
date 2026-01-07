import React, { useMemo } from "react";
import {
	Box,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	IconButton,
	useTheme,
} from "@mui/material";
import { FiTrash2 } from "react-icons/fi";

const InvoiceItem = ({ index, item, onChange, onRemove, isDark = false }) => {
	
	const amount = useMemo(() => {
		const qty = Number(item.unit) || 0;
		const rate = Number(item.price) || 0;
		return qty * rate;
	}, [item.unit, item.price]);

	const handleField = (field) => (e) => {
		onChange(index, field, e.target.value);
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "1.2fr 1.2fr 0.5fr 0.6fr 0.4fr 0.3fr",
				gap: 1,
				alignItems: "stretch",
				p: 2,
				borderBottom: isDark ? "1px solid #374151" : "1px solid #e2e8f0",
				backgroundColor: isDark ? "#1f2937" : "#fff",
				"&:hover": { backgroundColor: isDark ? "#374151" : "#f8fafc" },
				transition: "background-color 0.2s ease"
			}}
		>
			<TextField
				placeholder="Item name"
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

			<TextField
				placeholder="Item description"
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

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					fontWeight: "700",
					px: 2,
					backgroundColor: isDark ? "#1e3a5f" : "#f0f9ff",
					borderRadius: "6px",
					color: isDark ? "#93c5fd" : "#2563eb",
					fontSize: "14px",
					border: isDark ? "1px solid #1e40af" : "1px solid #bfdbfe"
				}}
			>
				{amount.toFixed(2)}
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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

import React, { useMemo } from "react";
import {
	Box,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	IconButton,
} from "@mui/material";
import { FiTrash2 } from "react-icons/fi";

const InvoiceItem = ({ index, item, onChange, onRemove }) => {
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
				borderBottom: "1px solid #e2e8f0",
				backgroundColor: "#fff",
				"&:hover": { backgroundColor: "#f8fafc" },
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
						backgroundColor: "#fff",
						borderRadius: "6px",
						fontSize: "14px",
						"& fieldset": { borderColor: "#e2e8f0" },
						"&:hover fieldset": { borderColor: "#cbd5e1" },
						"&.Mui-focused fieldset": { borderColor: "#2563eb" }
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
						backgroundColor: "#fff",
						borderRadius: "6px",
						fontSize: "14px",
						"& fieldset": { borderColor: "#e2e8f0" },
						"&:hover fieldset": { borderColor: "#cbd5e1" },
						"&.Mui-focused fieldset": { borderColor: "#2563eb" }
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
						backgroundColor: "#fff",
						borderRadius: "6px",
						fontSize: "14px",
						"& fieldset": { borderColor: "#e2e8f0" },
						"&:hover fieldset": { borderColor: "#cbd5e1" },
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
						backgroundColor: "#fff",
						borderRadius: "6px",
						fontSize: "14px",
						"& fieldset": { borderColor: "#e2e8f0" },
						"&:hover fieldset": { borderColor: "#cbd5e1" },
						"&.Mui-focused fieldset": { borderColor: "#2563eb" }
					}
				}}
			/>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					fontWeight: "700",
					px: 2,
					backgroundColor: "#f0f9ff",
					borderRadius: "6px",
					color: "#2563eb",
					fontSize: "14px",
					border: "1px solid #bfdbfe"
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
						"&:hover": { backgroundColor: "#fee2e2" }
					}}
				>
					<FiTrash2 size={18} />
				</IconButton>
			</Box>
		</Box>
	);
};

export default InvoiceItem;

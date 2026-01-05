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
				p: 1,
				borderBottom: "1px solid #eef0f2",
			}}
		>
			<TextField
				placeholder="Description"
				value={item.item}
				onChange={handleField("item")}
				multiline
				minRows={2}
				size="small"
			/>

			<TextField
				placeholder="Long description"
				value={item.description}
				onChange={handleField("description")}
				multiline
				minRows={2}
				size="small"
			/>

			<TextField
				type="number"
				inputProps={{ min: 0, step: "any" }}
				value={item.unit}
				onChange={handleField("unit")}
				size="small"
			/>

			<TextField
				placeholder="Rate"
				type="number"
				inputProps={{ min: 0, step: "any" }}
				value={item.price}
				onChange={handleField("price")}
				size="small"
			/>

			{/* <FormControl size="small">
				<InputLabel>Tax</InputLabel>
				<Select
					label="Tax"
					value={item.tax || "no-tax"}
					onChange={handleField("tax")}
				>
					<MenuItem value="no-tax">No Tax</MenuItem>
					<MenuItem value="vat-5">VAT 5%</MenuItem>
					<MenuItem value="vat-10">VAT 10%</MenuItem>
				</Select>
			</FormControl> */}

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					fontWeight: 600,
					px: 1,
					backgroundColor: "#f9fafb",
					borderRadius: 1,
				}}
			>
				{amount.toFixed(2)}
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
				<IconButton color="error" onClick={() => onRemove(index)} size="small">
					<FiTrash2 />
				</IconButton>
			</Box>
		</Box>
	);
};

export default InvoiceItem;

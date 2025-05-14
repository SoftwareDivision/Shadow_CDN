'use client';

import React, { useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { Box, IconButton, Tooltip, Button } from '@mui/material';
import { Download as DownloadIcon, PictureAsPdfOutlined } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DataTableMRT({ data, columns }) {
	const [rowSelection, setRowSelection] = useState({});
	const [columnVisibility, setColumnVisibility] = useState({});
	const [globalFilter, setGlobalFilter] = useState('');

	// Column definitions (adjust if needed)
	const tableColumns = useMemo(() => columns, [columns]);

	// Export to Excel
	const exportToExcel = () => {
		const visibleColumns = tableColumns.filter((col) => columnVisibility[col.accessorKey] !== false);
		const headers = visibleColumns.map((col) => col.header);
		const rows = data.map((row) =>
			visibleColumns.map((col) => {
				const value = row[col.accessorKey];
				return Array.isArray(value) ? value.length : value || '';
			}),
		);

		const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
		XLSX.writeFile(workbook, 'table_data.xlsx');
	};

	// Export to PDF
	const exportToPDF = () => {
		const doc = new jsPDF();
		const visibleColumns = tableColumns.filter((col) => columnVisibility[col.accessorKey] !== false);
		const headers = visibleColumns.map((col) => col.header);
		const rows = data.map((row) =>
			visibleColumns.map((col) => {
				const value = row[col.accessorKey];
				return Array.isArray(value) ? value.length : value || '';
			}),
		);
		autoTable(doc, {
			head: [headers],
			body: rows,
			startY: 10,
			theme: 'grid',
			headStyles: { fillColor: [100, 100, 100] },
		});
		doc.save('table_data.pdf');
	};

	return (
		<MaterialReactTable
			columns={tableColumns}
			data={data}
			enableColumnOrdering
			enableRowSelection
			enableColumnActions
			enableGlobalFilter
			enablePagination
			enableSorting
			enableGrouping
			positionToolbarAlertBanner="top"
			initialState={{
				density: 'compact',
				paginationSize: 10,
			}}
			state={{
				globalFilter,
				rowSelection,
			}}
			onGlobalFilterChange={setGlobalFilter}
			onColumnVisibilityChange={setColumnVisibility}
			onRowSelectionChange={setRowSelection}
			renderTopToolbarCustomActions={() => (
				<Box sx={{ display: 'flex', gap: '0.5rem' }}>
					<Button
						onClick={exportToPDF}
						variant="outlined"
						size="small"
						startIcon={<PictureAsPdfOutlined />}
						color="error"
					>
						PDF
					</Button>
					<Button onClick={exportToExcel} variant="outlined" size="small" startIcon={<DownloadIcon />}>
						Excel
					</Button>
				</Box>
			)}
		/>
	);
}

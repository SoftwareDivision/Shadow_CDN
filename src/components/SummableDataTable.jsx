'use client';

import React, { useEffect, useMemo, useState, useId } from 'react';
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	ChevronsLeftIcon,
	ChevronsRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ColumnsIcon,
	DownloadIcon,
	SearchIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	ChevronDownIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

function DraggableRow({ row }) {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: row.original.id,
	});

	return (
		<TableRow
			data-state={row.getIsSelected() && 'selected'}
			data-dragging={isDragging}
			ref={setNodeRef}
			className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
			))}
		</TableRow>
	);
}

export default function SummableDataTable({
	data: initialData,
	columns,
	fileName = 'table_data',
	showExportButtons = true,
}) {
	const [data, setData] = useState(initialData);
	const [rowSelection, setRowSelection] = useState({});
	const [columnFilters, setColumnFilters] = useState([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [columnVisibility, setColumnVisibility] = useState({});
	const [grouping, setGrouping] = useState([]);
	const [sorting, setSorting] = useState([]);
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	useEffect(() => setData(initialData), [initialData]);

	const sortableId = useId();
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

	const dataIds = useMemo(() => data.map(({ id }) => id?.toString()), [data]);

	function handleDragEnd(event) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			setData((items) => {
				const oldIndex = items.findIndex((item) => item.id.toString() === active.id);
				const newIndex = items.findIndex((item) => item.id.toString() === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	}

	const tableColumns = useMemo(
		() => [
			{
				id: 'srno',
				header: '#',
				cell: ({ row }) => row.index + 1,
				enableSorting: false,
				enableHiding: false,
				size: 50,
			},
			...columns,
		],
		[columns],
	);

	const table = useReactTable({
		data,
		columns: tableColumns,
		state: { sorting, rowSelection, columnFilters, globalFilter, pagination, grouping, columnVisibility },
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onGroupingChange: setGrouping,
		onColumnVisibilityChange: setColumnVisibility,
		getRowId: (row) => row.id?.toString(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		initialState: {
			sorting: [{ id: 'srno', desc: false }],
		},
	});

	// 🔢 Sum calculation for summable columns
	const calculateColumnSum = (columnId) => {
		return table.getRowModel().rows.reduce((sum, row) => {
			const value = row.getValue(columnId);
			const num = typeof value === 'number' ? value : parseFloat(value);
			return sum + (isNaN(num) ? 0 : num);
		}, 0);
	};

	// 📤 Export to PDF
	const exportToPDF = () => {
		const doc = new jsPDF();

		// Get table headers and data
		const tableHeaders = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))
			.map((col) => (typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id));

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.map((header, index) => {
				const colId = table
					.getAllColumns()
					.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))[index].id;
				const v = row.original[colId];
				return Array.isArray(v) ? v.length : v || '';
			}),
		);

		// Prepare data for autoTable with proper styling
		const headerStyles = {
			fillColor: [64, 64, 64],
			textColor: 255,
			fontSize: 10,
			cellPadding: 4,
			fontStyle: 'bold',
		};

		const bodyStyles = {
			fontSize: 9,
			cellPadding: 3,
		};

		// Add title
		const exportFileName = fileName && fileName.trim() !== '' ? fileName : 'Table Report';
		doc.setFontSize(16);
		doc.setFont(undefined, 'bold');
		doc.text(exportFileName, 14, 20);

		// Add date
		const dateStr = new Date().toLocaleDateString('en-GB');
		doc.setFontSize(10);
		doc.setFont(undefined, 'normal');
		doc.text(`Exported on: ${dateStr}`, 14, 30);

		// Create the table
		autoTable(doc, {
			head: [tableHeaders],
			body: tableRows,
			startY: 40,
			styles: { cellPadding: 2, fontSize: 8 },
			headStyles: headerStyles,
			bodyStyles: bodyStyles,
			alternateRowStyles: { fillColor: [240, 240, 240] },
			didDrawCell: (data) => {
				// Add borders to all cells
				doc.setDrawColor(0);
				doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
			},
		});

		// Add sum row if there are summable columns
		// Get visible columns first
		const visibleColumns = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id));

		// Find summable columns among visible ones
		const summableColumns = visibleColumns.filter((col) => col.columnDef?.meta?.isSummable);

		if (summableColumns.length > 0) {
			const sumRow = new Array(tableHeaders.length).fill('');
			sumRow[0] = 'Total';

			summableColumns.forEach((col) => {
				const sum = calculateColumnSum(col.id);
				// Find the correct index in the visible columns
				const visibleIndex = visibleColumns.findIndex((c) => c.id === col.id);
				if (visibleIndex >= 0) {
					sumRow[visibleIndex] = sum;
				}
			});

			// Add sum row to the table
			autoTable(doc, {
				body: [sumRow],
				startY: doc.lastAutoTable.finalY + 2,
				styles: { cellPadding: 2, fontSize: 8, fontStyle: 'bold' },
				headStyles: { fillColor: [64, 64, 64], textColor: 255 },
				bodyStyles: { fillColor: [200, 200, 200] },
				didDrawCell: (data) => {
					// Add borders to all cells
					doc.setDrawColor(0);
					doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
				},
			});
		}

		// Save the PDF
		const finalFileName = fileName && fileName.trim() !== '' ? fileName : 'table_data';
		doc.save(`${finalFileName}.pdf`);
	};

	// 📤 Export to Excel
	const exportToExcel = () => {
		const tableHeaders = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))
			.map((col) => col.id);

		const headerNames = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))
			.map((col) => (typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id));

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.map((header) => {
				const v = row.original[header];
				return Array.isArray(v) ? v.length : v || '';
			}),
		);

		// Create workbook and worksheet
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([headerNames, ...tableRows]);

		// Get the worksheet range
		const range = XLSX.utils.decode_range(ws['!ref']);

		// Define border style object (define once to avoid repetition)
		const borderStyle = {
			top: { style: 'thin', color: { rgb: '000000' } },
			bottom: { style: 'thin', color: { rgb: '000000' } },
			left: { style: 'thin', color: { rgb: '000000' } },
			right: { style: 'thin', color: { rgb: '000000' } },
		};

		// Define header style
		const headerStyle = {
			fill: { fgColor: { rgb: 'CCCCCC' } },
			font: { bold: true },
			border: borderStyle,
		};

		// Apply borders to all cells
		for (let row = range.s.r; row <= range.e.r; row++) {
			for (let col = range.s.c; col <= range.e.c; col++) {
				const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
				if (!ws[cellAddress]) {
					// Create empty cell if it doesn't exist
					ws[cellAddress] = { v: '', t: 's' };
				}

				// Initialize style object if it doesn't exist
				if (!ws[cellAddress].s) {
					ws[cellAddress].s = {};
				}

				// Apply border to all cells
				ws[cellAddress].s.border = borderStyle;

				// Apply header style to first row
				if (row === 0) {
					ws[cellAddress].s.fill = headerStyle.fill;
					ws[cellAddress].s.font = headerStyle.font;
				}
			}
		}

		// Add sum row if there are summable columns
		const visibleColumns = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id));

		const summableColumns = visibleColumns.filter((col) => col.columnDef?.meta?.isSummable);

		if (summableColumns.length > 0) {
			const sumRow = new Array(headerNames.length).fill('');
			sumRow[0] = 'Total';

			summableColumns.forEach((col) => {
				const sum = calculateColumnSum(col.id);
				const visibleIndex = visibleColumns.findIndex((c) => c.id === col.id);
				if (visibleIndex >= 0) {
					sumRow[visibleIndex] = sum;
				}
			});

			// Add sum row to worksheet
			XLSX.utils.sheet_add_aoa(ws, [sumRow], { origin: -1 });

			// Update range to include the sum row
			const updatedRange = XLSX.utils.decode_range(ws['!ref']);

			// Style the sum row
			const sumRowIndex = updatedRange.e.r;
			const sumRowStyle = {
				font: { bold: true },
				fill: { fgColor: { rgb: 'EEEEEE' } },
				border: borderStyle,
			};

			for (let col = updatedRange.s.c; col <= updatedRange.e.c; col++) {
				const cellAddress = XLSX.utils.encode_cell({ r: sumRowIndex, c: col });
				if (!ws[cellAddress]) {
					ws[cellAddress] = { v: '', t: 's' };
				}
				if (!ws[cellAddress].s) {
					ws[cellAddress].s = {};
				}
				ws[cellAddress].s.font = sumRowStyle.font;
				ws[cellAddress].s.fill = sumRowStyle.fill;
				ws[cellAddress].s.border = sumRowStyle.border;
			}
		}

		// Set column widths
		const colWidths = headerNames.map((name, index) => {
			const maxWidth = Math.max(name.length, ...tableRows.map((row) => String(row[index] || '').length));
			return { wch: Math.min(Math.max(maxWidth, 10), 50) };
		});
		ws['!cols'] = colWidths;

		// Add worksheet to workbook
		const exportFileName = fileName && fileName.trim() !== '' ? fileName : 'table_data';
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
		XLSX.writeFile(wb, `${exportFileName}.xlsx`);
	};

	return (
		<div className="flex w-full flex-col gap-4">
			{/* Toolbar Section */}
			<div className="flex flex-col gap-4 md:flex-row md:justify-between">
				{showExportButtons && (
					<div className="flex gap-2">
						<Button onClick={exportToPDF} variant="outline" size="sm">
							<DownloadIcon className="mr-2 h-4 w-4" />
							Export PDF
						</Button>
						<Button onClick={exportToExcel} variant="outline" size="sm">
							<DownloadIcon className="mr-2 h-4 w-4" />
							Export Excel
						</Button>
					</div>
				)}
				<div className="flex items-center gap-2">
					<Input
						placeholder="Search..."
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className="pl-10 w-64"
					/>
					<SearchIcon className="absolute ml-3 h-4 w-4 text-muted-foreground" />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<ColumnsIcon className="h-4 w-4 mr-1" />
								Customize Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter((col) => typeof col.accessorFn !== 'undefined' && col.getCanHide())
								.map((col) => (
									<DropdownMenuCheckboxItem
										key={col.id}
										checked={col.getIsVisible()}
										onCheckedChange={(value) => col.toggleVisibility(!!value)}
										className="capitalize"
									>
										{typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Table Section */}
			<div className="overflow-auto border rounded-xl">
				<DndContext
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={handleDragEnd}
					sensors={sensors}
					id={sortableId}
				>
					<Table>
						<TableHeader className="bg-muted">
							{table.getHeaderGroups().map((group) => (
								<TableRow key={group.id}>
									{group.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<div
													className="flex items-center gap-2 cursor-pointer select-none font-semibold"
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(header.column.columnDef.header, header.getContext())}
													{header.column.getCanSort() && (
														<>
															{header.column.getIsSorted() === 'asc' ? (
																<ArrowUpIcon className="h-4 w-4" />
															) : null}
															{header.column.getIsSorted() === 'desc' ? (
																<ArrowDownIcon className="h-4 w-4" />
															) : null}
														</>
													)}
												</div>
											)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>

						<TableBody>
							{table.getRowModel().rows?.length > 0 ? (
								<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
									{table.getRowModel().rows.map((row) => (
										<DraggableRow key={row.id} row={row} />
									))}
								</SortableContext>
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center py-6">
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						{/* Footer Sums */}
						<TableFooter>
							{table.getFooterGroups().map((group) => (
								<TableRow key={group.id}>
									{group.headers.map((header, index) => {
										const isSummable = header.column.columnDef?.meta?.isSummable;
										return (
											<TableCell key={header.id}>
												{index === 0
													? 'Total'
													: isSummable
													? calculateColumnSum(header.column.id)
													: ''}
											</TableCell>
										);
									})}
								</TableRow>
							))}
						</TableFooter>
					</Table>
				</DndContext>
			</div>

			{/* Pagination Section */}
			<div className="flex justify-between items-center px-4">
				<div className="hidden lg:block text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{' '}
					row(s) selected.
				</div>
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<Label>Rows per page</Label>
						<Select
							value={String(table.getState().pagination.pageSize)}
							onValueChange={(value) => table.setPageSize(Number(value))}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 20, 30, 50, 100].map((s) => (
									<SelectItem key={s} value={String(s)}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
					</div>
					<div className="flex items-center gap-2">
						<Button
							size="icon"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<ChevronsLeftIcon />
						</Button>
						<Button size="icon" onClick={table.previousPage} disabled={!table.getCanPreviousPage()}>
							<ChevronLeftIcon />
						</Button>
						<Button size="icon" onClick={table.nextPage} disabled={!table.getCanNextPage()}>
							<ChevronRightIcon />
						</Button>
						<Button
							size="icon"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<ChevronsRightIcon />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

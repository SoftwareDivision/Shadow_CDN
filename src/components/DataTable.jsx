'use client';

import * as React from 'react';
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
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	ColumnsIcon,
	DownloadIcon,
	SearchIcon,
} from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
			}}
		>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
			))}
		</TableRow>
	);
}

export default function DataTable({ data: initialData, columns }) {
	// Add state for table data
	const [data, setData] = React.useState(initialData);

	// Update data when initialData changes
	React.useEffect(() => {
		setData(initialData);
	}, [initialData]);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState({});
	const [grouping, setGrouping] = React.useState([]);
	const [columnFilters, setColumnFilters] = React.useState([]);
	const [sorting, setSorting] = React.useState([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [globalFilter, setGlobalFilter] = React.useState('');
	const sortableId = React.useId();
	const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}));

	const dataIds = React.useMemo(() => data.map(({ id }) => id?.toString()) || [], [data]);

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

	const tableColumns = React.useMemo(
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
		data, // Use the state data instead of initialData
		columns: tableColumns, // Use the modified columns array
		state: {
			sorting,
			rowSelection,
			columnFilters,
			globalFilter,
			pagination,
			grouping,
		},
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		getRowId: (row) => row.id?.toString(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onGroupingChange: setGrouping,
		getGroupedRowModel: getGroupedRowModel(),
		getGlobalRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		initialState: {
			sorting: [{ id: 'srno', desc: false }], // Add default sorting by serial number
		},
	});

	// Export to PDF
	const exportToPDF = () => {
		const doc = new jsPDF();
		const tableHeaders = table
			.getAllColumns()
			.filter(
				(column) =>
					column.getIsVisible() &&
					column.id !== 'drag' &&
					column.id !== 'select' &&
					column.id !== 'srno' &&
					column.id !== 'actions',
			)
			.map((column) => column.id);

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.map((header) => {
				const value = row.original[header];
				return Array.isArray(value) ? value.length : value || '';
			}),
		);

		autoTable(doc, {
			head: [tableHeaders.map((header) => header.toUpperCase())],
			body: tableRows,
			startY: 10,
			theme: 'grid',
			headStyles: { fillColor: [100, 100, 100] },
		});

		doc.save('table_data.pdf');
	};

	// Export to Excel
	const exportToExcel = () => {
		const tableHeaders = table
			.getAllColumns()
			.filter(
				(column) =>
					column.getIsVisible() &&
					column.id !== 'drag' &&
					column.id !== 'select' &&
					column.id !== 'srno' &&
					column.id !== 'actions',
			)
			.map((column) => column.id.toUpperCase());

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.reduce((acc, header) => {
				const value = row.original[header.toLowerCase()];
				acc[header] = Array.isArray(value) ? value.length : value || '';
				return acc;
			}, {}),
		);

		const worksheet = XLSX.utils.json_to_sheet(tableRows);
		XLSX.utils.sheet_add_aoa(worksheet, [tableHeaders], { origin: 'A1' });

		// Apply Excel theme styling
		const range = XLSX.utils.decode_range(worksheet['!ref']);
		const headerStyle = {
			font: { bold: true, color: { rgb: 'FFFFFF' } },
			fill: { fgColor: { rgb: '4472C4' } },
			alignment: { horizontal: 'center' },
			border: {
				top: { style: 'thin' },
				bottom: { style: 'thin' },
				left: { style: 'thin' },
				right: { style: 'thin' },
			},
		};

		// Apply header styles
		for (let C = range.s.c; C <= range.e.c; ++C) {
			const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
			if (!worksheet[headerCell]) worksheet[headerCell] = {};
			worksheet[headerCell].s = headerStyle;
		}

		// Apply alternating row colors and borders to data cells
		for (let R = 1; R <= range.e.r; ++R) {
			for (let C = range.s.c; C <= range.e.c; ++C) {
				const cell = XLSX.utils.encode_cell({ r: R, c: C });
				if (!worksheet[cell]) worksheet[cell] = {};
				worksheet[cell].s = {
					fill: { fgColor: { rgb: R % 2 ? 'F2F2F2' : 'FFFFFF' } },
					border: {
						top: { style: 'thin' },
						bottom: { style: 'thin' },
						left: { style: 'thin' },
						right: { style: 'thin' },
					},
					alignment: { horizontal: 'left', vertical: 'center' },
				};
			}
		}

		// Set column widths
		const colWidths = tableHeaders.map((header) => ({ wch: Math.max(header.length + 2, 12) }));
		worksheet['!cols'] = colWidths;

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
		XLSX.writeFile(workbook, 'table_data.xlsx');
	};

	return (
		<div className="flex w-full flex-col justify-start gap-4">
			<div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="outline" size="sm" onClick={exportToPDF} className="min-w-[40px]">
						<DownloadIcon className="mr-2 h-4 w-4 md:mr-1" />
						<span className="hidden md:inline">Export PDF</span>
					</Button>
					<Button variant="outline" size="sm" onClick={exportToExcel} className="min-w-[40px]">
						<DownloadIcon className="mr-2 h-4 w-4 md:mr-1" />
						<span className="hidden md:inline">Export Excel</span>
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative w-full sm:w-auto">
						<Input
							placeholder="Search..."
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className="h-9 w-full sm:w-48 md:w-64 pl-10"
						/>
						<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="min-w-[40px]">
								<ColumnsIcon className="h-4 w-4 md:mr-1" />
								<span className="hidden md:inline">Customize Columns</span>
								<ChevronDownIcon className="ml-1 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
								.map((column) => (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) => column.toggleVisibility(!!value)}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto max-w-5xl">
				<div className="rounded-lg border scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
						id={sortableId}
					>
						<Table>
							<TableHeader className="bg-muted">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder ? null : (
													<div
														className="flex items-center gap-2 cursor-pointer select-none"
														onClick={header.column.getToggleSortingHandler()}
													>
														{flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
														{header.column.getCanSort() && (
															<div className="flex items-center">
																{header.column.getIsSorted() === 'asc' ? (
																	<ArrowUpIcon className="h-4 w-4" />
																) : header.column.getIsSorted() === 'desc' ? (
																	<ArrowDownIcon className="h-4 w-4" />
																) : (
																	<ArrowUpIcon className="h-4 w-4 opacity-0 group-hover:opacity-50" />
																)}
															</div>
														)}
													</div>
												)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="**[data-slot=table-cell]:first:w-8">
								{table.getRowModel().rows?.length ? (
									<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
										{table.getRowModel().rows.map((row) => (
											<DraggableRow key={row.id} row={row} />
										))}
									</SortableContext>
								) : (
									<TableRow>
										<TableCell colSpan={columns.length} className="h-24 text-center">
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</DndContext>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{' '}
						row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger className="w-20" id="rows-per-page">
									<SelectValue placeholder={table.getState().pagination.pageSize} />
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<ChevronsLeftIcon />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<ChevronLeftIcon />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<ChevronRightIcon />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<ChevronsRightIcon />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

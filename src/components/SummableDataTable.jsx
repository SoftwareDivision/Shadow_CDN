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

export default function SummableDataTable({ data: initialData, columns }) {
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
		const tableHeaders = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))
			.map((col) => col.id);

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.map((header) => {
				const v = row.original[header];
				return Array.isArray(v) ? v.length : v || '';
			}),
		);

		autoTable(doc, {
			head: [tableHeaders.map((h) => h.toUpperCase())],
			body: tableRows,
			startY: 10,
			theme: 'grid',
			headStyles: { fillColor: [100, 100, 100] },
		});

		doc.save('table_data.pdf');
	};

	// 📤 Export to Excel
	const exportToExcel = () => {
		const tableHeaders = table
			.getAllColumns()
			.filter((c) => c.getIsVisible() && !['srno', 'select', 'actions'].includes(c.id))
			.map((col) => col.id.toUpperCase());

		const tableRows = table.getRowModel().rows.map((row) =>
			tableHeaders.reduce((acc, header) => {
				const value = row.original[header.toLowerCase()];
				acc[header] = Array.isArray(value) ? value.length : value || '';
				return acc;
			}, {}),
		);

		const sheet = XLSX.utils.json_to_sheet(tableRows);
		XLSX.utils.sheet_add_aoa(sheet, [tableHeaders], { origin: 'A1' });
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
		XLSX.writeFile(wb, 'table_data.xlsx');
	};

	return (
		<div className="flex w-full flex-col gap-4">
			{/* Toolbar Section */}
			<div className="flex flex-col gap-4 md:flex-row md:justify-between">
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

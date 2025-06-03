import React from 'react';
import SectionCards from './section-cards';
import ChartAreaInteractive from './chart-area-interactive';
import DataTable from '@/components/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2Icon, GripVerticalIcon, LoaderIcon, MoreVerticalIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';

function Dashboard() {
	function DragHandle({ id }) {
		const { attributes, listeners } = useSortable({ id });

		return (
			<Button
				{...attributes}
				{...listeners}
				variant="ghost"
				size="icon"
				className="size-7 text-muted-foreground hover:bg-transparent"
			>
				<GripVerticalIcon className="size-3 text-muted-foreground" />
				<span className="sr-only">Drag to reorder</span>
			</Button>
		);
	}

	const columns = [
		// {
		// 	id: 'drag',
		// 	header: () => null,
		// 	cell: ({ row }) => <DragHandle id={row.original.id} />,
		// },
		{
			id: 'select',
			header: ({ table }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				</div>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'header',
			header: 'Custom Header',
			cell: ({ row }) => row.original.header,
			enableHiding: false,
		},
		{
			accessorKey: 'type',
			header: 'Section Type',
			cell: ({ row }) => (
				<div className="w-32">
					<Badge variant="outline" className="px-1.5 text-muted-foreground">
						{row.original.type}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => (
				<Badge variant="outline" className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3">
					{row.original.status === 'Done' ? (
						<CheckCircle2Icon className="text-green-500 dark:text-green-400" />
					) : (
						<LoaderIcon />
					)}
					{row.original.status}
				</Badge>
			),
		},
		{
			accessorKey: 'target',
			header: () => <div className="w-full text-center">Target</div>,
			cell: ({ row }) => row.original.target,
		},
		{
			accessorKey: 'limit',
			header: () => <div className="w-full text-center">Limit</div>,
			cell: ({ row }) => row.original.limit,
		},
		{
			accessorKey: 'reviewer',
			header: 'Reviewer',
			cell: ({ row }) => row.original.reviewer,
		},
		{
			id: 'actions',
			cell: () => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
							size="icon"
						>
							<MoreVerticalIcon />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-32">
						<DropdownMenuItem>Edit</DropdownMenuItem>
						<DropdownMenuItem>Make a copy</DropdownMenuItem>
						<DropdownMenuItem>Favorite</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Delete</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	const data = [
		{
			id: 1,
			header: 'Introduction',
			type: 'Narrative',
			status: 'Done',
			target: '1000',
			limit: '1200',
			reviewer: 'Eddie Lake',
		},
		{
			id: 2,
			header: 'Technical Approach',
			type: 'Technical',
			status: 'In Progress',
			target: '800',
			limit: '1000',
			reviewer: 'Assign reviewer',
		},
		{
			id: 3,
			header: 'Data Analysis',
			type: 'Data',
			status: 'Not Started',
			target: '1200',
			limit: '1500',
			reviewer: 'Assign reviewer',
		},
		{
			id: 4,
			header: 'Conclusion',
			type: 'Narrative',
			status: 'Not Started',
			target: '1000',
			limit: '1200',
			reviewer: 'Assign reviewer',
		},
		{
			id: 5,
			header: 'Introduction',
			type: 'Narrative',
			status: 'Done',
			target: '1000',
			limit: '1200',
			reviewer: 'Eddie Lake',
		},
		{
			id: 6,
			header: 'Technical Approach',
			type: 'Technical',
			status: 'In Progress',
			target: '800',
			limit: '1000',
			reviewer: 'Assign reviewer',
		},
		{
			id: 7,
			header: 'Data Analysis',
			type: 'Data',
			status: 'Not Started',
			target: '1200',
			limit: '1500',
			reviewer: 'Assign reviewer',
		},
		{
			id: 8,
			header: 'Conclusion',
			type: 'Narrative',
			status: 'Not Started',
			target: '1000',
			limit: '1200',
			reviewer: 'Assign reviewer',
		},
		{
			id: 9,
			header: 'Introduction',
			type: 'Narrative',
			status: 'Done',
			target: '1000',
			limit: '1200',
			reviewer: 'Eddie Lake',
		},
		{
			id: 10,
			header: 'Technical Approach',
			type: 'Technical',
			status: 'In Progress',
			target: '800',
			limit: '1000',
			reviewer: 'Assign reviewer',
		},
		{
			id: 11,
			header: 'Data Analysis',
			type: 'Data',
			status: 'Not Started',
			target: '1200',
			limit: '1500',
			reviewer: 'Assign reviewer',
		},
	];

	return (
		<>
			<div className="@container/main  flex flex-1 flex-col gap-2">
				<div className="flex flex-col gap-4  md:gap-4">
					<SectionCards />
					<ChartAreaInteractive />
					<Card className="w-full p-4 shadow-md">
						<DataTable data={data} columns={columns} />
					</Card>
				</div>
			</div>
		</>
	);
}

export default Dashboard;

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthToken } from '@/hooks/authStore';
import { useSortable } from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CheckCircle2Icon, GripVerticalIcon, XCircle, XCircleIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTableMRT from '@/components/DatatableMrt';
import DataTable from '@/components/DataTable';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getMagzineDetails } from '@/lib/api';

const columns = [
	{
		accessorKey: 'magname',
		header: 'Magzine Name',
	},
	{
		accessorKey: 'mcode',
		header: 'Code',
		cell: ({ cell }) => (
			<Badge variant="ghost" color="primary">
				{cell.getValue()}
			</Badge>
		),
	},
	{
		accessorKey: 'product',
		header: 'Products',
	},
	{
		accessorKey: 'wt',
		header: 'WT',
	},
	{
		accessorKey: 'autoallot_flag',
		header: 'Auto Allot',
		cell: ({ cell }) =>
			cell.getValue() ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />,
	},
	{
		accessorKey: 'actions',
		header: 'Actions',
		enableSorting: false,
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<MoreVertical className="h-4 w-4" />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={() => handleEdit(row.original)}
						className="text-blue-600 hover:text-blue-900"
					>
						<PencilIcon className="mr-2 h-4 w-4 text-blue-600 hover:text-blue-900" />
						Edit
					</DropdownMenuItem>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<DropdownMenuItem
								className="text-red-600 hover:text-red-900"
								onSelect={(e) => e.preventDefault()}
							>
								<TrashIcon className="mr-2 h-4 w-4 text-red-600 hover:text-red-900" />
								Delete
							</DropdownMenuItem>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete the magazine "
									{row.original.magname}" and all associated data.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => handleDelete(row.original)}
									className="bg-red-600 hover:bg-red-700"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];
// Add these functions inside the MagzineMaster component
const handleEdit = (row) => {
	console.log('Edit:', row);
	// Add your edit logic here
};

const handleDelete = (row) => {
	console.log('Delete:', row);
	// Add your delete logic here
};
function MagzineMaster() {
	const [initialData, setInitialData] = useState([]);
	const { token, isExpired } = useAuthToken.getState();
	const tokendata = token.data.token;
	const {
		data: productData,
		isLoading: isProductFetching,
		error: fetchProductError,
	} = useQuery({
		queryKey: ['productData'],
		queryFn: () => getMagzineDetails(tokendata),
		enabled: !!tokendata,
	});

	useEffect(() => {
		if (productData) {
			const dataWithHandleTransfer = productData.map((item) => ({
				...item,
			}));
			console.log('Mapped Data:', dataWithHandleTransfer);
			setInitialData(dataWithHandleTransfer);
		}
	}, [productData]);

	if (isProductFetching) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (fetchProductError) {
		return <div className="text-red-500">Error: {fetchError.message}</div>;
	}

	if (initialData.length === 0) {
		return <div className="flex items-center justify-center min-h-screen">No Data Found</div>;
	} else {
		return (
			<Card className="p-4 shadow-md">
				<DataTable columns={columns} data={initialData} />
			</Card>
		);
	}
}
export default MagzineMaster;

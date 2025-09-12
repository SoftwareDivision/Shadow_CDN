import DataTable from '@/components/DataTable';
import PermissionDeniedDialog from '@/components/PermissionDeniedDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthToken } from '@/hooks/authStore';
import { deleteBatch, getAllBatch } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Pencil as PencilIcon, Plus as PlusIcon, Trash as TrashIcon, Loader2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

function BatchIndex() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const userpermission = token.data.user.role.pageAccesses.find((item) => item.pageName === 'Batch Master');

	const {
		data: brandData,
		isLoading,
		error,
		refetch: refecth,
	} = useQuery({
		queryKey: ['batchData'],
		queryFn: async () => {
			const response = await getAllBatch(tokendata);
			return response || [];
		},
		enabled: !!tokendata,
	});
	console.log(brandData);

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteBatch(tokendata, id),
		onSuccess: () => {
			enqueueSnackbar('Batch deleted successfully', {
				variant: 'success',
			});
			refecth();
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete Batch', {
				variant: 'error',
			});
		},
	});

	const navigate = useNavigate();
	const handleEdit = (row) => {
		navigate(`/batch-master/edit/${row.id}`, {
			state: { brandData: row },
		});
	};
	const columns = [
		{
			accessorKey: 'plantName',
			header: 'Plant',
		},
		{
			accessorKey: 'batchSize',
			header: 'Batch Size',
		},
		{
			accessorKey: 'unit',
			header: 'Unit',
		},
		{
			accessorKey: 'batchCode',
			header: 'Batch Code',
		},
		{
			accessorKey: 'resetType',
			header: 'Reset Type',
			cell: ({ row }) => {
				const resetType = row.original.resetType;
				let label = '';
				if (resetType === 'D') label = 'Daily';
				else if (resetType === 'M') label = 'Monthly';
				else if (resetType === 'Y') label = 'Yearly';
				else label = resetType;
				return <Badge className="capitalize">{label}</Badge>;
			},
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
						<AlertDialog>
							<AlertDialogTrigger asChild>
								{userpermission?.isDelete ? (
									<DropdownMenuItem
										className="text-red-600 hover:text-red-900"
										onSelect={(e) => e.preventDefault()}
									>
										<TrashIcon className="mr-2 h-4 w-4 text-red-600 hover:text-red-900" />
										Delete
									</DropdownMenuItem>
								) : (
									<PermissionDeniedDialog
										action="Delete a Brand"
										trigger={
											<DropdownMenuItem
												className="text-red-600 hover:text-red-900"
												onSelect={(e) => e.preventDefault()}
											>
												<TrashIcon className="mr-2 h-4 w-4 text-red-600 hover:text-red-900" />
												Delete
											</DropdownMenuItem>
										}
									/>
								)}
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will permanently delete the brand "
										{row.original.bname}" and all associated data.
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

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	if (isLoading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (error) {
		return <div className="text-red-500">Error: {error.message}</div>;
	}

	return (
		<Card className="p-4 shadow-md">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Batch Master</h2>
				{userpermission?.isAdd ? (
					<Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/batch-master/add')}>
						<PlusIcon className="h-4 w-4" /> Add Batch
					</Button>
				) : (
					<PermissionDeniedDialog
						action="Add a Brand"
						trigger={
							<Button className="bg-primary hover:bg-primary/90">
								<PlusIcon className="h-4 w-4" /> Add Batch
							</Button>
						}
					/>
				)}
			</div>
			<DataTable columns={columns} data={brandData} heading={'Batch Master'} filename={'Batch_Master'} />
		</Card>
	);
}

export default BatchIndex;

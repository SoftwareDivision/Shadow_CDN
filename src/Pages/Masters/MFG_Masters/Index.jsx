import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreVertical, Loader2, Pencil as PencilIcon, Trash as TrashIcon } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getMfgDetails, deleteMfg } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import PermissionDeniedDialog from '@/components/PermissionDeniedDialog';

function MFGMasters() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const userpermission = token.data.user.role.pageAccesses.find((item) => item.pageName === 'MFG Masters');

	console.log('userpermission :-', userpermission);

	// Query for fetching MFG data
	const {
		data: mfgData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['mfg'],
		queryFn: () => getMfgDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch MFG data', { variant: 'error' });
		},
	});

	// Mutation for deleting MFG
	const deleteMutation = useMutation({
		mutationFn: (id) => deleteMfg(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['mfg']);
			enqueueSnackbar('MFG deleted successfully', { variant: 'success' });
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete MFG', { variant: 'error' });
		},
	});

	const handleEdit = (row) => {
		navigate(`/mfg-masters/edit/${row.id}`, {
			state: row,
		});
	};

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	const columns = [
		{
			header: 'MFG Name',
			accessorKey: 'mfgname',
		},
		{
			header: 'Code',
			accessorKey: 'code',
		},
		{
			header: 'Company ID',
			accessorKey: 'company_ID',
		},
		{
			accessorKey: 'actions',
			header: 'Actions',
			id: 'actions',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<MoreVertical className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{userpermission.isEdit ? (
							<DropdownMenuItem
								onClick={() => handleEdit(row.original)}
								className="text-blue-600 hover:text-blue-900"
							>
								<PencilIcon className="mr-2 h-4 w-4 text-blue-600 hover:text-blue-900" />
								Edit
							</DropdownMenuItem>

						) : (
							<PermissionDeniedDialog
								action="Edit a MFG"
								trigger={
									<DropdownMenuItem
										className="text-blue-600 hover:text-blue-900"
										onSelect={(e) => e.preventDefault()}
									>
										<PencilIcon className="mr-2 h-4 w-4 text-blue-600 hover:text-blue-900" />
										Edit
									</DropdownMenuItem>
								}
							/>
						)}
						<AlertDialog>
							<AlertDialogTrigger asChild>
								{userpermission.isDelete ? (
									<DropdownMenuItem
										className="text-red-600 hover:text-red-900"
										onSelect={(e) => e.preventDefault()}
									>
										<TrashIcon className="mr-2 h-4 w-4 text-red-600 hover:text-red-900" />
										Delete
									</DropdownMenuItem>

								) : (
									<PermissionDeniedDialog
										action="Delete a MFG"
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
										This action cannot be undone. This will permanently delete the country "
										{row.original.cname}" and all associated data.
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
	if (error) {
		enqueueSnackbar(error.message || 'Failed to fetch MFG data', { variant: 'error' });
		return <div>Error: {error.message}</div>;
	}

	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">MFG Masters</h2>
				{userpermission.isAdd ? (
					<Button onClick={() => navigate('/mfg-masters/add')} className="bg-primary hover:bg-primary/90">
						<PlusIcon className="h-4 w-4" />
						Add MFG
					</Button>
				) : (
					<PermissionDeniedDialog
						action="Add a MFG"
						trigger={
							<Button className="bg-primary hover:bg-primary/90">
								<PlusIcon className="h-4 w-4" />
								Add MFG
							</Button>
						}
					/>
				)}

			</div>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<DataTable columns={columns} data={mfgData || []} />
			)}
		</Card>
	);
}

export default MFGMasters;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getStateDetails, deleteState } from '@/lib/api';
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

function StateMaster() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	// Query for fetching states
	const { data: stateData, isLoading } = useQuery({
		queryKey: ['states'],
		queryFn: () => getStateDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch states', { variant: 'error' });
		},
	});

	// Mutation for deleting state
	const deleteMutation = useMutation({
		mutationFn: (id) => deleteState(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['states']);
			enqueueSnackbar('State deleted successfully', { variant: 'success' });
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete state', { variant: 'error' });
		},
	});

	const handleEdit = (row) => {
		navigate(`/state-master/edit/${row.id}`, {
			state: row,
		});
	};

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	const columns = [
		{
			header: 'State Name',
			accessorKey: 'state',
		},
		{
			header: 'State Code',
			accessorKey: 'st_code',
		},
		{
			header: 'District',
			accessorKey: 'district',
		},
		{
			header: 'City',
			accessorKey: 'city',
		},
		{
			header: 'Tahsil',
			accessorKey: 'tahsil',
		},
		{
			accessorKey: 'actions',
			header: 'Actions',
			id: 'actions',
			cell: ({ row }) => {
				return (
					<DropdownMenu>
						<DropdownMenuTrigger>
							<MoreHorizontal className="h-5 w-5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit</DropdownMenuItem>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										className="text-red-600 hover:text-red-900"
										onSelect={(e) => e.preventDefault()}
									>
										Delete
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
										<AlertDialogDescription>
											This action cannot be undone. This will permanently delete the state "
											{row.original.state}" and all associated data.
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
				);
			},
		},
	];

	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">State Master</h2>
				<Button onClick={() => navigate('/state-master/add')} className="bg-primary hover:bg-primary/90">
					<PlusIcon className="h-4 w-4" />
					Add State
				</Button>
			</div>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<DataTable columns={columns} data={stateData || []} />
			)}
		</Card>
	);
}

export default StateMaster;

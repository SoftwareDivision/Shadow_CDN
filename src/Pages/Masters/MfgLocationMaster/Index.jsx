import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import DataTable from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { deleteMfgLocation, getMfgLocationDetails } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil as PencilIcon, Plus as PlusIcon, Trash as TrashIcon, Loader2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
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

function MfgLocationMaster() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const {
		data: mfgLocationData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['mfgLocationData'],
		queryFn: async () => {
			const response = await getMfgLocationDetails(tokendata);
			return response || [];
		},
		enabled: !!tokendata,
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteMfgLocation(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['mfgLocationData']);
			enqueueSnackbar('Mfg Location deleted successfully', {
				variant: 'success',
			});
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete Mfg Location', {
				variant: 'error',
			});
		},
	});

	const navigate = useNavigate();
	const handleEdit = (row) => {
		navigate(`/mfg-location-master/edit/${row.id}`, {
			state: { mfgLocationData: row },
		});
	};

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	if (isLoading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (error) {
		return <div className="text-red-500">Error: {error.message}</div>;
	}

	const columns = [
		{
			accessorKey: 'mfgname',
			header: 'Mfg Name',
		},
		{
			accessorKey: 'mfgcode',
			header: 'Mfg Code',
		},
		{
			accessorKey: 'mfgloc',
			header: 'Mfg Location',
		},
		{
			accessorKey: 'mfgloccode',
			header: 'Mfg Location Code',
		},
		{
			accessorKey: 'maincode',
			header: 'Main Code',
		},
		{
			accessorKey: 'company_ID',
			header: 'Company ID',
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
										This action cannot be undone. This will permanently delete the Mfg Location "
										{row.original.mfgname}" and all associated data.
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

	return (
		<Card className="p-4 shadow-md">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Mfg Location Master</h2>
				<Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/mfg-location-master/add')}>
					<PlusIcon className="h-4 w-4" /> Add Mfg Location
				</Button>
			</div>
			<DataTable columns={columns} data={mfgLocationData} />
		</Card>
	);
}

export default MfgLocationMaster;

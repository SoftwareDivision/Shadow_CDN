import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreVertical, Loader2, Pencil as PencilIcon, Trash as TrashIcon } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getPlantTypeDetails, deletePlantType } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';

function PlantTypeMaster() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const { data: plantTypeData, isLoading } = useQuery({
		queryKey: ['plantTypes'],
		queryFn: () => getPlantTypeDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch plant type data', { variant: 'error' });
		},
	});

	console.log(plantTypeData);

	const deleteMutation = useMutation({
		mutationFn: (id) => deletePlantType(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['plantTypes']);
			enqueueSnackbar('Plant Type deleted successfully', { variant: 'success' });
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete plant type', { variant: 'error' });
		},
	});

	const handleEdit = (row) => {
		navigate(`/plant-type-master/edit/${row.id}`, { state: row });
	};

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	const columns = [
		{ header: 'Plant Type Name', accessorKey: 'plant_type' },		
		{ header: 'Company ID', accessorKey: 'company_ID' },		
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

	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Plant Type Master</h2>
				<Button onClick={() => navigate('/plant-type-master/add')} className="bg-primary hover:bg-primary/90">
					<PlusIcon className="h-4 w-4" />
					Add Plant Type
				</Button>
			</div>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<DataTable columns={columns} data={plantTypeData || []} />
			)}
		</Card>
	);
}

export default PlantTypeMaster;

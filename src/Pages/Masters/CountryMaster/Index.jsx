import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { use, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { deleteCountry, getCountryDetails } from '@/lib/api';
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
import PermissionDeniedDialog from '@/components/PermissionDeniedDialog';

function CountryMaster() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const userpermission = token.data.user.role.pageAccesses.find((item) => item.pageName === 'Country Master');

	console.log("userpermission :-", userpermission);

	const {
		data: countryData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['countryData'],
		queryFn: async () => {
			const response = await getCountryDetails(tokendata);
			return response || [];
		},
		enabled: !!tokendata,
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteCountry(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['countryData']);
			enqueueSnackbar('Country deleted successfully', {
				variant: 'success',
			});
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete country', {
				variant: 'error',
			});
		},
	});

	const navigate = useNavigate();
	const handleEdit = (row) => {
		navigate(`/country-master/edit/${row.id}`, {
			state: { countryData: row },
		});
	};

	useEffect(() => {
		console.log(token.data.user);
	}, []);

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
			accessorKey: 'cname',
			header: 'Country Name',
		},
		{
			accessorKey: 'code',
			header: 'Country Code',
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
								action="Edit a Country"
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
										action="Delete a Country"
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

	return (
		<Card className="p-4 shadow-md">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Country Master</h2>
				{userpermission.isAdd ? (
					<Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/country-master/add')}>
						<PlusIcon className="h-4 w-4" /> Add Country
					</Button>
				) : (
					<PermissionDeniedDialog
						action="Add a Country"
						trigger={
							<Button className="bg-primary hover:bg-primary/90" >
								<PlusIcon className="h-4 w-4" /> Add Country
							</Button>
						}
					/>
				)}
			</div>
			<DataTable columns={columns} data={countryData} />
		</Card>
	);
}

export default CountryMaster;

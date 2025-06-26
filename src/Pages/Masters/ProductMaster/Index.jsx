import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil as PencilIcon, Plus as PlusIcon, Trash as TrashIcon, Loader2 } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getProductDetails, deleteProduct } from '@/lib/api';
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

function ProductMaster() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const userpermission = token.data.user.role.pageAccesses.find((item) => item.pageName === 'Product Master');

	console.log('userpermission :-', userpermission);

	const { data: productData, isLoading } = useQuery({
		queryKey: ['products'],
		queryFn: () => getProductDetails(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch product data', { variant: 'error' });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteProduct(tokendata, id),
		onSuccess: () => {
			queryClient.invalidateQueries(['products']);
			enqueueSnackbar('Product deleted successfully', { variant: 'success' });
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to delete product', { variant: 'error' });
		},
	});

	const handleEdit = (row) => {
		navigate(`/product-master/edit/${row.id}`, { state: row });
	};

	const handleDelete = (row) => {
		deleteMutation.mutate(row.id);
	};

	const columns = [
		{ header: 'Brand Name', accessorKey: 'bname' },
		{ header: 'Brand ID', accessorKey: 'bid' },
		{ header: 'Product Type', accessorKey: 'ptype' },
		{ header: 'Product Type Code', accessorKey: 'ptypecode' },
		{ header: 'Product Size', accessorKey: 'psize' },
		{ header: 'Size Code', accessorKey: 'psizecode' },
		{ header: 'Dimension', accessorKey: 'dimnesion' },
		{ header: 'Dimension Unit', accessorKey: 'dimensionunit' },
		{ header: 'Unit Weight', accessorKey: 'dimunitwt' },
		{ header: 'Weight Unit', accessorKey: 'wtunit' },
		{ header: 'L1 Net Weight', accessorKey: 'l1netwt' },
		{ header: 'No. of L2', accessorKey: 'noofl2' },
		{ header: 'No. of L3/L2', accessorKey: 'noofl3perl2' },
		{ header: 'No. of L3/L1', accessorKey: 'noofl3perl1' },
		{ header: 'Active', accessorKey: 'act' },
		{
			accessorKey: 'actions',
			header: 'Actions',
			id: 'actions',
			size: 80,
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<MoreVertical className="h-5 w-5" />
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
								action="Edit a Product"
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
										action="Delete a Product"
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
										This action cannot be undone. This will permanently delete the Product "{row.original.pname}"
										and all associated data.
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
				<h2 className="text-2xl font-bold">Product Master</h2>
				{userpermission.isAdd ? (
					<Button onClick={() => navigate('/product-master/add')} className="bg-primary hover:bg-primary/90">
						<PlusIcon className="h-4 w-4" />
						Add Product
					</Button>
				) : (
					<PermissionDeniedDialog
						action="Add a Product"
						trigger={
							<Button className="bg-primary hover:bg-primary/90">
								<PlusIcon className="h-4 w-4" />
								Add Product
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
				<DataTable columns={columns} data={productData || []} />
			)}
		</Card>
	);
}

export default ProductMaster;

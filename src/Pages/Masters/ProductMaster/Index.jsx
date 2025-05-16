import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreHorizontal, Loader2 } from 'lucide-react';
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

function ProductMaster() {
    const navigate = useNavigate();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

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
        { header: 'Class', accessorKey: 'class' },
        { header: 'Division', accessorKey: 'division' },
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
        { header: 'SDCAT', accessorKey: 'sdcat' },
        { header: 'UN No. Class', accessorKey: 'unnoclass' },
        { header: 'Active', accessorKey: 'act' },
        { header: 'Scanner Delay', accessorKey: 'scannerdealy' },
        { header: 'Printer Delay', accessorKey: 'printerdealy' },
        { header: 'Stop Delay', accessorKey: 'stopdealy' },
        {
            accessorKey: 'actions',
			header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
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
                                        This action cannot be undone. This will permanently delete the product
                                        "{row.original.bname}" and all associated data.
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
                <Button
                    onClick={() => navigate('/product-master/add')}
                    className="bg-primary hover:bg-primary/90"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Product
                </Button>
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
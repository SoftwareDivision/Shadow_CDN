import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getUOMDetails, deleteUOM } from '@/lib/api';
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

function UOMMaster() {
    const navigate = useNavigate();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: uomData, isLoading } = useQuery({
        queryKey: ['uom'],
        queryFn: () => getUOMDetails(tokendata),
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to fetch UOM data', { variant: 'error' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteUOM(tokendata, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['uom']);
            enqueueSnackbar('UOM deleted successfully', { variant: 'success' });
        },
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to delete UOM', { variant: 'error' });
        },
    });

    const handleEdit = (row) => {
        navigate(`/uom-master/edit/${row.id}`, { state: row });
    };

    const handleDelete = (row) => {
        deleteMutation.mutate(row.id);
    };

    const columns = [
        { accessorKey: 'uom', header: 'UOM' },
        { accessorKey: 'uomcode', header: 'UOM Code' },
        {
            accessorKey: 'actions',
			header: 'Actions',
            id: 'actions',
            cell: ({ row }) => {
                const uom = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(uom)}>Edit</DropdownMenuItem>
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
                                            This action cannot be undone. This will permanently delete the UOM
                                            "{uom.uom}" and all associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(uom)}
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">UOM Master</h2>
                <Button onClick={() => navigate('/uom-master/add')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Add UOM
                </Button>
            </div>

            <DataTable columns={columns} data={uomData || []} isLoading={isLoading} />
        </Card>
    );
}

export default UOMMaster;
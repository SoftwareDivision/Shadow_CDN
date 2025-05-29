import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import DataTable from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { deleteTransport, getAllTransports } from '@/lib/api';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';

function TransportMaster() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const handleEdit = (transport) => {
        navigate(`/transport-master/edit/${transport.id}`, {
            state: { transportData: transport }
        });
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    const columns = [
        {
            header: 'Transport Name',
            accessorKey: 'tName'
        },
        {
            header: 'GST No',
            accessorKey: 'gstno'
        },
        {
            header: 'City',
            accessorKey: 'city'
        },
        {
            header: 'State',
            accessorKey: 'state'
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const transport = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(transport)}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            transport and remove all related data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(transport.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {deleteMutation.isLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <TrashIcon className="mr-2 h-4 w-4" />
                                            )}
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

    const { data: transportData, isLoading } = useQuery({
        queryKey: ['transports'],
        queryFn: async () => {
            const response = await getAllTransports(tokendata);
            return response || [];
        },
        enabled: !!tokendata,
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to fetch transport data', { variant: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteTransport(tokendata, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['transports']);
            enqueueSnackbar('Transport deleted successfully', { variant: 'success' });
        },
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to delete transport', { variant: 'error' });
        },
    });

    const handleAdd = () => {
        navigate('/transport-master/add');
    };

    return (
        <div className="container mx-auto py-6">
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Transport Master</h1>
                    <Button onClick={handleAdd}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Transport
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    data={transportData || []}
                    isLoading={isLoading}
                />
            </Card>
        </div>
    );
}

export default TransportMaster;
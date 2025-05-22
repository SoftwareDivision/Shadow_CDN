import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import DataTable from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { getAllShifts, deleteShift } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil as PencilIcon, Plus as PlusIcon, Trash as TrashIcon, Loader2 } from 'lucide-react';
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

function ShiftMaster() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const {
        data: shiftData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['shiftData'],
        queryFn: async () => {
            const response = await getAllShifts(tokendata);
            return response || [];
        },
        enabled: !!tokendata,
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteShift(tokendata, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['shiftData']);
            enqueueSnackbar('Shift deleted successfully', {
                variant: 'success',
            });
        },
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to delete shift', {
                variant: 'error',
            });
        },
    });

    const navigate = useNavigate();
    const handleEdit = (row) => {
        navigate(`/shift-master/edit/${row.id}`, {
            state: { shiftData: row },
        });
    };

    const handleDelete = (row) => {
        deleteMutation.mutate(row.id);
    };

    const columns = [
        {
            accessorKey: 'shift',
            header: 'Shift',
        },
        {
            accessorKey: 'fromtime',
            header: 'From Time',
            cell: ({ row }) => row.original.fromtime
        },
        {
            accessorKey: 'totime',
            header: 'To Time',
            cell: ({ row }) => row.original.totime
        },
        {
            accessorKey: 'actions',
			header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-5 w-5" />
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
                                        This action cannot be undone. This will permanently delete the shift "{row.original.shift}"
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Shift Master</h2>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/shift-master/add')}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Shift
                </Button>
            </div>
            <DataTable columns={columns} data={shiftData || []} />
        </Card>
    );
}

export default ShiftMaster;
import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import DataTable from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { getCustomerDetails, deleteCustomer } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Plus, Trash, Loader2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function CustomerMaster() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: customerData, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: () => getCustomerDetails(tokendata),
        enabled: !!tokendata
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteCustomer(tokendata, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            enqueueSnackbar('Customer deleted successfully', { variant: 'success' });
        },
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to delete customer', { variant: 'error' });
        }
    });

    const columns = [
        { header: 'Customer ID', accessorKey: 'cid' },
        { header: 'Name', accessorKey: 'cName' },
        { header: 'GST No', accessorKey: 'gstno' },
        { header: 'City', accessorKey: 'city' },
        { header: 'State', accessorKey: 'state' },
        {
            accessorKey: 'actions',
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem 
                            onClick={() => navigate(`/customer-master/edit/${row.original.id}`, { 
                                state: { customerData: row.original } 
                            })}
                        >
                            Edit
                        </DropdownMenuItem>
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
                                        This action cannot be undone. This will permanently delete the customer "{row.original.cName}" and all associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(row.original.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {deleteMutation.isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Delete'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        }
    ];

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Customer Master</h2>
                <Button onClick={() => navigate('/customer-master/add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={customerData || []}
                isLoading={isLoading}
            />
        </Card>
    );
}

export default CustomerMaster;
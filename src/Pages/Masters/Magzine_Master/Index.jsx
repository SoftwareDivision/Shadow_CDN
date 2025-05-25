import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthToken } from '@/hooks/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, MoreVertical, Loader2 } from 'lucide-react';
import { CheckCircle2, CheckCircle2Icon, GripVerticalIcon, XCircle, XCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getMagzineDetails, deleteMagzine } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';

function MagzineMaster() {
    const navigate = useNavigate();
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: magzineData, isLoading } = useQuery({
        queryKey: ['magzines'],
        queryFn: () => getMagzineDetails(tokendata),
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to fetch magzine data', { variant: 'error' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteMagzine(tokendata, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['magzines']);
            enqueueSnackbar('Magzine deleted successfully', { variant: 'success' });
        },
        onError: (error) => {
            enqueueSnackbar(error.message || 'Failed to delete magzine', { variant: 'error' });
        },
    });

    const handleEdit = (row) => {
        navigate(`/magzine-master/edit/${row.id}`, {
			state: { magzineData: row },
		});
    };

    const handleDelete = (row) => {
        deleteMutation.mutate(row.id);
    };

    const columns = [
        { 
            accessorKey: 'mfgloc',
            header: 'MFG Location'
        },
        { 
            accessorKey: 'magname',
            header: 'Magazine Name'
        },
        { 
            accessorKey: 'mcode',
            header: 'Magazine Code'
        },
        { 
            accessorKey: 'licno',
            header: 'License No.'
        },
        {
            accessorKey: 'issuedate',
            header: 'Issue Date',
            cell: ({ row }) => new Date(row.getValue('issuedate')).toLocaleDateString()
        },
        {
            accessorKey: 'validitydt',
            header: 'Validity Date',
            cell: ({ row }) => new Date(row.getValue('validitydt')).toLocaleDateString()
        },
        {
            accessorKey: 'totalwt',
            header: 'Total Weight',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.getValue('totalwt')} KGs
                </Badge>
            )
        },
        {
			accessorKey: 'autoallot_flag',
			header: 'Auto Allot',
			cell: ({ cell }) =>
				cell.getValue() ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />,
		},
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                                        This action cannot be undone. This will permanently delete the magzine "
                                        {row.original.magname}" and all associated data.
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
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Magazine Master</h2>
                <Button onClick={() => navigate('/magzine-master/add')} className="bg-primary hover:bg-primary/90">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Magazine
                </Button>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <DataTable columns={columns} data={magzineData || []} />
            )}
        </Card>
    );
}

export default MagzineMaster;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import DataTable from '@/components/DataTable';
import { getAllLoadingSheets } from '@/lib/api'; // Import the new API function
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function LoadingSheetPage() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();

	// Query for fetching Loading Sheet data
	const { data: loadingSheetsData, isLoading } = useQuery({
		queryKey: ['loadingSheets'],
		queryFn: () => getAllLoadingSheets(tokendata), // Use the new API function
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch loading sheets data', { variant: 'error' });
		},
	});

	const columns = [
		{
			header: 'Date',
			accessorKey: 'mfgdt',
			cell: ({ row }) => {
				const date = row.getValue('mfgdt');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
			},
		},
		{ header: 'Loading Sheet No', accessorKey: 'loadingSheetNo' },
		{ header: 'Truck No', accessorKey: 'truckNo' },
		{
			header: 'Status',
			accessorKey: 'compflag',
			cell: ({ row }) => {
				const status = row.getValue('compFlag');
				return (
					<Badge
						className={`px-2 py-1 rounded-full text-xs ${
							status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
						}`}
					>
						{status === 1 ? 'Completed' : 'Pending'}
					</Badge>
				);
			},
		},
		{ header: 'Details', id: 'id' },
	];

	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Loading Sheets</h2>
				{/* Add button for adding new loading sheet if needed */}
				<Button onClick={() => navigate('/loading-sheets/add')} className="bg-primary hover:bg-primary/90">
					<PlusIcon className="h-4 w-4" />
					Add Loading Sheet
				</Button>
			</div>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<DataTable columns={columns} data={loadingSheetsData || []} />
			)}
		</Card>
	);
}

export default LoadingSheetPage;

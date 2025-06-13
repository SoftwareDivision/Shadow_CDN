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
import Loader from '@/components/Loader';
import { Alert } from '@/components/ui/alert';
import Error from '@/components/Error';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
function LoadingSheetPage() {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();

	const [selectedItems, setSelectedItems] = useState(null);

	// Query for fetching Loading Sheet data
	const {
		data: loadingSheetsData,
		isLoading,
		error,
	} = useQuery({
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
				const status = row.getValue('compflag');
				return (
					<Badge
						className={`px-2 py-1 rounded-full text-xs ${
							status === 0 ? 'bg-yellow-800 text-white' : ' bg-green-700 text-white'
						}`}
					>
						{status === 0 ? 'Pending' : 'Completed'}
					</Badge>
				);
			},
		},
		{
			id: 'indentDetails',
			header: 'Items',
			cell: ({ row }) => {
				const items = row.original.indentDetails;
				return (
					<div>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
							onClick={() => setSelectedItems(items)}
						>
							<span>View Items</span>
							<Badge variant="secondary" className="ml-1">
								{items?.length || 0}
							</Badge>
						</Button>
						<Dialog open={!!selectedItems} onOpenChange={() => setSelectedItems(null)}>
							<DialogContent className="max-w-[90vw] w-full lg:max-w-[85vw] xl:max-w-[80vw] h-[90vh] flex flex-col p-0">
								<DialogHeader className="p-6 pb-4 border-b">
									<DialogTitle className="text-2xl font-bold">Indent Items Details</DialogTitle>
									<DialogDescription className="text-sm text-muted-foreground">
										Showing {selectedItems?.length || 0} items for indent
									</DialogDescription>
								</DialogHeader>

								<div className="flex-1 overflow-auto p-6">
									<div className="rounded-md border">
										<Table>
											<TableHeader className="sticky top-0 bg-muted">
												<TableRow>
													<TableHead className="font-semibold w-[15%]">Indent No</TableHead>
													<TableHead className="font-semibold w-[15%]">
														Product Type
													</TableHead>
													<TableHead className="font-semibold w-[15%]">Brand</TableHead>
													<TableHead className="font-semibold w-[15%]">Size</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Magzine
													</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Load Cases
													</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Load Type
													</TableHead>
													<TableHead className="font-semibold text-center w-[10%]">
														Status
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{selectedItems?.map((item, index) => (
													<TableRow key={index} className="hover:bg-muted/50">
														<TableCell className="font-medium">{item.indentNo}</TableCell>
														<TableCell className="font-medium">{item.ptype}</TableCell>
														<TableCell>{item.bname}</TableCell>
														<TableCell>{item.psize}</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.mag}</span>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.loadcase}</span>
															<span className="text-muted-foreground ml-1">Cases</span>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.typeOfDispatch}</span>
														</TableCell>
														<TableCell className="text-center">
															<span
																className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
																	item.iscompleted === 0
																		? 'bg-yellow-800 text-white border border-yellow-800'
																		: '  bg-green-800 text-white border border-green-800'
																}`}
															>
																{item.iscompleted === 0 ? 'Pending' : 'Completed'}
															</span>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>

								<DialogFooter className="p-6 pt-4 border-t">
									<Button variant="outline" onClick={() => setSelectedItems(null)}>
										Close
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				);
			},
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}
	if (error) {
		return <Error error={error.message} />;
	}
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
			<DataTable columns={columns} data={loadingSheetsData || []} />
		</Card>
	);
}

export default LoadingSheetPage;

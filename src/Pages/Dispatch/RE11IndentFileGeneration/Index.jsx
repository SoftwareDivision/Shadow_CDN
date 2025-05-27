import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getRE11IndentDetails } from '@/lib/api';
import { Card } from '@/components/ui/card';
import DataTable from '@/components/DataTable';
import { useAuthToken } from '@/hooks/authStore';
import { Loader2, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RE11IndentFileGeneration = () => {
	const navigate = useNavigate();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const [selectedItems, setSelectedItems] = useState(null);

	const columns = [
		{
			accessorKey: 'indentNo',
			header: 'Indent No',
		},
		{
			accessorKey: 'indentDt',
			header: 'Indent Date',
			cell: ({ row }) => {
				const date = row.getValue('indentDt');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
			},
		},
		{
			accessorKey: 'custName',
			header: 'Customer Name',
		},
		{
			accessorKey: 'pesoDt',
			header: 'PESO Date',
			cell: ({ row }) => {
				const date = row.getValue('pesoDt');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
			},
		},
		{
			accessorKey: 'completedIndent',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.getValue('completedIndent');
				return (
					<Badge
						className={`px-2 py-1 rounded-full text-xs ${
							status === 1
								? 'bg-green-800 text-white border border-green-800 '
								: 'bg-yellow-800 text-white border border-yellow-800 '
						}`}
					>
						{status === 1 ? 'Completed' : 'Pending'}
					</Badge>
				);
			},
		},
		{
			id: 'indentItems',
			header: 'Items',
			cell: ({ row }) => {
				const items = row.original.indentItems;
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
													<TableHead className="font-semibold w-[15%]">
														Product Type
													</TableHead>
													<TableHead className="font-semibold w-[15%]">Brand</TableHead>
													<TableHead className="font-semibold w-[15%]">Size</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Required Weight
													</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Load Weight
													</TableHead>
													<TableHead className="font-semibold text-right w-[15%]">
														Remaining Weight
													</TableHead>
													<TableHead className="font-semibold text-center w-[10%]">
														Status
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{selectedItems?.map((item, index) => (
													<TableRow key={index} className="hover:bg-muted/50">
														<TableCell className="font-medium">{item.ptype}</TableCell>
														<TableCell>{item.bname}</TableCell>
														<TableCell>{item.psize}</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.reqWt}</span>
															<span className="text-muted-foreground ml-1">
																{item.unit}
															</span>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.loadWt}</span>
															<span className="text-muted-foreground ml-1">
																{item.unit}
															</span>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">{item.remWt}</span>
															<span className="text-muted-foreground ml-1">
																{item.unit}
															</span>
														</TableCell>
														<TableCell className="text-center">
															<span
																className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
																	item.completedLoadingProduct === 0
																		? 'bg-yellow-800 text-white border border-yellow-800'
																		: ' bg-green-800 text-white border border-green-800'
																}`}
															>
																{item.completedLoadingProduct === 0
																	? 'Pending'
																	: 'Completed'}
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

	const {
		data: indents,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['re11-indents'],
		queryFn: () => getRE11IndentDetails(tokendata),
		onError: (err) => {
			enqueueSnackbar(err.message || 'Failed to fetch RE11 indents', { variant: 'error' });
		},
	});

	isLoading && (
		<div className="flex items-center justify-center py-8">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
		</div>
	);
	error && <div>Error: {error.message}</div>;
	return (
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">RE-11 Indent</h2>
				<Button
					onClick={() => navigate('/re11-indent-generation/add')}
					className="bg-primary hover:bg-primary/90"
				>
					<PlusIcon className="h-4 w-4" />
					Add Re-11 Indent
				</Button>
			</div>
			<DataTable data={indents || []} columns={columns} />
		</Card>
	);
};

export default RE11IndentFileGeneration;

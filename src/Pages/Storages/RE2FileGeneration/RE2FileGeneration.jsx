import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateRE2File, getRE2GenData } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { enqueueSnackbar } from 'notistack';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/DataTable';

const RE2FileGeneration = () => {
	const { token } = useAuthToken.getState();
	const [loading, setLoading] = useState(false);
	const [re2Data, setRE2Data] = useState([]);
	const [selectedtablerow, setselectedtablerow] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const timeoutRef = useRef(null);

	const {
		data: apiData,
		isLoading: isFetching,
		error: fetchError,
		refetch,
	} = useQuery({
		queryKey: ['re2GenerateData'],
		queryFn: () => getRE2GenData(token.data.token),
		enabled: !!token,
	});

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedRows(re2Data?.map((item) => item.l1Barcode) || []);
		} else {
			setSelectedRows([]);
		}
	};

	const handleSelectRow = (l1Barcode) => {
		setSelectedRows((prev) =>
			prev.includes(l1Barcode) ? prev.filter((id) => id !== l1Barcode) : [...prev, l1Barcode],
		);
	};

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await generateRE2File(token.data.token, payload);
		},
		onSuccess: (data) => {
			downloadCSV(data);
			console.log('RE2 file generated successfully:', data);
			enqueueSnackbar('RE2 file generated successfully', { variant: 'success' });
			setLoading(false);
			setselectedtablerow([]);
			refetch();
		},
		onError: (error) => {
			console.error('Error generating RE2 file:', error);
			enqueueSnackbar('Error generating RE2 file', { variant: 'error' });
			setLoading(false);
		},
	});

	const columns = [
		{
			header: 'Transfer ID',
			accessorKey: 'transferId',
		},
		{
			header: 'Transfer Date',
			accessorKey: 'transferDate',
			cell: ({ row }) => {
				const date = row.getValue('transferDate');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
			},
		},
		{
			header: 'Plant',
			accessorKey: 'plant',
		},
		{
			header: 'Brand Name',
			accessorKey: 'brandName',
		},
		{
			header: 'Product Size',
			accessorKey: 'productSize',
		},
		{
			header: 'Magazine',
			accessorKey: 'magazineName',
		},
		{
			header: 'Case Quantity',
			accessorKey: 'caseQuantity',
		},
		{
			header: 'Actions',
			cell: ({ row }) => (
				<Button variant="outline" size="sm" onClick={() => showre2data(row.original)}>
					Make RE2
				</Button>
			),
		},
	];

	const showre2data = useCallback(
		(data) => {
			// Clear any existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Set a new timeout for the mutation call
			timeoutRef.current = setTimeout(() => {
				console.log(data);
				setLoading(true); // Set loading state before mutation

				const selectedL1Barcodes = data?.transferToMazgnieScanneddata?.map((l1Barcode) => ({
					l1barcode: l1Barcode.l1Scanned,
				}));

				// Construct payload using the 'data' argument directly
				const payload = {
					l1L2: selectedL1Barcodes,
					productionMagzineAllocation: data, // Use data directly
				};

				console.log(payload);

				mutation.mutate(payload, {
					onSettled: () => console.log('Mutation settled'),
					// Consider adding onSuccess/onError handlers to set loading to false
				});
			}, 300); // 300ms delay (adjust as needed)

			// You can keep this if you need to update state for other purposes
			setselectedtablerow(data);
		},
		[mutation, setLoading, setselectedtablerow], // Dependencies
	);

	// Cleanup effect to clear the timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	function convertArrayToCSVWithoutQuotes(data) {
		const csvRows = [];

		// Loop over the rows
		for (const row of data) {
			const values = Object.values(row).map((value) => {
				return value; // Directly use the value without quotes
			});
			csvRows.push(values.join(','));
		}

		return csvRows.join('\n');
	}

	function downloadCSV(data) {
		const csvData = convertArrayToCSVWithoutQuotes(data);
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const mfgdt = format(new Date(), 'yyyyMMdd'); // Format the manufacturing date
		const brandName = selectedtablerow.brandName.replace(/\s+/g, ''); // Remove spaces from brand name
		const magazineName = selectedtablerow.magazineName.replace(/\s+/g, ''); // Remove spaces from magazine name
		const totalCases = new Set(data.map((item) => item.l1barcode)).size; // Calculate total cases
		const fileName = `${mfgdt}_${brandName}_${magazineName}_${totalCases}_CASES.csv`;
		const a = document.createElement('a');
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', fileName);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	const handleGenerateRE2 = () => {
		setLoading(true);
		const selectedL1Barcodes = selectedRows.map((l1Barcode) => ({ l1barcode: l1Barcode }));
		const payload = {
			l1L2: selectedL1Barcodes,
			productionMagzineAllocation: selectedtablerow,
		};
		mutation.mutate(payload, {
			onSettled: () => console.log('Mutation settled'),
		});
	};

	if (isFetching || loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin" />
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}
	return (
		<>
			<Card className="p-4 shadow-md">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">RE2 File Generation</h2>
				</div>

				{/* Error Alerts */}
				{fetchError && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{fetchError?.message}</AlertDescription>
					</Alert>
				)}
				<DataTable columns={columns} data={apiData} />
			</Card>

			{/* Display RE2 Data */}
			{re2Data.length > 0 && (
				<Card className="p-4 shadow-md mt-4">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold">RE2 Data</h2>
						<div className="flex items-center gap-4">
							<div className="font-semibold">
								<Badge variant="default">
									Total Cases: {new Set(re2Data?.map((item) => item.l1Barcode)).size}
								</Badge>
							</div>
							<Button onClick={handleGenerateRE2} className="flex items-center gap-2" variant="outline">
								<FileSpreadsheet className="h-4 w-4" />
								Generate RE File
							</Button>
						</div>
					</div>
					<div className="rounded-md border">
						<div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead className="font-medium sticky top-0 z-10 border-b">
											<Checkbox
												className="border-blue-600 border-2"
												checked={re2Data?.length > 0 && selectedRows.length === re2Data?.length}
												onCheckedChange={handleSelectAll}
												aria-label="Select all"
											/>
											{'  '} Select all
										</TableHead>
										<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
											L1 Barcode
										</TableHead>
										<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
											L2 Barcode
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{re2Data?.map((item, index) => (
										<TableRow key={index}>
											<TableCell className="">
												<Checkbox
													className="border-blue-600 border-2"
													checked={selectedRows.includes(item.l1Barcode)}
													onCheckedChange={() => handleSelectRow(item.l1Barcode)}
												/>
											</TableCell>
											<TableCell className="font-medium text-center">{item.l1Barcode}</TableCell>
											<TableCell className="font-medium text-center">{item.l2Barcode}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</Card>
			)}
		</>
	);
};

export default RE2FileGeneration;

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useAuthToken } from '@/hooks/authStore';
import { createRe12Indent, getRe12IndentDetails } from '@/lib/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { enqueueSnackbar } from 'notistack';

const RE12FileGeneration = () => {
	const { token } = useAuthToken.getState();
	const [loading, setLoading] = useState(false);
	const [selectedtablerow, setselectedtablerow] = useState([]);

	const {
		data: apiData,
		isLoading: isFetching,
		error: fetchError,
		refetch,
	} = useQuery({
		queryKey: ['re12GenerateData'],
		queryFn: () => getRe12IndentDetails(token.data.token),
		enabled: !!token,
	});
	// Example mutation
	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await createRe12Indent(token.data.token, payload);
		},
		onSuccess: (data) => {
			console.log(data);
			downloadCSV(data);
			console.log('RE12 file generated successfully:', data);
			enqueueSnackbar('RE22 file generated successfully', { variant: 'success' });
			setLoading(false);
			setselectedtablerow([]);
			refetch();
		},
		onError: (error) => {
			console.error('Error generating RE12 file:', error);
			enqueueSnackbar('Error generating RE12 file', { variant: 'error' });
			setLoading(false);
		},
	});

	function convertArrayToCSVWithoutQuotes(data) {
		const formattedRows = data.map((item) => `${item},,`);
		return formattedRows.join('\n');
	}

	function downloadCSV(data) {
		const csvData = convertArrayToCSVWithoutQuotes(data);
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const indentno = selectedtablerow.indentNo.replace(/\s+/g, '');
		const brandName = selectedtablerow.brandName.replace(/\s+/g, ''); // Remove spaces from brand name
		const magazineName = selectedtablerow.magname.replace(/\s+/g, ''); // Remove spaces from magazine name
		const totalCases = data.length; // Calculate total cases
		const fileName = `${indentno}_${brandName}_${magazineName}_${totalCases}_CASES.csv`;
		const a = document.createElement('a');
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', fileName);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	// Define columns for data table
	const columns = [
		{ header: 'LoadSheetNo', accessorKey: 'loadingSheet' },
		{ header: 'Indent No', accessorKey: 'indentNo' },
		{ header: 'Truck No', accessorKey: 'truckNo' },
		{ header: 'Brand', accessorKey: 'brandName' },
		{ header: 'Product Size', accessorKey: 'productSize' },
		{ header: 'Magazine ', accessorKey: 'magname' },
		{ header: 'Quantity', accessorKey: 'loadcase' },
		{
			header: 'Actions',
			cell: ({ row }) => (
				<Button variant="outline" size="sm" onClick={() => handleGenerateRE12(row.original)}>
					Generate RE12
				</Button>
			),
		},
	];

	const timeoutRef = useRef(null);

	const handleGenerateRE12 = useCallback(
		(rowData) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				setselectedtablerow(rowData);
				setLoading(true);
				mutation.mutate(rowData);
			}, 300);
		},
		[mutation],
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

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
		<Card className="p-4 shadow-md">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">RE12 File Generation</h2>
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
	);
};

export default RE12FileGeneration;

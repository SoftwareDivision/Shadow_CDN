import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getregeneratere2, regenerateRE2File } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, FileSpreadsheet, CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { enqueueSnackbar } from 'notistack';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/DataTable';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Controller, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

const RegenerateRE2FileGeneration = () => {
	const { token } = useAuthToken.getState();
	const [loading, setLoading] = useState(false);
	const [re2Data, setRE2Data] = useState([]);
	const [selectedtablerow, setselectedtablerow] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const timeoutRef = useRef(null);

	const { control, watch, setValue } = useForm({
		defaultValues: {
			fromDate: new Date(),
			toDate: new Date(),
		},
	});

	const fromDate = watch('fromDate');
	const toDate = watch('toDate');

	const {
		data: apiData,
		isLoading: isFetching,
		error: fetchError,
		refetch,
	} = useQuery({
		queryKey: ['regenaratere2GenerateData', fromDate, toDate],
		queryFn: () => {
			const from = fromDate ? new Date(fromDate).toISOString() : null;
			const to = toDate ? new Date(toDate).toISOString() : null;
			return getregeneratere2(token.data.token, from, to);
		},
		enabled: !!token,
	});

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await regenerateRE2File(token.data.token, payload);
		},
		onSuccess: (data) => {
			console.log('RE2 file generated successfully:', data);
			downloadCSV(data);
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
		{ header: 'Transfer ID', accessorKey: 'transferId' },
		{
			header: 'Transfer Date',
			accessorKey: 'transferDate',
			cell: ({ row }) => {
				const date = row.getValue('transferDate');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
			},
		},
		{ header: 'Plant', accessorKey: 'plant' },
		{ header: 'Brand Name', accessorKey: 'brandName' },
		{ header: 'Product Size', accessorKey: 'productSize' },
		{ header: 'Magazine', accessorKey: 'magazineName' },
		{ header: 'Case Quantity', accessorKey: 'caseQuantity' },
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
			if (timeoutRef.current) clearTimeout(timeoutRef.current);

			timeoutRef.current = setTimeout(() => {
				setLoading(true);
				const selectedL1Barcodes = data?.transferToMazgnieScanneddata?.map((l1) => ({
					l1barcode: l1.l1Scanned,
				}));
				const payload = {
					l1L2: selectedL1Barcodes,
					productionMagzineAllocation: data,
				};
				mutation.mutate(payload);
			}, 300);

			setselectedtablerow(data);
		},
		[mutation],
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const convertArrayToCSVWithoutQuotes = (data) =>
		data
			.map((row) =>
				Object.values(row)
					.map((val) => val)
					.join(','),
			)
			.join('\n');

	const downloadCSV = (data) => {
		const csvData = convertArrayToCSVWithoutQuotes(data);
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const mfgdt = format(new Date(), 'yyyyMMdd');
		const brandName = selectedtablerow.brandName?.replace(/\s+/g, '') || 'BRAND';
		const magazineName = selectedtablerow.magazineName?.replace(/\s+/g, '') || 'MAG';
		const totalCases = new Set(data.map((item) => item.l1barcode)).size;
		const fileName = `${mfgdt}_${brandName}_${magazineName}_${totalCases}_CASES.csv`;

		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const handleGenerateRE2 = () => {
		setLoading(true);
		const selectedL1Barcodes = selectedRows.map((l1Barcode) => ({ l1barcode: l1Barcode }));
		const payload = {
			l1L2: selectedL1Barcodes,
			productionMagzineAllocation: selectedtablerow,
		};
		mutation.mutate(payload);
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
			<Card className="p-4 shadow-md mb-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl font-bold">Regenerate RE2</h2>
				</div>

				{/* Filter UI */}
				<div className="flex gap-4 mb-4">
					<Controller
						name="fromDate"
						control={control}
						render={({ field }) => (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											'w-[200px] justify-start text-left font-normal',
											!field.value && 'text-muted-foreground',
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{field.value ? format(new Date(field.value), 'PPP') : 'From Date'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value ? new Date(field.value) : undefined}
										onSelect={(date) => field.onChange(date?.toISOString())}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						)}
					/>
					<Controller
						name="toDate"
						control={control}
						render={({ field }) => (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											'w-[200px] justify-start text-left font-normal',
											!field.value && 'text-muted-foreground',
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{field.value ? format(new Date(field.value), 'PPP') : 'To Date'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value ? new Date(field.value) : undefined}
										onSelect={(date) => field.onChange(date?.toISOString())}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						)}
					/>
					<Button variant="default" onClick={() => refetch()}>
						Apply Filter
					</Button>
				</div>

				{/* Error Alerts */}
				{fetchError && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{fetchError?.message}</AlertDescription>
					</Alert>
				)}

				<DataTable columns={columns} data={apiData || []} />
			</Card>
		</>
	);
};

export default RegenerateRE2FileGeneration;

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useAuthToken } from '@/hooks/authStore';
import { createRegenRe12Indent, getRegenRe12IndentDetails } from '@/lib/api';
import { AlertCircle, CalendarIcon, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { enqueueSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const RegenearteRE12 = () => {
	const { token } = useAuthToken.getState();
	const [loading, setLoading] = useState(false);
	const [selectedtablerow, setselectedtablerow] = useState([]);
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
		queryKey: ['re12GenerateData', fromDate, toDate],
		queryFn: () => {
			const from = fromDate ? new Date(fromDate).toISOString() : null;
			const to = toDate ? new Date(toDate).toISOString() : null;
			return getRegenRe12IndentDetails(token.data.token, from, to);
		},
		enabled: !!token,
	});

	const mutation = useMutation({
		mutationFn: async (payload) => await createRegenRe12Indent(token.data.token, payload),
		onSuccess: (data) => {
			downloadCSV(data);
			enqueueSnackbar('RE12 file generated successfully', { variant: 'success' });
			setLoading(false);
			setselectedtablerow([]);
			refetch();
		},
		onError: (error) => {
			enqueueSnackbar('Error generating RE12 file', { variant: 'error' });
			setLoading(false);
		},
	});

	const handleGenerateRE12 = useCallback(
		(rowData) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const convertArrayToCSVWithoutQuotes = (data) => data.map((item) => `${item},,`).join('\n');

	const downloadCSV = (data) => {
		const csvData = convertArrayToCSVWithoutQuotes(data);
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const indentno = selectedtablerow.indentNo?.replace(/\s+/g, '') || 'Indent';
		const brandName = selectedtablerow.brandName?.replace(/\s+/g, '') || 'Brand';
		const magazineName = selectedtablerow.magname?.replace(/\s+/g, '') || 'Magazine';
		const totalCases = data.length;
		const fileName = `${indentno}_${brandName}_${magazineName}_${totalCases}_CASES.csv`;
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const columns = [
		{ header: 'LoadingSheet No', accessorKey: 'loadingSheet' },
		{ header: 'Indent No', accessorKey: 'indentNo' },
		{ header: 'Truck No', accessorKey: 'truckNo' },
		{ header: 'Brand Name', accessorKey: 'brandName' },
		{ header: 'Product Size', accessorKey: 'productSize' },
		{ header: 'Magazine Name', accessorKey: 'magname' },
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
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold">RE12 File Generation</h2>
			</div>

			{/* Filter UI */}
			<div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 mb-2">
				<Controller
					name="fromDate"
					control={control}
					render={({ field }) => (
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										'w-full justify-start text-left font-normal',
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
										'w-full justify-start text-left font-normal',
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

			{/* Error Alert */}
			{fetchError && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{fetchError?.message}</AlertDescription>
				</Alert>
			)}

			<DataTable columns={columns} data={apiData || []} />
		</Card>
	);
};

export default RegenearteRE12;

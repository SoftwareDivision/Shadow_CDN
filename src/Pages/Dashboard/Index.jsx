import React, { useEffect, useState } from 'react';
import SectionCards from './section-cards';
import ChartAreaInteractive from './chart-area-interactive';
import DataTable from '@/components/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { CheckCircle2Icon, GripVerticalIcon, LoaderIcon, MoreVerticalIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProductionReport } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { enqueueSnackbar } from 'notistack';
import SummableDataTable from '@/components/SummableDataTable';
import { meta } from '@eslint/js';

function TableSkeleton() {
	return (
		<div className="flex flex-col animate-pulse bg-gray-100 border border-gray-200 shadow-2xs rounded-xl dark:bg-gray-800 dark:border-gray-700">
			{/* Header skeleton */}
			<div className="p-4 md:p-5 flex justify-between gap-x-3">
				<div className="flex-1 space-y-2">
					<div className="h-3 w-24 bg-gray-300 rounded dark:bg-gray-600" />
					<div className="h-6 w-32 bg-gray-400 rounded dark:bg-gray-500" />
				</div>
				<div className="shrink-0 size-11 bg-gray-300 dark:bg-gray-600 rounded-full" />
			</div>
			{[...Array(5)].map((_, index) => (
				<div key={index} className="py-3 px-4 md:px-5 border-t border-gray-200 dark:border-gray-700">
					<div className="h-4 w-full bg-gray-300 rounded dark:bg-gray-600" />
				</div>
			))}
		</div>
	);
}

function Dashboard() {
	const [reportData, setReportData] = useState(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;

	useEffect(() => {
		const fetchReportOnLoad = async () => {
			setIsLoadingReport(true);
			const data = {
				fromDate: new Date(),
				toDate: new Date(),
				reportType: 'summary',
				shift: 'all',
				plantId: 'all',
				brand: 'all',
				productsize: 'all',
			};

			const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
			const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

			const selectedShift = data.shift === 'all' ? '' : data.shift;
			const selectedPlant = data.plantId === 'all' ? '' : data.plantId;
			const selectedBrand = data.brand === 'all' ? '' : data.brand;
			const selectedProductSize = data.productsize === 'all' ? '' : data.productsize;

			const reportParams = {
				fromDate: formattedFromDate,
				toDate: formattedToDate,
				reportType: data.reportType,
				shift: selectedShift,
				plant: selectedPlant,
				brand: selectedBrand,
				productsize: selectedProductSize,
			};
			// console.log('Report Params on Load:', reportParams);

			try {
				const result = await getProductionReport(tokendata, reportParams);
				// console.log('Report Data on Load:', result);
				setReportData(result);
			} catch (error) {
				enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
			} finally {
				setIsLoadingReport(false);
			}
		};

		fetchReportOnLoad();
	}, []);

	const summaryReportColumns = [
		{
			accessorKey: 'plantname',
			header: 'Plant Name',
		},
		{
			accessorKey: 'shift',
			header: 'Shift',
		},
		{
			accessorKey: 'brandname',
			header: 'Brand Name',
		},
		{
			accessorKey: 'productsize',
			header: 'Product Size',
		},
		{
			accessorKey: 'boxcount',
			header: 'Box Qty.',
			meta: { isSummable: true },
		},
		{
			accessorKey: 'l1netqty',
			header: 'Net Wt.',
			meta: {
				isSummable: true,
			},
		},
		{
			accessorKey: 'l1netunit',
			header: 'Net Unit',
		},
	];

	return (
		<>
			<div className="@container/main flex flex-1 flex-col gap-2">
				<div className="flex flex-col gap-4 md:gap-4">
					<SectionCards />
					<ChartAreaInteractive />
					<Card className="w-full p-4 shadow-md">
						<CardHeader className="items-center pb-0 -ml-6">
							<CardTitle>Brand-Wise Production (Today)</CardTitle>
							<CardDescription>Overall Production Details</CardDescription>
						</CardHeader>
						{isLoadingReport ? (
							<TableSkeleton />
						) : (
							<SummableDataTable data={reportData || []} columns={summaryReportColumns} />
						)}
					</Card>
				</div>
			</div>
		</>
	);
}

export default Dashboard;

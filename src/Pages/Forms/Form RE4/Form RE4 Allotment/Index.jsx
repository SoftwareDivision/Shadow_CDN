import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getFromRE4AllotData, getFromRE4Allotment } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DataTable from '@/components/DataTable';
import Loader from '@/components/Loader';

function FormRE4_Allotment() {
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;

	// Form validation schema
	const formSchema = yup.object().shape({
		fromDate: yup.date().required('From date is required'),
		truckno: yup.string().required('Truck number is required'),
		bname: yup.string().required('Brand name is required'),
		bcode: yup.string().required('Brand code is required'),
		magname: yup.string().required('Magazine name is required'),
		indent: yup.string().required('Indent is required'),
		re12: yup.string().required('RE 12 is required'),
	});

	const {
		handleSubmit,
		setValue,
		reset,
		register,
		control,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(formSchema),
		defaultValues: {
			fromDate: new Date(),
			magname: '',
			truckno: '',
			bname: '',
			bcode: '',
			indent: '',
			re12: '',
		},
	});

	const [fromDate, setFromDate] = React.useState(null);
	const [magazine, setMagzine] = useState([]);
	const [indents, setIndent] = useState([]);
	const [reportData, setReportData] = React.useState(null);
	const [isLoadingReport, setIsLoadingReport] = React.useState(false);
	const { enqueueSnackbar } = useSnackbar();

	const {
		data: IndentData,
		isLoading: isIndentFetching,
		error: fetchIndentError,
	} = useQuery({
		queryKey: ['IndentData', fromDate],
		queryFn: () => {
			const formattedDate = fromDate ? format(fromDate, 'MM-dd-yyyy') : null;
			return getFromRE4Allotment(tokendata, { fromDate: formattedDate });
		},
		enabled: !!tokendata && !!fromDate,
	});

	useEffect(() => {
		if (IndentData) {
			const IndentOptions = [...new Set(IndentData?.map((indent) => indent.indentNo))].sort().map((indentNo) => {
				const indentObj = IndentData.find((indent) => indent.indentNo === indentNo);
				return {
					value: indentNo,
					text: indentNo,
					disabled: false,
					brand: indentObj?.brand || '',
					bid: indentObj?.bid || '',
				};
			});
			setIndent(IndentOptions);

			const magazineOptions = [...new Set(IndentData?.map((indent) => indent.magName))].sort().map((magName) => ({
				value: magName,
				text: magName,
				disabled: false,
			}));
			setMagzine(magazineOptions);
		}
	}, [reset, IndentData]);

	const onSubmit = async (data) => {
		setIsLoadingReport(true);
		setReportData(null);

		const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
		// const selectedIndent = data.indent.replace('/', '.');
		const selectedIndent = data.indent.replace(/\//g, '.');
		const selectedBrand = data.bname;
		const selectedBrandCode = data.bcode;
		const selectedMagazine = data.magname;
		const selectedTruck = data.truckno;
		const selectedRe12 = data.re12;

		const reportParams = {
			fromDate: formattedFromDate,
			indent: selectedIndent,
			bname: selectedBrand,
			bcode: selectedBrandCode,
			magname: selectedMagazine,
			truckno: selectedTruck,
			re12: selectedRe12,
		};

		console.log('Report params:', reportParams);

		try {
			const result = await getFromRE4AllotData(tokendata, reportParams);
			enqueueSnackbar('Report fetched successfully', { variant: 'success' });
			setReportData(result.StockSoldSummary);
			setIsLoadingReport(false);
		} catch (error) {
			enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
		}
	};

	const loading = isLoadingReport || isIndentFetching;
	const allerrors = fetchIndentError;

	if (allerrors) {
		enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}

	const detailedReportColumns = [
		{
			accessorKey: 'mfgdt',
			header: 'Date',
			cell: ({ row }) => {
				const date = row.getValue('mfgdt');
				return date ? format(new Date(date), 'dd/MM/yyyy') : '';
			},
		},
		{
			header: '(Des) Name',
			cell: ({ row }) => {
				const magazine = row.original.bname;
				const size = row.original.productsize;
				return (
					<div className="text-center">
						<div>{magazine}</div>
						<div>{size}</div>
					</div>
				);
			},
		},
		{
			accessorKey: 'class',
			header: '(Des) Class',
		},
		{
			accessorKey: 'div',
			header: '(Des) Division',
		},
		{
			accessorKey: 'opening',
			header: 'Opening',
		},
		{
			header: '(Sold by) Name',
			cell: ({ row }) => {
				const magazine = row.original.recbname;
				const size = row.original.recproductsize;
				return (
					<div className="text-center">
						<div>{magazine}</div>
						<div>{size}</div>
					</div>
				);
			},
		},
		{
			accessorKey: 'class',
			header: '(Sold by) Class',
		},
		{
			accessorKey: 'div',
			header: '(Sold by) Division',
		},
		{
			accessorKey: 'quantity',
			header: 'Quantity',
		},
		{
			accessorKey: 'batch',
			header: 'Batch No.',
		},
		{
			accessorKey: 'licence',
			header: () => (
				<div>
					<div> Nane , Adress and licence</div>
					<div>number of person to</div>
					<div> Whom explosives are sold</div>
				</div>
			),
		},
		{
			accessorKey: 'transport',
			header: () => (
				<div>
					<div>Mode Of transport</div>
					<div>and road van licence</div>
					<div>number is transported by road</div>
				</div>
			),
		},
		{
			accessorKey: 'passno',
			header: 'Pass No.',
		},
		{
			accessorKey: 'closing',
			header: 'Closing Balance',
		},
		{
			accessorKey: 'remarks',
			header: 'Remarks',
		},
		{
			accessorKey: 'fgh',
			header: () => (
				<div>
					<div>Signature of licensee</div>
					<div>or person in charge</div>
				</div>
			),
		},
	];

	return (
		<Card className="p-4 shadow-md">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-semibold">Form RE4 Allotment</h1>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{/* From Date */}
				<div className="grid grid-cols-1 gap-5">
					<div className="grid grid-cols-3 gap-4">
						<div>
							<label htmlFor="fromDate" className="text-sm font-medium">
								From Date
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={'outline'}
										className={cn(
											'w-full justify-start text-left font-normal',
											!fromDate && 'text-muted-foreground',
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{fromDate ? format(fromDate, 'PPP') : format(new Date(), 'PPP')}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={fromDate}
										onSelect={(date) => {
											setFromDate(date);
											setValue('fromDate', date);
										}}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
							{errors.fromDate && (
								<span className="text-destructive text-sm">{errors.fromDate.message}</span>
							)}
						</div>

						{/* Re11 Indent */}
						<div className="flex flex-col gap-y-2">
							<Controller
								name="indent"
								control={control}
								render={({ field }) => (
									<div className="flex flex-col gap-y-2">
										<Label>Re11 Indent</Label>
										<Select
											value={field.value}
											onValueChange={(value) => {
												field.onChange(value);
												const selectedIndent = IndentData?.find(
													(indent) => indent.indentNo === value,
												);
												if (selectedIndent) {
													// setValue("truckno", selectedIndent.truckNo);
													// setValue("bname", selectedIndent.brand);
													// setValue("magname", selectedIndent.magName);
												}
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select Indent..." />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{indents.map((indent) => (
														<SelectItem key={indent.value} value={indent.value}>
															{indent.text}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										{errors.indent && (
											<span className="text-destructive text-sm">{errors.indent.message}</span>
										)}
									</div>
								)}
							/>
						</div>

						{/* Truck Number */}
						<div className="flex flex-col gap-y-2">
							<Controller
								name="truckno"
								control={control}
								render={({ field }) => (
									<div className="flex flex-col gap-y-2">
										<Label>Truck No.</Label>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select Truck Number..." />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{[...new Set(IndentData?.map((item) => item.truckNo))].map(
														(truck) => (
															<SelectItem key={truck} value={truck}>
																{truck}
															</SelectItem>
														),
													)}
												</SelectGroup>
											</SelectContent>
										</Select>
										{errors.truckno && (
											<span className="text-destructive text-sm">{errors.truckno.message}</span>
										)}
									</div>
								)}
							/>
						</div>
					</div>
				</div>

				{/* Brand & Magazine Section */}
				<div className="grid grid-cols-2 gap-5">
					{/* Brand Name */}
					<div className="flex flex-col gap-y-2">
						<Controller
							name="bname"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Brand Name</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											const selectedIndent = IndentData?.find((item) => item.brand === value);
											if (selectedIndent) {
												setValue('bcode', selectedIndent.bid);
											} else {
												setValue('bcode', '');
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Brand..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{[...new Set(IndentData?.map((item) => item.brand))].map((brand) => (
													<SelectItem key={brand} value={brand}>
														{brand}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.bname && (
										<span className="text-destructive text-sm">{errors.bname.message}</span>
									)}
								</div>
							)}
						/>
					</div>

					{/* Brand Code */}
					<div className="flex flex-col gap-y-2">
						<Label>Brand Code</Label>
						<Input
							{...register('bcode')}
							readOnly
							placeholder="Brand Code..."
							className={errors.bcode ? 'border-red-500' : ''}
						/>
						{errors.bcode && <span className="text-destructive text-sm">{errors.bcode.message}</span>}
					</div>

					{/* Magazine Name */}
					<div className="flex flex-col gap-y-2">
						<Controller
							name="magname"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Magazine Name</Label>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Magazine..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{magazine.map((mag) => (
													<SelectItem key={mag.value} value={mag.value}>
														{mag.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.magname && (
										<span className="text-destructive text-sm">{errors.magname.message}</span>
									)}
								</div>
							)}
						/>
					</div>

					{/* Brand Code */}
					<div className="flex flex-col gap-y-2">
						<Label>RE 12</Label>
						<Input
							{...register('re12')}
							placeholder="RE 12..."
							className={errors.bcode ? 'border-red-500' : ''}
						/>
						{errors.re12 && <span className="text-destructive text-sm">{errors.re12.message}</span>}
					</div>
				</div>

				{/* Submit Button */}
				<Button type="submit" disabled={isLoadingReport}>
					{isLoadingReport ? 'Generating Report...' : 'Generate Report'}
				</Button>
			</form>

			{/* Report Table */}
			<div>
				{reportData ? (
					<DataTable columns={detailedReportColumns} data={reportData} />
				) : (
					<p className="text-center">No report data available.</p>
				)}
			</div>
		</Card>
	);
}

export default FormRE4_Allotment;

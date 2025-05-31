import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { format, set } from 'date-fns';
import { CalendarIcon, Loader2, AlertCircle, CheckCircle, Search, Printer } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthToken } from '@/hooks/authStore';
import { enqueueSnackbar } from 'notistack';
import {
	getMachineDetails,
	getPlantDetails,
	getProductDetails,
	getShiftDetails,
	reprintL1Barcode,
	reprintL2Barcode,
	sendreprintL1Barcode,
	sendreprintL2Barcode,
} from '@/lib/api';
import DataTable from '@/components/DataTable';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const schema = yup.object().shape({
	mfgDt: yup.string().required('Manufacturing Date is required'),
	plantName: yup.string().required('Plant Name is required'),
	pCode: yup.string(), // Assuming Plant Code is derived and not directly validated
	mCode: yup.string().required('Machine Code is required'),
	fromsrno: yup.string().required('from srno is required'),
	tosrno: yup.string().required('to srno  is required'),
});

export default function L2ReprintAllDetails() {
	const [reprintDate, setReprintDate] = useState(new Date()); // Set default to today's date
	const [plants, setPlants] = useState([]);
	const [machines, setMachines] = useState([]);
	const [shifts, setShifts] = useState([]);
	const [products, setProducts] = useState([]);
	const [productSizes, setProductSizes] = useState([]);
	const { token } = useAuthToken();
	const tokendata = token.data.token;
	const [data, setdata] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [remark, setRemark] = useState('NA');
	const [noOfCopies, setNoOfCopies] = useState(1);

	const {
		data: plantData,
		isLoading: isPlantFetching,
		error: fetchplantError,
	} = useQuery({
		queryKey: ['plantData'],
		queryFn: () => getPlantDetails(tokendata),
		enabled: !!tokendata,
	});

	//machine details
	const {
		data: machineData,
		isLoading: isMachineFetching,
		error: fetchMachineError,
	} = useQuery({
		queryKey: ['machineData'],
		queryFn: () => getMachineDetails(tokendata),
		enabled: !!tokendata,
	});

	//shift details
	const {
		data: shiftData,
		isLoading: isShiftFetching,
		error: fetchShiftError,
	} = useQuery({
		queryKey: ['shiftData'],
		queryFn: () => getShiftDetails(tokendata),
		enabled: !!tokendata,
	});

	//Product details
	const {
		data: productData,
		isLoading: isProductFetching,
		error: fetchProductError,
	} = useQuery({
		queryKey: ['productData'],
		queryFn: () => getProductDetails(tokendata),
		enabled: !!tokendata,
	});

	const {
		register,
		handleSubmit,
		control,
		reset,
		setError,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			mCode: '',
			mfgDt: new Date().toISOString(),
			pCode: '',
			plantName: '',
			fromsrno: 1,
			tosrno: 1,
		},
	});
	const selectedPlant = watch('plantName');

	useEffect(() => {
		if (plantData) {
			const plantOptions = plantData?.map((plant) => ({
				value: plant.pName,
				text: plant.pName,
				disabled: false,
			}));
			setPlants(plantOptions);
		}
	}, [reset, plantData, machineData, shiftData]);

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await reprintL2Barcode(tokendata, payload);
		},
		onSuccess: (data) => {
			console.log('Reprint data:', data);
			setdata(data);
			setIsSubmitting(false);
		},
		onError: (error) => {
			console.error('Error When Reprint', error);
			setIsSubmitting(false);
		},
	});

	const onSubmit = (data) => {
		setIsSubmitting(true);
		const payload = {
			mfgdt: format(data.mfgDt, 'yyyy-MM-dd'), // Manufacturing Date
			plant: data.plantName, // Plant Name
			plantcode: data.pCode, // Assuming plantCode might be derived or empty
			mcode: data.mCode, // Shift
			fromsrno: data.fromsrno, // From Sr.No
			tosrno: data.tosrno, // To Sr.No
			l2barcode: ' ', // This field is not used in 'All Details' reprint, send blank
		};
		mutation.mutate(payload, {
			onSettled: () => console.log('Mutation settled'),
		});
	};

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedRows(data.map((row) => row.l2Barcode));
		} else {
			setSelectedRows([]);
		}
	};

	const handleSelectRow = (l2Barcode) => {
		setSelectedRows((prev) =>
			prev.includes(l2Barcode) ? prev.filter((code) => code !== l2Barcode) : [...prev, l2Barcode],
		);
	};

	const isLoading = isPlantFetching || isMachineFetching || isShiftFetching || isProductFetching || isSubmitting;
	const isError = fetchplantError || fetchMachineError || fetchShiftError || fetchProductError;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}
	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-2 mb-2">
				{isError && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{isError.message}</AlertDescription>
					</Alert>
				)}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					<div className="flex flex-col gap-y-2">
						<Label htmlFor="reprintDate">Reprint Date</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={'outline'}
									className={`w-full justify-start text-left font-normal ${
										!reprintDate && 'text-muted-foreground'
									}`}
									disabled
								>
									{reprintDate ? format(reprintDate, 'PPP') : <span>Pick a date</span>}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar mode="single" selected={reprintDate} onSelect={setReprintDate} initialFocus />
							</PopoverContent>
						</Popover>
					</div>
				</div>
				<div className="relative my-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center">
						<span className="bg-transparent  px-2 text-sm font-medium">Manufacturing Details</span>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					<div className="flex flex-col gap-y-2">
						<Label>Manufacturing Date</Label>

						<Controller
							name="mfgDt"
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
											{field.value ? (
												format(new Date(field.value), 'PPP')
											) : (
												<span>Pick a date</span>
											)}
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

						{errors.mfgDt && <span className="text-destructive text-sm">{errors.mfgDt.message}</span>}
					</div>
					<div className="flex flex-col gap-y-2">
						<Controller
							name="plantName"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Plant Name</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											const selected = plantData.find((p) => p.pName === value);
											if (selected) {
												setValue('pCode', selected.pCode);
												const machineOptions = [
													...new Set(
														machineData
															?.filter((product) => product.pname === selected.pName) // Filter first
															?.map((machine) => machine.mcode),
													),
												]
													.sort()
													.map((mcode) => ({
														value: mcode,
														text: mcode,
														disabled: false,
													}));

												setMachines(machineOptions);
												const productOptions = [
													...new Set(
														productData
															?.filter((product) => product.ptype === selected.pName) // Filter first
															?.map((product) => product.bname), // Then extract names
													),
												]
													.sort((a, b) => a.localeCompare(b)) // Proper alphabetical sort
													.map((bname) => ({
														value: bname,
														text: bname,
														disabled: false,
													}));
												setProducts(productOptions);
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select plant..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{plants.map((plant) => (
													<SelectItem
														key={plant.value}
														value={plant.value}
														disabled={plant.disabled}
													>
														{plant.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.plant && (
										<span className="text-destructive text-sm">{errors.plant.message}</span>
									)}
								</div>
							)}
						/>
					</div>
					{/* Plant Code Display */}
					<div className="flex flex-col gap-y-2">
						<Label>Plant Code</Label>
						<Input
							{...register('pCode')}
							readOnly
							value={plantData?.find((p) => p.pName === selectedPlant)?.pCode || ''}
						/>
						{errors.pCode && <span className="text-destructive text-sm">{errors.pCode.message}</span>}
					</div>

					<div className="flex flex-col gap-y-2">
						<Controller
							name="mCode"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Machine Code</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Machine..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{machines.map((machine) => (
													<SelectItem
														key={machine.value}
														value={machine.value}
														disabled={machine.disabled}
													>
														{machine.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.mCode && (
										<span className="text-destructive text-sm">{errors.mCode.message}</span>
									)}
								</div>
							)}
						/>
					</div>
					<div className="flex flex-col gap-y-2">
						<Controller
							name="fromsrno"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>From Sr.No</Label>
									<Input {...field} type="number" min={1} placeholder="Enter From Sr.No" />
									{errors.fromsrno && (
										<span className="text-destructive text-sm">{errors.fromsrno.message}</span>
									)}
								</div>
							)}
						/>
					</div>
					<div className="flex flex-col gap-y-2">
						<Controller
							name="tosrno"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>To Sr.No</Label>
									<Input {...field} type="number" min={1} placeholder="Enter To Sr.No" />
									{errors.tosrno && (
										<span className="text-destructive text-sm">{errors.tosrno.message}</span>
									)}
								</div>
							)}
						/>
					</div>
				</div>
				<div className="md:col-span-2 lg:col-span-3 mt-4 flex justify-end">
					<Button type="submit">
						<Search className="mr-2 h-4 w-4" /> Search
					</Button>
				</div>
			</form>
			{data && data.length > 0 && (
				<div className="rounded-md w-full max-w-5xl">
					<div className="overflow-auto scrollbar-thin" style={{ maxHeight: '400px' }}>
						<Table className="min-w-full">
							<TableHeader className="bg-muted">
								<TableRow>
									<TableHead className="font-medium sticky top-0 z-10 border-b">
										<Checkbox
											className="border-blue-600 border-2"
											checked={selectedRows.length === data.length && data.length > 0}
											onCheckedChange={handleSelectAll}
											aria-label="Select all"
										/>{' '}
										Select all
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										L2 Barcode
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Sr No
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Plant Name
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Brand Name
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Product Size
									</TableHead>
									<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
										Mfg Date
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((row) => (
									<TableRow
										key={row.l2Barcode}
										className={
											selectedRows.includes(row.l2Barcode) ? 'bg-blue-50 dark:bg-blue-900' : ''
										}
									>
										<TableCell>
											<Checkbox
												className="border-blue-600 border-2"
												checked={selectedRows.includes(row.l2Barcode)}
												onCheckedChange={() => handleSelectRow(row.l2Barcode)}
												aria-label={`Select row ${row.l2Barcode}`}
											/>
										</TableCell>
										<TableCell className="font-medium text-center">{row.l2Barcode}</TableCell>
										<TableCell className="font-medium text-center">{row.srNo}</TableCell>
										<TableCell className="font-medium text-center">{row.plantName}</TableCell>
										<TableCell className="font-medium text-center">{row.brandName}</TableCell>
										<TableCell className="font-medium text-center">{row.productSize}</TableCell>
										<TableCell className="font-medium text-center">
											{row.mfgDt ? format(new Date(row.mfgDt), 'dd-MM-yyyy') : ''}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<div className="mt-4 mb-4">
						<div className="flex flex-col md:flex-row items-center gap-4">
							{/* Remarks */}
							<div className="flex-1 w-full">
								<Label htmlFor="remark">Remarks</Label>
								<Textarea
									id="remark"
									value={remark}
									onChange={(e) => setRemark(e.target.value)}
									placeholder="Enter remarks here..."
									className="w-full border rounded px-3 py-2 mt-1 resize-none"
									rows={1}
									style={{ minHeight: 40, maxHeight: 80 }}
								/>
							</div>
							{/* No. of Copies */}
							<div className="flex flex-col items-start">
								<Label htmlFor="noOfCopies">No. of Copies</Label>
								<Input
									id="noOfCopies"
									type="number"
									min={1}
									max={10}
									value={noOfCopies}
									onChange={(e) => setNoOfCopies(Number(e.target.value))}
									className="w-24 border rounded px-3 py-2 mt-1"
									placeholder="Enter number"
								/>
							</div>
							{/* Button */}
							<div className="flex items-end h-full">
								<Button
									className="px-4 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50 mt-4 md:mt-4"
									onClick={() => {
										const selectedData = data.filter((row) => selectedRows.includes(row.l2Barcode));
										if (selectedData.length === 0) {
											enqueueSnackbar('No rows selected for reprint.', { variant: 'warning' });
											return;
										}
										if (!remark.trim() || remark.trim() === '') {
											enqueueSnackbar('Remarks cannot be empty.', { variant: 'warning' });
											return;
										}

										if (noOfCopies < 1) {
											enqueueSnackbar('No. of copies must be at least 1.', {
												variant: 'warning',
											});
											return;
										}

										const payload = {
											reprintData: selectedData,
											reason: remark.trim(),
											noOfCopies: Number(noOfCopies),
										};
										console.log('Payload:', payload);
										sendreprintL2Barcode(tokendata, payload)
											.then(() => {
												enqueueSnackbar('Reprint request sent successfully!', {
													variant: 'success',
												});
												setRemark('NA');
												setSelectedRows([]);
												setdata([]);
												reset();
											})
											.catch((error) => {
												enqueueSnackbar(error.message || 'Failed to send reprint request.', {
													variant: 'error',
												});
											});
									}}
									disabled={selectedRows.length === 0}
								>
									<Printer className="mr-2 h-4 w-4" /> Reprint Print
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

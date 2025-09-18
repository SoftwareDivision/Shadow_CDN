import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthToken } from '@/hooks/authStore';
import { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Controller } from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
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
import { enqueueSnackbar } from 'notistack';
import {
	createL1Generate,
	getL1GenerateData,
	getMachineDetails,
	getPlantDetails,
	getProductDetails,
	getShiftDetails,
	getl1l2l3,
} from '@/lib/api';
import Loader from '@/components/Loader';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const schema = yup.object().shape({
	country: yup.string().required('Country is required'),
	countryCode: yup.string().max(2, 'Max 2 characters').required('Country code is required'),
	mfgName: yup.string().required('Manufacturer name is required'),
	mfgLoc: yup.string().required('Manufacturer location is required'),
	mfgCode: yup.string().required('Manufacturer code is required'),
	plantName: yup
		.string()
		.required('Plant selection is required')
		.test('not-default', 'Plant selection is required', (value) => value !== '' && value !== undefined),
	pCode: yup.string().required('Product code is required'),
	mCode: yup.string().required('Material code is required'),
	shift: yup.string().required('Shift is required'),
	brandName: yup.string().required('Brand name is required'),
	brandId: yup.string().required('Brand ID is required'),
	productSize: yup.string().required('Product size is required'),
	pSizeCode: yup.string().required('Size code is required'),
	class: yup.string().required('Class is required'),
	division: yup.string().required('Division is required'),
	sdCat: yup.string().required('SD Category is required'),
	unNoClass: yup.string().required('UN Number Class is required'),
	mfgDt: yup
		.date()
		.required('Manufacturing date is required')
		.test('is-today', 'Manufacturing date must be todays date', (value) => {
			if (!value) return false;
			const today = new Date();
			const mfgDate = new Date(value);
			return (
				mfgDate.getDate() === today.getDate() &&
				mfgDate.getMonth() === today.getMonth() &&
				mfgDate.getFullYear() === today.getFullYear()
			);
		}),
	l1NetWt: yup.number().min(0, 'Weight must be positive').required('Net weight is required'),
	l1NetUnit: yup.string().required('Net unit is required'),
	noOfL2: yup.number().min(0, 'Must be 0 or more').required('L2 count required'),
	noOfL3perL2: yup.number().min(0, 'Must be 0 or more').required('L3 per L2 required'),
	noOfL3: yup.number().min(0, 'Must be 0 or more').required('L3 count required'),
	noOfbox: yup.number().min(1, 'Must be 1 or more').max(200, 'Max 200').required('Box count required'),
	noOfstickers: yup
		.number()
		.min(1, 'Must be 1 or more')
		.max(10, 'Max 10 Sticker Allowed')
		.required('Sticker count required'),
});

export default function L1BarcodeGeneration() {
	const { token, isExpired } = useAuthToken.getState();
	const [plants, setPlants] = useState([]);
	const [machines, setMachines] = useState([]);
	const [shifts, setShifts] = useState([]);
	const [products, setProducts] = useState([]);
	const [productSizes, setProductSizes] = useState([]);
	const tokendata = token.data.token;
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [formData, setFormData] = useState(null);

	// Data fetching
	const {
		data: initialData,
		isLoading: isFetching,
		error: fetchError,
	} = useQuery({
		queryKey: ['l1GenerateData'],
		queryFn: () => getL1GenerateData(tokendata),
		enabled: !!tokendata,
	});
	//plant details
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

	// Form submission
	const {
		mutateAsync: submitForm,
		isPending: isSubmitting,
		error: submitError,
	} = useMutation({
		mutationFn: (data) => createL1Generate(tokendata, data),
		onSuccess: (data) => {
			enqueueSnackbar('Barcode generated successfully!', { variant: 'success' });
			reset(
				initialData || {
					mfgDt: new Date().toISOString(),
				},
			);
		},
		onError: (error) => enqueueSnackbar(error.message || 'Submission failed', { variant: 'error' }),
	});

	const {
		register,
		control,
		reset,
		watch,
		setValue,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			mfgDt: new Date().toISOString(),
		},
	});

	const selectedPlant = watch('plantName');
	const selectedbrandname = watch('brandName');

	useEffect(() => {
		if (initialData) {
			reset({
				...initialData,
				mfgDt: initialData.mfgDt || new Date().toISOString(),
			});
		}
		if (plantData) {
			const plantOptions = plantData?.map((plant) => ({
				value: plant.pName,
				text: plant.pName,
				disabled: false,
			}));
			setPlants(plantOptions);
		}
		if (shiftData) {
			const shiftOptions = [...new Set(shiftData?.map((shift) => shift.shift))].sort().map((shift) => ({
				value: shift,
				text: shift,
				disabled: false,
			}));
			setShifts(shiftOptions);
		}
	}, [initialData, reset, plantData, machineData, shiftData]);

	const handlePSizeChange = async () => {
		const currentBid = watch('brandId');
		const currentShift = watch('shift');
		const currentPcode = watch('pCode');
		const mcode = watch('mCode');
		const selectedPSizeCode = watch('pSizeCode');
		const currentMfgDt = format(new Date(watch('mfgDt')), 'yyyy-MM-dd');
		const countycode = watch('countryCode');
		const mfglocationcode = watch('mfgCode');

		const reportParams = {
			pcode: currentPcode,
			brandid: currentBid,
			productsize: selectedPSizeCode,
			shift: currentShift,
			mcode: mcode,
			countycode: countycode,
			mfglocationcode: mfglocationcode,
			mfgdt: currentMfgDt,
		};

		console.log('Report Params:', reportParams);

		try {
			// Make the API call using the new function
			const result = await getl1l2l3(tokendata, reportParams);
			console.log('L1, L2, L3 Data:', result);

			setValue('l1', result?.l1barcode);
			setValue('l2', result?.l2barcode);
			setValue('l3', result?.l3barcode);
		} catch (error) {
			console.log(error.message || 'Failed to fetch Data', { variant: 'error' });
		}
	};

	const onSubmit = (data) => {
		setFormData(data);
		setShowConfirmDialog(true);
	};

	const handleConfirm = async () => {
		try {
			await submitForm(formData);
			setShowConfirmDialog(false);
		} catch (error) {
			console.error('Submission error:', error);
		}
	};

	// Combined loading state
	const isLoading =
		isFetching || isSubmitting || isPlantFetching || isMachineFetching || isShiftFetching || isProductFetching;
	const isError =
		fetchError || submitError || fetchplantError || fetchMachineError || fetchShiftError || fetchProductError;
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}
	return (
		<>
			<Card className="shadow-md w-full">
				<CardContent className="relative">
					{/* Error Alerts */}
					{isError && (
						<Alert variant="destructive" className="mb-4">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{isError.message}</AlertDescription>
						</Alert>
					)}

					{submitError && (
						<Alert variant="destructive" className="mb-4">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{submitError.message}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
						{/* Section 1: Date Information */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							<div className="flex flex-col gap-y-2">
								<Label>Manufacturing Date</Label>

								<Controller
									name="mfgDt"
									control={control}
									render={({ field }) => (
										<Input
											readOnly
											value={field.value ? format(new Date(field.value), 'dd/MM/yyyy') : ''}
											className="w-full"
										/>
									)}
								/>

								{errors.mfgDt && (
									<span className="text-destructive text-sm">{errors.mfgDt.message}</span>
								)}
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
								<Label>Country</Label>
								<Input {...register('country')} />
								{errors.country && (
									<span className="text-destructive text-sm">{errors.country.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Label>Country Code</Label>
								<Input {...register('countryCode')} maxLength={2} />
								{errors.countryCode && (
									<span className="text-destructive text-sm">{errors.countryCode.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Label>Manufacturer Name</Label>
								<Input {...register('mfgName')} />
								{errors.mfgName && (
									<span className="text-destructive text-sm">{errors.mfgName.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Label>Manufacturer Location</Label>
								<Input {...register('mfgLoc')} />
								{errors.mfgLoc && (
									<span className="text-destructive text-sm">{errors.mfgLoc.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Label>Manufacturer Code</Label>
								<Input {...register('mfgCode')} />
								{errors.mfgCode && (
									<span className="text-destructive text-sm">{errors.mfgCode.message}</span>
								)}
							</div>
						</div>

						<div className="relative my-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center">
								<span className="bg-transparent  px-2 text-sm font-medium">Plant Details</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
																	?.filter(
																		(product) => product.pname === selected.pName,
																	) // Filter first
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
																	?.filter(
																		(product) => product.ptype === selected.pName,
																	) // Filter first
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
								{errors.pCode && (
									<span className="text-destructive text-sm">{errors.pCode.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Controller
									name="shift"
									control={control}
									render={({ field }) => (
										<div className="flex flex-col gap-y-2">
											<Label>Shift</Label>
											<Select
												value={field.value}
												onValueChange={(value) => {
													field.onChange(value);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select Shift..." />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{shifts.map((shift) => (
															<SelectItem
																key={shift.value}
																value={shift.value}
																disabled={shift.disabled}
															>
																{shift.text}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
											{errors.shift && (
												<span className="text-destructive text-sm">{errors.shift.message}</span>
											)}
										</div>
									)}
								/>
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
						</div>

						<div className="relative my-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center">
								<span className="bg-transparent  px-2 text-sm font-medium">Product Details</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							<div className="flex flex-col gap-y-2">
								<Controller
									name="brandName"
									control={control}
									render={({ field }) => (
										<div className="flex flex-col gap-y-2">
											<Label>Brand Name</Label>
											<Select
												value={field.value}
												onValueChange={(value) => {
													field.onChange(value);
													const selected = productData?.find((p) => p.bname === value);
													if (selected) {
														setValue('brandId', selected?.bid);
													}
													const productOptions = [
														...new Set(
															productData
																?.filter((product) => product.bid === selected.bid) // Filter first
																?.map((product) => product.psize), // Then extract names
														),
													]
														.sort((a, b) => a.localeCompare(b)) // Proper alphabetical sort
														.map((psize) => ({
															value: psize,
															text: psize,
															disabled: false,
														}));
													setProductSizes(productOptions);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select Brand..." />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{products.map((plant) => (
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

							<div className="flex flex-col gap-y-2">
								<Label>Brand Id</Label>
								<Input
									{...register('brandId')}
									readOnly
									value={productData?.find((p) => p.bname === selectedbrandname)?.bid || ''}
								/>
								{errors.brandId && (
									<span className="text-destructive text-sm">{errors.brandId.message}</span>
								)}
							</div>
							<div className="flex flex-col gap-y-2">
								<Controller
									name="productSize"
									control={control}
									render={({ field }) => (
										<div className="flex flex-col gap-y-2">
											<Label>Product Size</Label>
											<Select
												value={field.value}
												onValueChange={(value) => {
													field.onChange(value);
													const selected = productData.find((p) => p.psize === value);
													if (selected) {
														setValue('pSizeCode', selected.psizecode);
														setValue('l1NetWt', selected.l1netwt);
														setValue('class', selected.class);
														setValue('division', selected.division);
														setValue('sdCat', selected.sdcat);
														setValue('unNoClass', selected.unnoclass);
														setValue('l1NetUnit', selected.unit);
														setValue('noOfL2', selected.noofl2);
														setValue('noOfL3perL2', selected.noofl3perl2);
														setValue('noOfL3', selected.noofl3perl1);
														handlePSizeChange();
													}
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select plant..." />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{productSizes.map((plant) => (
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
											{errors.productSize && (
												<span className="text-destructive text-sm">
													{errors.productSize.message}
												</span>
											)}
										</div>
									)}
								/>
							</div>
							<div className="flex flex-col gap-y-2">
								<Label>Product Size Code</Label>
								<Input {...register('pSizeCode')} readOnly />
								{errors.pCode && (
									<span className="text-destructive text-sm">{errors.pSizeCode.message}</span>
								)}
							</div>
							{/* Class */}
							<div className="flex flex-col gap-y-2">
								<Label>Class</Label>
								<Input {...register('class')} readOnly />
								{errors.class && (
									<span className="text-destructive text-sm">{errors.class.message}</span>
								)}
							</div>

							{/* Division */}
							<div className="flex flex-col gap-y-2">
								<Label>Division</Label>
								<Input {...register('division')} readOnly />
								{errors.division && (
									<span className="text-destructive text-sm">{errors.division.message}</span>
								)}
							</div>

							{/* SD Category */}
							<div className="flex flex-col gap-y-2">
								<Label>SD Category</Label>
								<Input {...register('sdCat')} readOnly />
								{errors.sdCat && (
									<span className="text-destructive text-sm">{errors.sdCat.message}</span>
								)}
							</div>

							{/* UN Number Class */}
							<div className="flex flex-col gap-y-2">
								<Label>UN Number Class</Label>
								<Input {...register('unNoClass')} readOnly />
								{errors.unNoClass && (
									<span className="text-destructive text-sm">{errors.unNoClass.message}</span>
								)}
							</div>

							{/* L1 Net Weight */}
							<div className="flex flex-col gap-y-2">
								<Label>L1 Net Weight</Label>
								<Input type="number" {...register('l1NetWt')} readOnly />
								{errors.l1NetWt && (
									<span className="text-destructive text-sm">{errors.l1NetWt.message}</span>
								)}
							</div>

							{/* L1 Net Unit */}
							<div className="flex flex-col gap-y-2">
								<Label>L1 Net Unit</Label>
								<Input {...register('l1NetUnit')} readOnly />
								{errors.l1NetUnit && (
									<span className="text-destructive text-sm">{errors.l1NetUnit.message}</span>
								)}
							</div>

							{/* Number of L2 */}
							<div className="flex flex-col gap-y-2">
								<Label>Number of L2</Label>
								<Input type="number" {...register('noOfL2')} readOnly />
								{errors.noOfL2 && (
									<span className="text-destructive text-sm">{errors.noOfL2.message}</span>
								)}
							</div>

							{/* Number of L3 per L2 */}
							<div className="flex flex-col gap-y-2">
								<Label>Number of L3 per L2</Label>
								<Input type="number" {...register('noOfL3perL2')} readOnly />
								{errors.noOfL3perL2 && (
									<span className="text-destructive text-sm">{errors.noOfL3perL2.message}</span>
								)}
							</div>

							{/* Number of L3 */}
							<div className="flex flex-col gap-y-2">
								<Label>Number of L3</Label>
								<Input type="number" {...register('noOfL3')} readOnly />
								{errors.noOfL3 && (
									<span className="text-destructive text-sm">{errors.noOfL3.message}</span>
								)}
							</div>
						</div>

						<div className="relative my-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center">
								<span className="bg-transparent  px-2 text-sm font-medium">Last L1, L2 and L3</span>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							{/* Number of Boxes */}
							<div className="flex flex-col gap-y-2">
								<Label>L1</Label>
								<Input type="text" {...register('l1')} readOnly />
								{errors.l1 && <span className="text-destructive text-sm">{errors.l1.message}</span>}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label>L2</Label>
								<Input type="text" {...register('l2')} readOnly />
								{errors.l2 && <span className="text-destructive text-sm">{errors.l2.message}</span>}
							</div>

							<div className="flex flex-col gap-y-2">
								<Label>L3</Label>
								<Input type="text" {...register('l3')} readOnly />
								{errors.l3 && <span className="text-destructive text-sm">{errors.l3.message}</span>}
							</div>
						</div>

						<div className="relative my-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center">
								<span className="bg-transparent  px-2 text-sm font-medium">Required Quantity</span>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							{/* Number of Boxes */}
							<div className="flex flex-col gap-y-2">
								<Label>Number of Boxes</Label>
								<Input type="number" {...register('noOfbox')} />
								{errors.noOfbox && (
									<span className="text-destructive text-sm">{errors.noOfbox.message}</span>
								)}
							</div>

							{/* Number of Stickers */}
							<div className="flex flex-col gap-y-2">
								<Label>Number of Stickers</Label>
								<Input type="number" {...register('noOfstickers')} />
								{errors.noOfstickers && (
									<span className="text-destructive text-sm">{errors.noOfstickers.message}</span>
								)}
							</div>
						</div>

						<div className="col-span-full mt-5">
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isSubmitting ? (
									<span className="flex items-center gap-2">
										<Spinner className="h-4 w-4" />
										Generating...
									</span>
								) : (
									'Generate Barcode'
								)}
							</Button>

							<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Confirm Barcode Generation</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to generate the barcode? This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
											{isSubmitting ? (
												<span className="flex items-center gap-2">
													<Spinner className="h-4 w-4" />
													Generating...
												</span>
											) : (
												'Confirm'
											)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</form>
				</CardContent>
			</Card>
		</>
	);
}

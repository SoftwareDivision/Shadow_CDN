import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthToken } from '@/hooks/authStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
	const { token } = useAuthToken.getState();
	const [plants, setPlants] = useState([]);
	const [machines, setMachines] = useState([]);
	const [shifts, setShifts] = useState([]);
	const [products, setProducts] = useState([]);
	const [productSizes, setProductSizes] = useState([]);
	const tokendata = token.data.token;
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [formData, setFormData] = useState(null);
	const [activeTab, setActiveTab] = useState(0); // 0 for first tab, 1 for second tab, 2 for third tab

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
		onSuccess: () => {
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

		try {
			// Make the API call using the new function
			const result = await getl1l2l3(tokendata, reportParams);

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

	// Tab navigation functions
	const nextTab = () => {
		if (activeTab < 2) setActiveTab(activeTab + 1);
	};

	const prevTab = () => {
		if (activeTab > 0) setActiveTab(activeTab - 1);
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
				<CardContent className="relative p-4">
					{/* Error Alerts */}
					{isError && (
						<Alert variant="destructive" className="mb-3 p-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle className="text-sm">Error</AlertTitle>
							<AlertDescription className="text-xs">{isError.message}</AlertDescription>
						</Alert>
					)}

					{submitError && (
						<Alert variant="destructive" className="mb-3 p-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle className="text-sm">Error</AlertTitle>
							<AlertDescription className="text-xs">{submitError.message}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
						{/* Tab Navigation */}
						<div className="flex border-b border-gray-200 mb-4">
							<button
								type="button"
								className={`py-2 px-4 text-sm font-medium ${
									activeTab === 0
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'
								}`}
								onClick={() => setActiveTab(0)}
							>
								Manufacturing Details
							</button>
							<button
								type="button"
								className={`py-2 px-4 text-sm font-medium ${
									activeTab === 1
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'
								}`}
								onClick={() => setActiveTab(1)}
							>
								Plant Details
							</button>
							<button
								type="button"
								className={`py-2 px-4 text-sm font-medium ${
									activeTab === 2
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'
								}`}
								onClick={() => setActiveTab(2)}
							>
								Product Details
							</button>
						</div>

						{/* Tab Content */}
						{activeTab === 0 && (
							<div className="space-y-4">
								{/* Section 1: Date Information */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div className="flex flex-col">
										<Label className="text-xs">Manufacturing Date</Label>
										<Controller
											name="mfgDt"
											control={control}
											render={({ field }) => (
												<Input
													readOnly
													value={
														field.value ? format(new Date(field.value), 'dd/MM/yyyy') : ''
													}
													className="text-xs h-8"
												/>
											)}
										/>
										{errors.mfgDt && (
											<span className="text-destructive text-xs">{errors.mfgDt.message}</span>
										)}
									</div>
								</div>

								<div className="relative my-1">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t border-gray-300" />
									</div>
									<div className="relative flex justify-center">
										<span className="bg-white px-2 text-xs font-medium text-gray-500">
											Manufacturing Details
										</span>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div className="flex flex-col">
										<Label className="text-xs">Country</Label>
										<Input {...register('country')} className="h-8 text-xs" />
										{errors.country && (
											<span className="text-destructive text-xs">{errors.country.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Country Code</Label>
										<Input {...register('countryCode')} maxLength={2} className="h-8 text-xs" />
										{errors.countryCode && (
											<span className="text-destructive text-xs">
												{errors.countryCode.message}
											</span>
										)}
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Manufacturer Name</Label>
										<Input {...register('mfgName')} className="h-8 text-xs" />
										{errors.mfgName && (
											<span className="text-destructive text-xs">{errors.mfgName.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Manufacturer Location</Label>
										<Input {...register('mfgLoc')} className="h-8 text-xs" />
										{errors.mfgLoc && (
											<span className="text-destructive text-xs">{errors.mfgLoc.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Manufacturer Code</Label>
										<Input {...register('mfgCode')} className="h-8 text-xs" />
										{errors.mfgCode && (
											<span className="text-destructive text-xs">{errors.mfgCode.message}</span>
										)}
									</div>
								</div>
							</div>
						)}

						{activeTab === 1 && (
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
									<div className="flex flex-col">
										<Controller
											name="plantName"
											control={control}
											render={({ field }) => (
												<div className="flex flex-col">
													<Label className="text-xs">Plant Name</Label>
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
																				(product) =>
																					product.pname === selected.pName,
																			)
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
																				(product) =>
																					product.ptype === selected.pName,
																			)
																			?.map((product) => product.bname),
																	),
																]
																	.sort((a, b) => a.localeCompare(b))
																	.map((bname) => ({
																		value: bname,
																		text: bname,
																		disabled: false,
																	}));
																setProducts(productOptions);
															}
														}}
													>
														<SelectTrigger className="h-8 text-xs w-full">
															<SelectValue placeholder="Select plant..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{plants.map((plant) => (
																	<SelectItem
																		key={plant.value}
																		value={plant.value}
																		disabled={plant.disabled}
																		className="text-xs"
																	>
																		{plant.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.plant && (
														<span className="text-destructive text-xs">
															{errors.plant.message}
														</span>
													)}
												</div>
											)}
										/>
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Plant Code</Label>
										<Input
											{...register('pCode')}
											readOnly
											value={plantData?.find((p) => p.pName === selectedPlant)?.pCode || ''}
											className="h-8 text-xs"
										/>
										{errors.pCode && (
											<span className="text-destructive text-xs">{errors.pCode.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Controller
											name="shift"
											control={control}
											render={({ field }) => (
												<div className="flex flex-col">
													<Label className="text-xs">Shift</Label>
													<Select
														value={field.value}
														onValueChange={(value) => {
															field.onChange(value);
														}}
													>
														<SelectTrigger className="h-8 text-xs w-full">
															<SelectValue placeholder="Select Shift..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{shifts.map((shift) => (
																	<SelectItem
																		key={shift.value}
																		value={shift.value}
																		disabled={shift.disabled}
																		className="text-xs"
																	>
																		{shift.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.shift && (
														<span className="text-destructive text-xs">
															{errors.shift.message}
														</span>
													)}
												</div>
											)}
										/>
									</div>
									<div className="flex flex-col">
										<Controller
											name="mCode"
											control={control}
											render={({ field }) => (
												<div className="flex flex-col">
													<Label className="text-xs">Machine Code</Label>
													<Select
														value={field.value}
														onValueChange={(value) => {
															field.onChange(value);
														}}
													>
														<SelectTrigger className="h-8 text-xs w-full">
															<SelectValue placeholder="Select Machine..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{machines.map((machine) => (
																	<SelectItem
																		key={machine.value}
																		value={machine.value}
																		disabled={machine.disabled}
																		className="text-xs"
																	>
																		{machine.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.mCode && (
														<span className="text-destructive text-xs">
															{errors.mCode.message}
														</span>
													)}
												</div>
											)}
										/>
									</div>
								</div>
							</div>
						)}

						{activeTab === 2 && (
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
									<div className="flex flex-col">
										<Controller
											name="brandName"
											control={control}
											render={({ field }) => (
												<div className="flex flex-col">
													<Label className="text-xs">Brand Name</Label>
													<Select
														value={field.value}
														onValueChange={(value) => {
															field.onChange(value);
															const selected = productData?.find(
																(p) => p.bname === value,
															);
															if (selected) {
																setValue('brandId', selected?.bid);
															}
															const productOptions = [
																...new Set(
																	productData
																		?.filter(
																			(product) => product.bid === selected.bid,
																		)
																		?.map((product) => product.psize),
																),
															]
																.sort((a, b) => a.localeCompare(b))
																.map((psize) => ({
																	value: psize,
																	text: psize,
																	disabled: false,
																}));
															setProductSizes(productOptions);
														}}
													>
														<SelectTrigger className="h-8 text-xs w-full">
															<SelectValue placeholder="Select Brand..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{products.map((plant) => (
																	<SelectItem
																		key={plant.value}
																		value={plant.value}
																		disabled={plant.disabled}
																		className="text-xs"
																	>
																		{plant.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.plant && (
														<span className="text-destructive text-xs">
															{errors.plant.message}
														</span>
													)}
												</div>
											)}
										/>
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Brand Id</Label>
										<Input
											{...register('brandId')}
											readOnly
											value={productData?.find((p) => p.bname === selectedbrandname)?.bid || ''}
											className="h-8 text-xs"
										/>
										{errors.brandId && (
											<span className="text-destructive text-xs">{errors.brandId.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Controller
											name="productSize"
											control={control}
											render={({ field }) => (
												<div className="flex flex-col">
													<Label className="text-xs">Product Size</Label>
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
														<SelectTrigger className="h-8 text-xs w-full">
															<SelectValue placeholder="Select size..." />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{productSizes.map((plant) => (
																	<SelectItem
																		key={plant.value}
																		value={plant.value}
																		disabled={plant.disabled}
																		className="text-xs"
																	>
																		{plant.text}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.productSize && (
														<span className="text-destructive text-xs">
															{errors.productSize.message}
														</span>
													)}
												</div>
											)}
										/>
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Product Size Code</Label>
										<Input {...register('pSizeCode')} readOnly className="h-8 text-xs" />
										{errors.pCode && (
											<span className="text-destructive text-xs">{errors.pSizeCode.message}</span>
										)}
									</div>
									<div className="flex flex-col">
										<Label className="text-xs">Class</Label>
										<Input {...register('class')} readOnly className="h-8 text-xs" />
										{errors.class && (
											<span className="text-destructive text-xs">{errors.class.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Division</Label>
										<Input {...register('division')} readOnly className="h-8 text-xs" />
										{errors.division && (
											<span className="text-destructive text-xs">{errors.division.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">SD Category</Label>
										<Input {...register('sdCat')} readOnly className="h-8 text-xs" />
										{errors.sdCat && (
											<span className="text-destructive text-xs">{errors.sdCat.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">UN Number Class</Label>
										<Input {...register('unNoClass')} readOnly className="h-8 text-xs" />
										{errors.unNoClass && (
											<span className="text-destructive text-xs">{errors.unNoClass.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">L1 Net Weight</Label>
										<Input
											type="number"
											{...register('l1NetWt')}
											readOnly
											className="h-8 text-xs"
										/>
										{errors.l1NetWt && (
											<span className="text-destructive text-xs">{errors.l1NetWt.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">L1 Net Unit</Label>
										<Input {...register('l1NetUnit')} readOnly className="h-8 text-xs" />
										{errors.l1NetUnit && (
											<span className="text-destructive text-xs">{errors.l1NetUnit.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Number of L2</Label>
										<Input type="number" {...register('noOfL2')} readOnly className="h-8 text-xs" />
										{errors.noOfL2 && (
											<span className="text-destructive text-xs">{errors.noOfL2.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Number of L3 per L2</Label>
										<Input
											type="number"
											{...register('noOfL3perL2')}
											readOnly
											className="h-8 text-xs"
										/>
										{errors.noOfL3perL2 && (
											<span className="text-destructive text-xs">
												{errors.noOfL3perL2.message}
											</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Number of L3</Label>
										<Input type="number" {...register('noOfL3')} readOnly className="h-8 text-xs" />
										{errors.noOfL3 && (
											<span className="text-destructive text-xs">{errors.noOfL3.message}</span>
										)}
									</div>
								</div>

								<div className="relative my-1">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t border-gray-300" />
									</div>
									<div className="relative flex justify-center">
										<span className="bg-white px-2 text-xs font-medium text-gray-500">
											Last L1, L2 and L3
										</span>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div className="flex flex-col">
										<Label className="text-xs">L1</Label>
										<Input type="text" {...register('l1')} readOnly className="h-8 text-xs" />
										{errors.l1 && (
											<span className="text-destructive text-xs">{errors.l1.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">L2</Label>
										<Input type="text" {...register('l2')} readOnly className="h-8 text-xs" />
										{errors.l2 && (
											<span className="text-destructive text-xs">{errors.l2.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">L3</Label>
										<Input type="text" {...register('l3')} readOnly className="h-8 text-xs" />
										{errors.l3 && (
											<span className="text-destructive text-xs">{errors.l3.message}</span>
										)}
									</div>
								</div>

								<div className="relative my-1">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t border-gray-300" />
									</div>
									<div className="relative flex justify-center">
										<span className="bg-white px-2 text-xs font-medium text-gray-500">
											Required Quantity
										</span>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="flex flex-col">
										<Label className="text-xs">Number of Boxes</Label>
										<Input type="number" {...register('noOfbox')} className="h-8 text-xs" />
										{errors.noOfbox && (
											<span className="text-destructive text-xs">{errors.noOfbox.message}</span>
										)}
									</div>

									<div className="flex flex-col">
										<Label className="text-xs">Number of Stickers</Label>
										<Input type="number" {...register('noOfstickers')} className="h-8 text-xs" />
										{errors.noOfstickers && (
											<span className="text-destructive text-xs">
												{errors.noOfstickers.message}
											</span>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Navigation Buttons */}
						<div className="flex justify-between mt-6">
							{activeTab > 0 ? (
								<Button
									type="button"
									variant="outline"
									onClick={prevTab}
									className="flex items-center gap-2 h-9"
								>
									<ChevronLeft className="h-4 w-4" />
									Previous
								</Button>
							) : (
								<div></div>
							)}

							{activeTab < 2 ? (
								<Button type="button" onClick={nextTab} className="flex items-center gap-2 h-9">
									Next
									<ChevronRight className="h-4 w-4" />
								</Button>
							) : (
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={prevTab}
										className="flex items-center gap-2 h-9"
									>
										<ChevronLeft className="h-4 w-4" />
										Previous
									</Button>
									<Button type="submit" className="h-9" disabled={isLoading}>
										{isSubmitting ? (
											<span className="flex items-center gap-2">
												<Spinner className="h-4 w-4" />
												<span className="text-sm">Generating...</span>
											</span>
										) : (
											<span className="text-sm">Generate Barcode</span>
										)}
									</Button>
								</div>
							)}
						</div>

						<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
							<AlertDialogContent className="p-4">
								<AlertDialogHeader>
									<AlertDialogTitle className="text-sm">Confirm Barcode Generation</AlertDialogTitle>
									<AlertDialogDescription className="text-xs">
										Are you sure you want to generate the barcode? This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter className="mt-3">
									<AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleConfirm}
										disabled={isSubmitting}
										className="h-8 text-xs"
									>
										{isSubmitting ? (
											<span className="flex items-center gap-2">
												<Spinner className="h-3 w-3" />
												<span>Generating...</span>
											</span>
										) : (
											'Confirm'
										)}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</form>
				</CardContent>
			</Card>
		</>
	);
}

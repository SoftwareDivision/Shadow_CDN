import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { 
	createProductionPlan, 
	updateProductionPlan, 
	generateProductionPlanNo,
	getAllProducts,
	getMachineCodeDetails,
	getAllShifts 
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
	id: yup.number(),
	productionPlanNo: yup.string().max(20, 'Production plan number cannot exceed 20 characters'),
	productionType: yup.string().max(50, 'Production type cannot exceed 50 characters'),
	mfgDt: yup.date().required('Manufacturing date is required'),
	plantCode: yup.string().required('Plant code is required').max(2, 'Plant code cannot exceed 2 characters'),
	brandId: yup.string().required('Brand ID is required').max(4, 'Brand ID cannot exceed 4 characters'),
	pSizeCode: yup.string().required('Product size code is required').max(3, 'Product size code cannot exceed 3 characters'),
	totalWeight: yup
		.number()
		.required('Total weight is required')
		.positive('Total weight must be greater than 0')
		.typeError('Total weight must be a number'),
	noOfbox: yup
		.number()
		.required('Number of boxes is required')
		.integer('Number of boxes must be an integer')
		.min(1, 'Number of boxes must be at least 1')
		.typeError('Number of boxes must be a number'),
	noOfstickers: yup
		.number()
		.required('Number of stickers is required')
		.integer('Number of stickers must be an integer')
		.min(1, 'Number of stickers must be at least 1')
		.typeError('Number of stickers must be a number'),
	machineCode: yup.string().required('Machine code is required').max(1, 'Machine code must be 1 character'),
	shift: yup.string().required('Shift is required').max(1, 'Shift must be 1 character'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	// State for filtered dropdowns
	const [filteredBrands, setFilteredBrands] = useState([]);
	const [filteredProductSizes, setFilteredProductSizes] = useState([]);
	const [filteredMachines, setFilteredMachines] = useState([]);

	// Form hook
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		control,
		watch,
		setValue,
		getValues,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			productionPlanNo: '',
			productionType: '',
			mfgDt: new Date(),
			plantCode: '',
			brandId: '',
			pSizeCode: '',
			totalWeight: '',
			noOfbox: '',
			noOfstickers: '',
			machineCode: '',
			shift: '',
		},
	});

	// Fetch master data
	const { data: productData } = useQuery({
		queryKey: ['products'],
		queryFn: () => getAllProducts(tokendata),
		enabled: !!tokendata,
	});

	const { data: machineData } = useQuery({
		queryKey: ['machines'],
		queryFn: () => getMachineCodeDetails(tokendata),
		enabled: !!tokendata,
	});

	const { data: shiftData } = useQuery({
		queryKey: ['shifts'],
		queryFn: () => getAllShifts(tokendata),
		enabled: !!tokendata,
	});

	// Generate Production Plan Number for new records
	const { data: generatedPlanNo } = useQuery({
		queryKey: ['generateProductionPlanNo'],
		queryFn: () => generateProductionPlanNo(tokendata),
		enabled: !!tokendata && !id, // Only generate for new records
	});

	// Watch plant code and brand changes for cascading dropdowns
	const watchPlantCode = watch('plantCode');
	const watchBrandId = watch('brandId');
	const watchPSizeCode = watch('pSizeCode');
	const watchTotalWeight = watch('totalWeight');

	// Get distinct plant codes from product data
	const distinctPlantCodes = React.useMemo(() => {
		if (!productData) return [];
		const uniquePlants = [...new Set(productData.map(p => p.ptypecode))];
		return uniquePlants.map(code => {
			const product = productData.find(p => p.ptypecode === code);
			return {
				code: code,
				name: product?.ptype || code
			};
		});
	}, [productData]);

	// Filter machines based on selected plant code
	useEffect(() => {
		if (watchPlantCode && machineData) {
			const machinesForPlant = machineData.filter(m => m.pcode === watchPlantCode);
			setFilteredMachines(machinesForPlant);
			
			// Clear machine code if current selection is not valid
			const currentMachineCode = getValues('machineCode');
			if (currentMachineCode && !machinesForPlant.some(m => m.mcode === currentMachineCode)) {
				setValue('machineCode', '');
			}
		} else {
			setFilteredMachines([]);
		}
	}, [watchPlantCode, machineData, getValues, setValue]);

	// Filter brands based on selected plant code
	useEffect(() => {
		if (watchPlantCode && productData) {
			const brandsForPlant = productData
				.filter(p => p.ptypecode === watchPlantCode)
				.map(p => ({
					bid: p.bid,
					bname: p.bname
				}));
			
			// Remove duplicates based on bid
			const uniqueBrands = brandsForPlant.filter((brand, index, self) =>
				index === self.findIndex(b => b.bid === brand.bid)
			);
			
			setFilteredBrands(uniqueBrands);
			
			// Clear brand and product size if current selection is not valid
			const currentBrandId = getValues('brandId');
			if (currentBrandId && !uniqueBrands.some(b => b.bid === currentBrandId)) {
				setValue('brandId', '');
				setValue('pSizeCode', '');
			}
		} else {
			setFilteredBrands([]);
			setFilteredProductSizes([]);
		}
	}, [watchPlantCode, productData, getValues, setValue]);

	// Filter product sizes based on selected plant code and brand
	useEffect(() => {
		if (watchPlantCode && watchBrandId && productData) {
			const sizesForBrand = productData
				.filter(p => p.ptypecode === watchPlantCode && p.bid === watchBrandId)
				.map(p => ({
					psizecode: p.psizecode,
					psize: p.psize
				}));
			
			// Remove duplicates based on psizecode
			const uniqueSizes = sizesForBrand.filter((size, index, self) =>
				index === self.findIndex(s => s.psizecode === size.psizecode)
			);
			
			setFilteredProductSizes(uniqueSizes);
			
			// Clear product size if current selection is not valid
			const currentSizeCode = getValues('pSizeCode');
			if (currentSizeCode && !uniqueSizes.some(s => s.psizecode === currentSizeCode)) {
				setValue('pSizeCode', '');
			}
		} else {
			setFilteredProductSizes([]);
		}
	}, [watchPlantCode, watchBrandId, productData, getValues, setValue]);

	// Calculate Number of Boxes and Stickers based on Total Weight and L1 Net Weight
	useEffect(() => {
		if (watchTotalWeight && watchPSizeCode && watchPlantCode && watchBrandId && productData) {
			// Find the selected product to get L1 Net Weight
			const selectedProduct = productData.find(
				p => p.ptypecode === watchPlantCode && 
				     p.bid === watchBrandId && 
				     p.psizecode === watchPSizeCode
			);

			if (selectedProduct && selectedProduct.l1netwt) {
				const totalWeightInTons = parseFloat(watchTotalWeight);
				const l1NetWeightInKg = parseFloat(selectedProduct.l1netwt);
				
				if (!isNaN(totalWeightInTons) && !isNaN(l1NetWeightInKg) && l1NetWeightInKg > 0) {
					// Convert tons to kg (1 ton = 1000 kg)
					const totalWeightInKg = totalWeightInTons * 1000;
					
					// Calculate number of boxes (L1)
					const numberOfBoxes = Math.floor(totalWeightInKg / l1NetWeightInKg);
					
					// Calculate number of stickers (same as number of boxes for L1)
					const numberOfStickers = numberOfBoxes;
					
					// Update the form fields
					setValue('noOfbox', numberOfBoxes);
					setValue('noOfstickers', numberOfStickers);
				}
			}
		}
	}, [watchTotalWeight, watchPSizeCode, watchPlantCode, watchBrandId, productData, setValue]);

	// Set auto-generated production plan number for new records
	useEffect(() => {
		if (!id && generatedPlanNo) {
			setValue('productionPlanNo', generatedPlanNo.productionPlanNo);
		}
	}, [generatedPlanNo, id, setValue]);

	useEffect(() => {
		if (state && id) {
			// First populate the filtered dropdowns based on state data
			if (state.plantCode && productData) {
				// Filter brands for the selected plant
				const brandsForPlant = productData
					.filter(p => p.ptypecode === state.plantCode)
					.map(p => ({
						bid: p.bid,
						bname: p.bname
					}));
				const uniqueBrands = brandsForPlant.filter((brand, index, self) =>
					index === self.findIndex(b => b.bid === brand.bid)
				);
				setFilteredBrands(uniqueBrands);

				// Filter product sizes for the selected plant and brand
				if (state.brandId) {
					const sizesForBrand = productData
						.filter(p => p.ptypecode === state.plantCode && p.bid === state.brandId)
						.map(p => ({
							psizecode: p.psizecode,
							psize: p.psize
						}));
					const uniqueSizes = sizesForBrand.filter((size, index, self) =>
						index === self.findIndex(s => s.psizecode === size.psizecode)
					);
					setFilteredProductSizes(uniqueSizes);
				}
			}

			// Filter machines for the selected plant
			if (state.plantCode && machineData) {
				const machinesForPlant = machineData.filter(m => m.pcode === state.plantCode);
				setFilteredMachines(machinesForPlant);
			}

			// Then reset the form with the state data
			reset({
				id: parseInt(id),
				productionPlanNo: state.productionPlanNo || '',
				productionType: state.productionType || '',
				mfgDt: state.mfgDt ? new Date(state.mfgDt) : new Date(),
				plantCode: state.plantCode || '',
				brandId: state.brandId || '',
				pSizeCode: state.pSizeCode || '',
				totalWeight: state.totalWeight || '',
				noOfbox: state.noOfbox || '',
				noOfstickers: state.noOfstickers || '',
				machineCode: state.machineCode || '',
				shift: state.shift || '',
			});
		}
	}, [state, id, reset, productData, machineData]);

	const mutation = useMutation({
		mutationFn: (formData) => {
			const payload = {
				...formData,
				id: id ? parseInt(id) : 0,
				totalWeight: parseFloat(formData.totalWeight),
				noOfbox: parseInt(formData.noOfbox),
				noOfstickers: parseInt(formData.noOfstickers),
			};
			return id ? updateProductionPlan(tokendata, payload) : createProductionPlan(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['productionPlans']);
			enqueueSnackbar(`Production Plan ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/production-plan');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} production plan`, {
				variant: 'error',
			});
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Production Plan</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="productionPlanNo">Production Plan No {!id && '(Auto-Generated)'}</Label>
						<Input
							id="productionPlanNo"
							{...register('productionPlanNo')}
							maxLength={20}
							className={errors.productionPlanNo ? 'border-red-500' : !id ? 'bg-muted' : ''}
							readOnly={!id}
							placeholder={!id ? 'Generating...' : ''}
						/>
						{!id && <span className="text-xs text-muted-foreground">Format: PP-YYMM001 (resets monthly)</span>}
						{errors.productionPlanNo && (
							<span className="text-sm text-red-500">{errors.productionPlanNo.message}</span>
						)}
					</div>

					<div className="space-y-2">
						<Label>Production Type</Label>
						<Controller
							name="productionType"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className={errors.productionType ? 'border-red-500 w-full '  : 'w-full'}>
										<SelectValue placeholder="Select production type..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="RE11">Against RE11</SelectItem>
											<SelectItem value="Sales Forecast">Sales Forecast</SelectItem>
											<SelectItem value="Stock">Stock</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.productionType && (
							<span className="text-sm text-red-500">{errors.productionType.message}</span>
						)}
					</div>

					<div className="space-y-2">
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
												errors.mfgDt && 'border-red-500'
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={field.onChange}
											disabled={(date) => {
												const today = new Date();
												today.setHours(0, 0, 0, 0);
												return date < today;
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
						{errors.mfgDt && <span className="text-sm text-red-500">{errors.mfgDt.message}</span>}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label>Plant Code</Label>
						<Controller
							name="plantCode"
							control={control}
							render={({ field }) => (
								<Select 
									value={field.value} 
									onValueChange={(value) => {
										field.onChange(value);
										// Clear dependent fields when plant code changes
										setValue('brandId', '');
										setValue('pSizeCode', '');
										setValue('machineCode', '');
									}}
								>
									<SelectTrigger className={errors.plantCode ? 'border-red-500 w-full' : 'w-full'}>
										<SelectValue placeholder="Select plant code..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{distinctPlantCodes.map((plant) => (
												<SelectItem key={plant.code} value={plant.code}>
													{plant.name} ({plant.code})
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.plantCode && <span className="text-sm text-red-500">{errors.plantCode.message}</span>}
					</div>
					
					<div className="space-y-2">
						<Label>Brand ID</Label>
						<Controller
							name="brandId"
							control={control}
							render={({ field }) => (
								<Select 
									value={field.value} 
									onValueChange={(value) => {
										field.onChange(value);
										// Clear product size when brand changes
										setValue('pSizeCode', '');
									}}
									disabled={!watchPlantCode}
								>
									<SelectTrigger className={errors.brandId ? 'border-red-500 w-full' : 'w-full'}>
										<SelectValue placeholder={watchPlantCode ? "Select brand..." : "Select plant code first"} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{filteredBrands.map((brand) => (
												<SelectItem key={brand.bid} value={brand.bid}>
													{brand.bname} ({brand.bid})
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.brandId && <span className="text-sm text-red-500">{errors.brandId.message}</span>}
					</div>
					
					<div className="space-y-2">
						<Label>Product Size Code</Label>
						<Controller
							name="pSizeCode"
							control={control}
							render={({ field }) => (
								<Select 
									value={field.value} 
									onValueChange={field.onChange}
									disabled={!watchBrandId}
								>
									<SelectTrigger className={errors.pSizeCode ? 'border-red-500 w-full' : 'w-full'}>
										<SelectValue placeholder={watchBrandId ? "Select product size..." : "Select brand first"} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{filteredProductSizes.map((size) => (
												<SelectItem key={size.psizecode} value={size.psizecode}>
													{size.psize} ({size.psizecode})
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.pSizeCode && <span className="text-sm text-red-500">{errors.pSizeCode.message}</span>}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="totalWeight">Total Weight (in Tons)</Label>
						<Input
							id="totalWeight"
							type="number"
							step="0.01"
							placeholder="Enter weight in tons"
							{...register('totalWeight')}
							className={errors.totalWeight ? 'border-red-500' : ''}
						/>
						<span className="text-xs text-muted-foreground">Enter weight in tons (e.g., 5.5 tons)</span>
						{errors.totalWeight && <span className="text-sm text-red-500">{errors.totalWeight.message}</span>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="noOfbox">Number of Boxes (Calculated)</Label>
						<Input
							id="noOfbox"
							type="number"
							{...register('noOfbox')}
							className={errors.noOfbox ? 'border-red-500 bg-muted' : 'bg-muted'}
							readOnly
						/>
						<span className="text-xs text-muted-foreground">Auto-calculated from Total Weight ÷ L1 Net Weight</span>
						{errors.noOfbox && <span className="text-sm text-red-500">{errors.noOfbox.message}</span>}
					</div>
					
					<div className="space-y-2">
						<Label htmlFor="noOfstickers">Number of Stickers (Calculated)</Label>
						<Input
							id="noOfstickers"
							type="number"
							{...register('noOfstickers')}
							className={errors.noOfstickers ? 'border-red-500 bg-muted' : 'bg-muted'}
							readOnly
						/>
						<span className="text-xs text-muted-foreground">Auto-calculated, equal to number of boxes</span>
						{errors.noOfstickers && (
							<span className="text-sm text-red-500">{errors.noOfstickers.message}</span>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label>Machine Code</Label>
						<Controller
							name="machineCode"
							control={control}
							render={({ field }) => (
								<Select 
									value={field.value} 
									onValueChange={field.onChange}
									disabled={!watchPlantCode}
								>
									<SelectTrigger className={errors.machineCode ? 'border-red-500 w-full' : 'w-full'}>
										<SelectValue placeholder={watchPlantCode ? "Select machine..." : "Select plant code first"} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{filteredMachines.map((machine) => (
												<SelectItem key={machine.mcode} value={machine.mcode}>
													{machine.pname} - {machine.mcode}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.machineCode && <span className="text-sm text-red-500">{errors.machineCode.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>Shift</Label>
						<Controller
							name="shift"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className={errors.shift ? 'border-red-500 w-full' : 'w-full'}>
										<SelectValue placeholder="Select shift..." />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{shiftData?.map((shift) => (
												<SelectItem key={shift.shift} value={shift.shift}>
													{shift.shift} ({shift.shift})
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.shift && <span className="text-sm text-red-500">{errors.shift.message}</span>}
					</div>
				</div>

				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/production-plan')}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-primary hover:bg-primary/90" disabled={mutation.isPending}>
						{mutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{id ? 'Updating...' : 'Creating...'}
							</>
						) : (
							`${id ? 'Update' : 'Create'} Production Plan`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select, SelectContent, SelectGroup, SelectItem,
	SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import {
	createProduct, getAllBrands, updateProduct,
	getUOMDetails, getPlantDetails, getProductById,
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const schema = yup.object().shape({
	id: yup.number(),
	bname: yup.string().required('Brand Name is required'),
	ptype: yup.string().required('Product Type is required'),
	class: yup.number().required('Class is required'),
	division: yup.number().required('Division is required'),
	unit: yup.string().required('Unit is required'),
	psize: yup.string().required('Product Size is required'),
	psizecode: yup.string().required('Size Code is required'),
	dimnesion: yup.number().required('Dimension is required'),
	dimensionunit: yup.string().required('Dimension Unit is required'),
	dimunitwt: yup.number().required('Unit Weight is required'),
	wtunit: yup.string().required('Weight Unit is required'),
	l1netwt: yup.number().required('L1 Net Weight is required'),
	noofl2: yup.number().required('No. of L2 is required'),
	noofl3perl2: yup.number().required('No. of L3/L2 is required'),
	noofl3perl1: yup.number().required('No. of L3/L1 is required'),
	sdcat: yup.string().required('SDCAT is required'),
	unnoclass: yup.string().required('UN No. Class is required'),
	act: yup.string().required('Active Flag is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token?.data?.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const isEditMode = !!id;

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		reset,
		control,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			id: 0,
			bname: '',
			bid: '',
			ptype: '',
			ptypecode: '',
			class: '',
			division: '',
			unit: '',
			psize: '',
			psizecode: '',
			dimnesion: '',
			dimensionunit: '',
			dimunitwt: '',
			wtunit: '',
			l1netwt: '',
			noofl2: '',
			noofl3perl2: '',
			noofl3perl1: '',
			sdcat: '',
			unnoclass: '',
			act: 'true',
		},
	});

	const [brands, setBrands] = useState([]);
	const [uom, setUom] = useState([]);
	const [plants, setPlants] = useState([]);

	const mutation = useMutation({
		mutationFn: (data) => {
			const payload = {
				...data,
				id: id ? parseInt(id) : 0,
				blist: [],
				plist: [],
			};
			return id ? updateProduct(tokendata, payload) : createProduct(tokendata, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['products']);
			enqueueSnackbar(`Product ${id ? 'updated' : 'created'} successfully`, { variant: 'success' });
			navigate('/product-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} product`, { variant: 'error' });
		},
	});

	const onSubmit = (data) => {
		mutation.mutate(data);
	};

	// Queries
	const {
		data: brandData,
		isLoading: isBrandLoading,
		error: brandError,
	} = useQuery({
		queryKey: ['brandData'],
		queryFn: () => getAllBrands(tokendata),
		enabled: !!tokendata,
	});


	const {
		data: plantData,
		isLoading: isPlantLoading,
		error: plantError,
	} = useQuery({
		queryKey: ['plantData'],
		queryFn: () => getPlantDetails(tokendata),
		enabled: !!tokendata,
	});


	const {
		data: uomData,
		isLoading: isUomLoading,
		error: uomError,
	} = useQuery({
		queryKey: ['uomData'],
		queryFn: () => getUOMDetails(tokendata),
		enabled: !!tokendata,
	});


	const {
		data: existingProduct,
		isLoading: isProductLoading,
		error: productError,
	} = useQuery({
		queryKey: ['product', id],
		queryFn: () => getProductById(tokendata, id),
		enabled: isEditMode && !!tokendata,
	});


	// Populate form values
	useEffect(() => {
		if (brandData) {
			const brandOptions = brandData.map((b) => ({
				value: b.bname,
				text: b.bname,
				disabled: false,
			}));
			brandOptions.unshift({ value: 'all', text: 'All', disabled: false });
			setBrands(brandOptions);
		}
		if (plantData) {
			const plantOptions = plantData.map((p) => ({
				value: p.pName,
				text: p.pName,
				disabled: false,
			}));
			setPlants(plantOptions);
		}
		if (uomData) {
			const uomOptions = uomData.map((u) => ({
				value: u.uomcode,
				text: u.uomcode,
				disabled: false,
			}));
			uomOptions.unshift({ value: 'all', text: 'All', disabled: false });
			setUom(uomOptions);
		}
		if (isEditMode && existingProduct) {
			reset(existingProduct);
		}
		if (!isEditMode && state) {
			reset(state);
		}
	}, [brandData, plantData, uomData, reset, existingProduct, isEditMode, state]);

	// Handle loading and error
	const loading = isBrandLoading || isPlantLoading || isUomLoading || (isEditMode && isProductLoading);
	const allErrors = brandError || plantError || uomError || productError;

	useEffect(() => {
		if (allErrors) {
			enqueueSnackbar(allErrors.message || 'Error loading data', { variant: 'error' });
		}
	}, [allErrors, enqueueSnackbar]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-60">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading Product Form...</span>
			</div>
		);
	}


	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Product</h2>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-4 gap-4 space-y-2">
					<div className="space-y-2">
						<Controller
							name="ptype"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Product Type</Label>
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											const selectedPlantFromData = plantData?.find((plant) => plant.pName === value);
											if (selectedPlantFromData) {
												setValue('ptypecode', selectedPlantFromData.pCode);

												// Filter brands based on selected plant_type
												const filteredBrands = brandData?.filter(
													(brand) => brand.plant_type === selectedPlantFromData.plant_type
												).map(brand => ({
													value: brand.bname,
													text: brand.bname,
													disabled: false
												}));
												setBrands(filteredBrands || []);
												// Clear brand selection if current brand is not in filtered list
												const currentBname = field.value;
												if (currentBname && !filteredBrands?.some(b => b.value === currentBname)) {
													setValue('bname', '');
													setValue('bid', '');
													setValue('class', '');
													setValue('division', '');
													setValue('unit', '');
												}
											} else {
												setValue('ptypecode', '');
												setBrands([]); // Clear brands if no plant type is selected or found
												setValue('bname', '');
												setValue('bid', '');
												setValue('class', '');
												setValue('division', '');
												setValue('unit', '');
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Product Type..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{plants.map((plant) => (
													<SelectItem key={plant.value} value={plant.value}>
														{plant.text}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.ptype && (
										<span className="text-destructive text-sm">{errors.ptype.message}</span>
									)}
								</div>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Product Type Code</Label>
						<Input
							{...register('ptypecode')}
							className={errors.ptypecode ? 'border-red-500' : ''}
							readOnly
						/>
						{errors.ptypecode && <span className="text-sm text-red-500">{errors.ptypecode.message}</span>}
					</div>
					<div className="space-y-2">
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
											const selectedBrand = brandData?.find((brand) => brand.bname === value);
											if (selectedBrand) {
												setValue('bid', selectedBrand.bid);
												setValue('class', selectedBrand.class);
												setValue('division', selectedBrand.division);
												setValue('unit', selectedBrand.unit);
												// No need to set ptype here, as it's already handled by the ptype dropdown
											} else {
												setValue('bid', '');
												setValue('class', '');
												setValue('division', '');
												setValue('unit', '');
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Brand..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{brands.map((brand) => ( // Use 'brands' state here
													<SelectItem key={brand.value} value={brand.value}>
														{brand.text}
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

					<div className="space-y-2">
						<Label>Brand ID</Label>
						<Input {...register('bid')} className={errors.bid ? 'border-red-500' : ''} readOnly />
						{errors.bid && <span className="text-sm text-red-500">{errors.bid.message}</span>}
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 space-y-2">
					<div className="space-y-2">
						<Label>Class</Label>
						<Input type="number" {...register('class')} className={errors.class ? 'border-red-500' : ''} readOnly />
						{errors.class && <span className="text-sm text-red-500">{errors.class.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>Division</Label>
						<Input
							type="number"
							{...register('division')}
							className={errors.division ? 'border-red-500' : ''}
							readOnly
						/>
						{errors.division && <span className="text-sm text-red-500">{errors.division.message}</span>}
					</div>

					<div className="space-y-2">
						<Controller
							name="unit"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Unit</Label>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Unit..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{uomData?.map((unit) => (
													<SelectItem key={unit.uomcode} value={unit.uomcode}>
														{unit.uomcode}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.unit && (
										<span className="text-destructive text-sm">{errors.unit.message}</span>
									)}
								</div>
							)}
						/>
					</div>
				</div>

				<div className="grid grid-cols-4 gap-4 space-y-2">
					<div className="space-y-2">
						<Label>Product Size</Label>
						<Input {...register('psize')} className={errors.psize ? 'border-red-500' : ''} />
						{errors.psize && <span className="text-sm text-red-500">{errors.psize.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>Size Code</Label>
						<Input {...register('psizecode')} className={errors.psizecode ? 'border-red-500' : ''} />
						{errors.psizecode && <span className="text-sm text-red-500">{errors.psizecode.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>Dimension</Label>
						<Input
							type="number"
							{...register('dimnesion')}
							className={errors.dimnesion ? 'border-red-500' : ''}
						/>
						{errors.dimnesion && <span className="text-sm text-red-500">{errors.dimnesion.message}</span>}
					</div>

					<div className="space-y-2">
						<Controller
							name="dimensionunit"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Dimension Unit</Label>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Unit..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{uomData?.map((unit) => (
													<SelectItem key={unit.uomcode} value={unit.uomcode}>
														{unit.uomcode}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.dimensionunit && (
										<span className="text-destructive text-sm">{errors.dimensionunit.message}</span>
									)}
								</div>
							)}
						/>
					</div>
				</div>

				<div className="grid grid-cols-6 gap-4 space-y-2">
					<div className="space-y-2">
						<Label>Unit Weight</Label>
						<Input
							type="number"
							{...register('dimunitwt')}
							className={errors.dimunitwt ? 'border-red-500' : ''}
						/>
						{errors.dimunitwt && <span className="text-sm text-red-500">{errors.dimunitwt.message}</span>}
					</div>

					<div className="space-y-2">
						<Controller
							name="wtunit"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-y-2">
									<Label>Weight Unit</Label>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Unit..." />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{uomData?.map((unit) => (
													<SelectItem key={unit.uomcode} value={unit.uomcode}>
														{unit.uomcode}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.wtunit && (
										<span className="text-destructive text-sm">{errors.wtunit.message}</span>
									)}
								</div>
							)}
						/>
					</div>

					<div className="space-y-2">
						<Label>L1 Net Weight</Label>
						<Input
							type="number"
							{...register('l1netwt')}
							className={errors.l1netwt ? 'border-red-500' : ''}
						/>
						{errors.l1netwt && <span className="text-sm text-red-500">{errors.l1netwt.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>No. of L2</Label>
						<Input
							type="number"
							{...register('noofl2')}
							className={errors.noofl2 ? 'border-red-500' : ''}
						/>
						{errors.noofl2 && <span className="text-sm text-red-500">{errors.noofl2.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>No. of L3/L2</Label>
						<Input
							type="number"
							{...register('noofl3perl2')}
							className={errors.noofl3perl2 ? 'border-red-500' : ''}
						/>
						{errors.noofl3perl2 && (
							<span className="text-sm text-red-500">{errors.noofl3perl2.message}</span>
						)}
					</div>

					<div className="space-y-2">
						<Label>No. of L3/L1</Label>
						<Input
							type="number"
							{...register('noofl3perl1')}
							className={errors.noofl3perl1 ? 'border-red-500' : ''}
						/>
						{errors.noofl3perl1 && (
							<span className="text-sm text-red-500">{errors.noofl3perl1.message}</span>
						)}
					</div>

					<div className="space-y-2">
						<Label>SDCAT</Label>
						<Input {...register('sdcat')} className={errors.sdcat ? 'border-red-500' : ''} />
						{errors.sdcat && <span className="text-sm text-red-500">{errors.sdcat.message}</span>}
					</div>

					<div className="space-y-2">
						<Label>UN No. Class</Label>
						<Input {...register('unnoclass')} className={errors.unnoclass ? 'border-red-500' : ''} />
						{errors.unnoclass && <span className="text-sm text-red-500">{errors.unnoclass.message}</span>}
					</div>

					<div className="space-y-2 w-full">
						<Label>Active Flag</Label>
						<Controller
							name="act"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-2">
									<RadioGroup
										defaultValue=""
										className="flex space-x-4"
										onValueChange={field.onChange}
										value={field.value}
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="true" id="active" />
											<label htmlFor="active">Active</label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="false" id="inactive" />
											<label htmlFor="inactive">Inactive</label>
										</div>
									</RadioGroup>
									{errors.act && (
										<span className="text-destructive text-center text-sm">{errors.act.message}</span>
									)}
								</div>
							)}
						/>
					</div>

				</div>

				{/* Submit button */}
				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/product-master')}
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
							`${id ? 'Update' : 'Create'} Product`
						)}
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default AddOrEdit;

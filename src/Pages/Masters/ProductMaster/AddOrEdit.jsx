import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthToken } from '@/hooks/authStore';
import { useSnackbar } from 'notistack';
import { createProduct, getAllBrands, updateProduct,getProductById } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';


const schema = yup.object().shape({
	id: yup.number(),
	bname: yup.string().required('Brand Name is required'),
	bid: yup.string().required('Brand ID is required'),
	ptype: yup.string().required('Product Type is required'),
	ptypecode: yup.string().required('Product Type Code is required'),
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
	scannerdealy: yup.string().required('Scanner Delay is required'),
	printerdealy: yup.string().required('Printer Delay is required'),
	stopdealy: yup.string().required('Stop Delay is required'),
});

function AddOrEdit() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

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
			scannerdealy: '',
			printerdealy: '',
			stopdealy: '',
		},
	});

	const [brands, setBrands] = React.useState([]);
	const isEditMode = !!id;

	const { data: productData, isLoading: isProductDataLoading } = useQuery({
		queryKey: ['product', id],
		queryFn: () => getProductById(tokendata, id),
		enabled: isEditMode,
		onSuccess: (data) => {
			reset({
				...data,
				shift: data.shift ? data.shift.split(',') : [],
			});
		},
	});

	//plant details
	const {
		data: brandData,
		isLoading: isBrandFetching,
		error: fetchBrandError,
	} = useQuery({
		queryKey: ['brandData'],
		queryFn: () => getAllBrands(tokendata),
		enabled: !!tokendata,
	});

	useEffect(() => {
		if (brandData) {
			const brandOptions = brandData?.map((plant) => ({
				value: plant.bname,
				text: plant.bname,
				disabled: false,
			}));
			brandOptions.unshift({ value: 'all', text: 'All', disabled: false });
			setBrands(brandOptions);
		}

	}, [reset, brandData]);

	console.log('brandData', brandData);



	const loading = isBrandFetching;
	const allerrors = fetchBrandError;

	if (allerrors) {
		enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
	}
	if (loading) {
		return <div>Loading...</div>;
	}

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
			enqueueSnackbar(`Product ${id ? 'updated' : 'created'} successfully`, {
				variant: 'success',
			});
			navigate('/product-master');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || `Failed to ${id ? 'update' : 'create'} product`, {
				variant: 'error',
			});
		},
	});

	return (
		<Card className="p-4 shadow-md w-full mx-auto">
			<div>
				<h2 className="text-2xl font-bold">{id ? 'Edit' : 'Add'} Product</h2>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

					<div className="grid grid-cols-4 gap-4 space-y-2">
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
													setValue('ptype', selectedBrand.ptype);
												} else {
													setValue('bid', '');
													setValue('ptype', '');
												}
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select Brand..." />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{brandData?.map((brand) => (
														<SelectItem
															key={brand.bname}
															value={brand.bname}
														>
															{brand.bname}
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
							<Input
								{...register('bid')}
								className={errors.bid ? 'border-red-500' : ''}
								readOnly
							/>
							{errors.bid && <span className="text-sm text-red-500">{errors.bid.message}</span>}
						</div>

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
												const selectedpname = brandData?.find((brand) => brand.pname === value);
												if (selectedpname) {
													setValue('ptypecode', selectedpname.pcode);
												} else {
													setValue('ptypecode', '');
												}
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select Product Type..." />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{[...new Set(brandData?.map(brand => brand.pname))]
														.filter(Boolean)
														.map((ptype) => (
															<SelectItem
																key={ptype}
																value={ptype}
															>
																{ptype}
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
							<Input {...register('ptypecode')}
								className={errors.ptypecode ? 'border-red-500' : ''}
								readOnly
							/>
							{errors.ptypecode && <span className="text-sm text-red-500">{errors.ptypecode.message}</span>}
						</div>

					</div>

					<div className="grid grid-cols-3 gap-4 space-y-2">
						<div className="space-y-2">
							<Label>Class</Label>
							<Input type="number" {...register('class')} className={errors.class ? 'border-red-500' : ''} />
							{errors.class && <span className="text-sm text-red-500">{errors.class.message}</span>}
						</div>

						<div className="space-y-2">
							<Label>Division</Label>
							<Input
								type="number"
								{...register('division')}
								className={errors.division ? 'border-red-500' : ''}
							/>
							{errors.division && <span className="text-sm text-red-500">{errors.division.message}</span>}
						</div>

						<div className="space-y-2">
							<Label>Unit</Label>
							<Input {...register('unit')} className={errors.unit ? 'border-red-500' : ''} />
							{errors.unit && <span className="text-sm text-red-500">{errors.unit.message}</span>}
						</div>

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
							<Label>Dimension Unit</Label>
							<Input
								{...register('dimensionunit')}
								className={errors.dimensionunit ? 'border-red-500' : ''}
							/>
							{errors.dimensionunit && (
								<span className="text-sm text-red-500">{errors.dimensionunit.message}</span>
							)}
						</div>

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
							<Label>Weight Unit</Label>
							<Input {...register('wtunit')} className={errors.wtunit ? 'border-red-500' : ''} />
							{errors.wtunit && <span className="text-sm text-red-500">{errors.wtunit.message}</span>}
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
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">Active</SelectItem>
											<SelectItem value="false">Inactive</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.act && <span className="text-sm text-red-500">{errors.act.message}</span>}
						</div>

						<div className="space-y-2">
							<Label>Scanner Delay</Label>
							<Input {...register('scannerdealy')} className={errors.scannerdealy ? 'border-red-500' : ''} />
							{errors.scannerdealy && (
								<span className="text-sm text-red-500">{errors.scannerdealy.message}</span>
							)}
						</div>

						<div className="space-y-2">
							<Label>Printer Delay</Label>
							<Input {...register('printerdealy')} className={errors.printerdealy ? 'border-red-500' : ''} />
							{errors.printerdealy && (
								<span className="text-sm text-red-500">{errors.printerdealy.message}</span>
							)}
						</div>

						<div className="space-y-2">
							<Label>Stop Delay</Label>
							<Input {...register('stopdealy')} className={errors.stopdealy ? 'border-red-500' : ''} />
							{errors.stopdealy && <span className="text-sm text-red-500">{errors.stopdealy.message}</span>}
						</div>
					</div>

					<div className="flex justify-end space-x-4">
						<Button type="button" variant="outline" onClick={() => navigate('/product-master')}>
							Cancel
						</Button>
						<Button type="submit" className="w-full" disabled={mutation.isLoading}>
							{mutation.isLoading
								? isEditMode
									? 'Updating...' : 'Adding...' : isEditMode ? 'Update Product' : 'Add Product'}
						</Button>
					</div>
				</form>
			</Form>
		</Card>
	);
}

export default AddOrEdit;




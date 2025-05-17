import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getRE11CreateIndents } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AddRE11Indent = () => {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { token } = useAuthToken.getState();
	const tokendata = token.data.token;
	const queryClient = useQueryClient();
	const [selectedCustomerData, setSelectedCustomerData] = useState(null);
	const [productList, setProductList] = useState([]);
	const [selectedplanttype, setselectedplanttype] = useState(null);
	const [selectedbrandname, setselectedbrandname] = useState(null);
	const [selectedprodutsize, setselectedprodutsize] = useState(null);

	const schema = yup.object().shape({
		custName: yup.string().required('Customer Name is required'),
		indentNo: yup
			.string()
			.required('Indent Number is required')
			.test('unique-indent', 'This indent number already exists', function (value) {
				return !checkIndentNumberExists(value);
			}),
		conName: yup.string().required('Consignee Name is required'),
		conNo: yup.string().required('Consignee Number is required'),
		indentDt: yup.date().required('Indent Date is required'),
		pesoDt: yup.date().required('PESO Date is required'),
		licenseNo: yup.string().required('License Number is required'),
		prdInfoList: yup
			.array()
			.of(
				yup.object().shape({
					ptype: yup.string().required('Product Type is required'),
					bname: yup.string().required('Brand Name is required'),
					psize: yup.string().required('Product Size is required'),
					reqWt: yup
						.number()
						.required('Required Weight is required')
						.min(1, 'Required Weight must be greater than 0'),
					reqUnit: yup.string().required('Required Unit is required'),
					l1netwt: yup.string(), // Add l1netwt to schema
					class: yup.string(), // Add class to schema
					division: yup.string(), // Add division to schema
				}),
			)
			.min(1, 'Product Data is required'),
	});

	const {
		data,
		isLoading: isFetching,
		error: fetchError,
	} = useQuery({
		queryKey: ['re11Indents'],
		queryFn: () => getRE11CreateIndents(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch RE11 Indent data', { variant: 'error' });
		},
	});

	const mutation = useMutation({
		mutationFn: (data) => api.postData('/api/Re11IndentInfos', token, data),
		onSuccess: () => {
			queryClient.invalidateQueries(['re11Indents']);
			enqueueSnackbar('RE11 Indent added successfully', { variant: 'success' });
			navigate('/re11-indent-generation');
		},
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to add RE11 Indent', {
				variant: 'error',
			});
		},
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		setError,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			custName: '',
			indentNo: '',
			conName: '',
			licenseNo: '',
			conNo: '',
			indentDt: new Date().toISOString(),
			pesoDt: new Date().toISOString(),
			prdInfoList: [],
		},
	});

	useEffect(() => {
		if (data) {
			const getCurrentYear = () => format(new Date(), 'yyyy');
			const defaultIndentPrefix = `RE-11/${getCurrentYear()}/`;
			setValue('indentNo', data.indentNo || defaultIndentPrefix);
		}
	}, [data]);

	const checkIndentNumberExists = (value) => {
		if (!data?.allExistingIndentno) return false;
		return data.allExistingIndentno.includes(value);
	};

	const handleAddProduct = () => {
		setProductList([
			...productList,
			{
				pid: '',
				ptype: '',
				bname: '',
				psize: '',
				reqWt: 0,
				reqUnit: '',
			},
		]);
	};

	const handleRemoveProduct = (index) => {
		const updatedList = [...productList];
		updatedList.splice(index, 1);
		setProductList(updatedList);
	};

	const handleCustomerChange = (customerId) => {
		const selectedCustomer = data?.customerslIST?.find((customer) => customer.id.toString() === customerId);
		if (selectedCustomer) {
			setSelectedCustomerData(selectedCustomer);
			setValue('custName', selectedCustomer.cName);
			setValue('conName', '');
			setValue('conNo', '');
			setValue('licenseNo', '');
		}
	};

	const handleContactPersonChange = (memberId) => {
		const selectedMember = selectedCustomerData?.members?.find((member) => member.id.toString() === memberId);
		if (selectedMember) {
			setValue('conName', selectedMember.name);
			setValue('conNo', selectedMember.contactNo);
		}
	};

	const handleMagazineChange = (magazineId) => {
		const selectedMagazine = selectedCustomerData?.magazines?.find(
			(magazine) => magazine.id.toString() === magazineId,
		);
		if (selectedMagazine) {
			setValue('licenseNo', selectedMagazine.license);
		}
	};

	const onSubmit = (data) => {
		console.log(data);
		// mutation.mutate(data);
	};

	const onError = (errors) => {
		if (errors.prdInfoList) {
			enqueueSnackbar(errors.prdInfoList.message, { variant: 'error' });
		}
	};

	return (
		<Card className="shadow-md w-full">
			<CardContent className="relative">
				{isFetching && (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				)}

				{(fetchError || mutation.error) && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{fetchError?.message || mutation.error?.message}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic">Basic Information</TabsTrigger>
							<TabsTrigger value="products">Product Details</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-6">
							{/* Indent Information Section */}
							<div className="relative my-2">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-background px-2 text-sm font-medium">Indent Information</span>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								{/* Indent No */}
								<div className="flex flex-col gap-y-2">
									<Label>Indent No</Label>
									<Controller
										name="indentNo"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder="Enter Indent No"
												disabled={mutation.isLoading}
												onChange={(e) => {
													field.onChange(e);
													if (checkIndentNumberExists(e.target.value)) {
														setError('indentNo', {
															type: 'manual',
															message: 'This indent number already exists',
														});
														enqueueSnackbar('This indent number already exists', {
															variant: 'error',
														});
														setValue('indentNo', data.indentNo);
													}
												}}
											/>
										)}
									/>
									{errors.indentNo && (
										<span className="text-destructive text-sm">{errors.indentNo.message}</span>
									)}
								</div>
							</div>

							{/* Date Information Section */}
							<div className="relative my-2">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-background px-2 text-sm font-medium">Date Information</span>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* Indent Date */}
								<div className="flex flex-col gap-y-2">
									<Label>Indent Date</Label>
									<Controller
										name="indentDt"
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
														disabled={mutation.isLoading}
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
														selected={new Date(field.value)}
														onSelect={(date) => field.onChange(date?.toISOString())}
														disabled={(date) =>
															date > new Date() || date < new Date('1900-01-01')
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										)}
									/>
									{errors.indentDt && (
										<span className="text-destructive text-sm">{errors.indentDt.message}</span>
									)}
								</div>

								{/* PESO Date */}
								<div className="flex flex-col gap-y-2">
									<Label>PESO Date</Label>
									<Controller
										name="pesoDt"
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
														disabled={mutation.isLoading}
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
														selected={new Date(field.value)}
														onSelect={(date) => field.onChange(date?.toISOString())}
														disabled={(date) =>
															date > new Date() || date < new Date('1900-01-01')
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										)}
									/>
									{errors.pesoDt && (
										<span className="text-destructive text-sm">{errors.pesoDt.message}</span>
									)}
								</div>
							</div>

							{/* Customer Information Section */}
							<div className="relative my-2">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-background px-2 text-sm font-medium">Customer Information</span>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* Customer Selection */}
								<div className="flex flex-col gap-y-2">
									<Label>Customer</Label>
									<Select onValueChange={handleCustomerChange} disabled={mutation.isLoading}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select customer" />
										</SelectTrigger>
										<SelectContent>
											{data?.customerslIST?.map((customer) => (
												<SelectItem key={customer.id} value={customer.id.toString()}>
													{customer.cName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{/* Contact Person Selection */}
								<div className="flex flex-col gap-y-2">
									<Label>Contact Person</Label>
									<Select
										onValueChange={handleContactPersonChange}
										disabled={!selectedCustomerData || mutation.isLoading}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select contact person" />
										</SelectTrigger>
										<SelectContent>
											{selectedCustomerData?.members?.map((member) => (
												<SelectItem key={member.id} value={member.id.toString()}>
													{member.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{/* Contact Number */}
								<div className="flex flex-col gap-y-2">
									<Label>Contact Number</Label>
									<Controller
										name="conNo"
										control={control}
										render={({ field }) => (
											<Input {...field} placeholder="Contact number" disabled={true} />
										)}
									/>
									{errors.conNo && (
										<span className="text-destructive text-sm">{errors.conNo.message}</span>
									)}
								</div>
								{/* Magazine Selection */}
								<div className="flex flex-col gap-y-2">
									<Label>Magazine</Label>
									<Select
										onValueChange={handleMagazineChange}
										disabled={!selectedCustomerData || mutation.isLoading}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select magazine" />
										</SelectTrigger>
										<SelectContent>
											{selectedCustomerData?.magazines?.map((magazine) => (
												<SelectItem key={magazine.id} value={magazine.id.toString()}>
													{magazine.license}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="products" className="space-y-6">
							<div className="relative my-2">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-background px-2 text-sm font-medium">Product Information</span>
								</div>
							</div>

							{productList.map((product, index) => (
								<div
									key={index}
									className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative"
								>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="absolute right-2 top-2"
										onClick={() => handleRemoveProduct(index)}
									>
										<Trash className="h-4 w-4" />
									</Button>

									{/* Product Type */}
									<div className="flex flex-col gap-y-2">
										<Label>Product Type</Label>
										<Controller
											name={`prdInfoList.${index}.ptype`}
											control={control}
											defaultValue={product.ptype}
											render={({ field }) => (
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setselectedplanttype(value);
														setValue(`prdInfoList.${index}.bname`, '');
														setValue(`prdInfoList.${index}.psize`, '');
														setValue(`prdInfoList.${index}.l1netwt`, '');
														setValue(`prdInfoList.${index}.class`, '');
														setValue(`prdInfoList.${index}.division`, '');
														setValue(`prdInfoList.${index}.reqUnit`, '');
														setValue(`prdInfoList.${index}.reqWt`, '');
													}}
													value={field.value}
													disabled={mutation.isLoading}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select Plant type" />
													</SelectTrigger>
													<SelectContent>
														{[...new Set(data?.productList?.map((type) => type.ptype))].map(
															(ptype) => (
																<SelectItem key={ptype} value={ptype}>
																	{ptype}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											)}
										/>
										{errors.prdInfoList?.[index]?.ptype && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].ptype.message}
											</span>
										)}
									</div>

									{/* Brand Name */}
									<div className="flex flex-col gap-y-2">
										<Label>Brand Name</Label>
										<Controller
											name={`prdInfoList.${index}.bname`}
											control={control}
											defaultValue={product.bname}
											render={({ field }) => (
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setselectedbrandname(value);
														setValue(`prdInfoList.${index}.psize`, '');
														setValue(`prdInfoList.${index}.l1netwt`, '');
														setValue(`prdInfoList.${index}.class`, '');
														setValue(`prdInfoList.${index}.division`, '');
														setValue(`prdInfoList.${index}.reqUnit`, '');
														setValue(`prdInfoList.${index}.reqWt`, '');
													}}
													value={field.value}
													disabled={mutation.isLoading}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select brand" />
													</SelectTrigger>
													<SelectContent>
														{[
															...new Set(
																data?.productList
																	?.filter((type) => type.ptype === selectedplanttype)
																	.map((type) => type.bname),
															),
														].map((bname) => (
															<SelectItem key={bname} value={bname}>
																{bname}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
										{errors.prdInfoList?.[index]?.bname && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].bname.message}
											</span>
										)}
									</div>

									{/* Product Size */}
									<div className="flex flex-col gap-y-2">
										<Label>Product Size</Label>
										<Controller
											name={`prdInfoList.${index}.psize`}
											control={control}
											defaultValue={product.psize}
											render={({ field }) => (
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setselectedprodutsize(value);
														setValue(
															`prdInfoList.${index}.reqUnit`,
															data?.productList?.find(
																(type) =>
																	type.psize === value &&
																	type.bname === selectedbrandname,
															)?.unit,
														);
														setValue(
															`prdInfoList.${index}.l1netwt`,
															data?.productList?.find(
																(type) =>
																	type.psize === value &&
																	type.bname === selectedbrandname,
															)?.l1netwt,
														);
														setValue(
															`prdInfoList.${index}.class`,
															data?.productList?.find(
																(type) =>
																	type.psize === value &&
																	type.bname === selectedbrandname,
															)?.class,
														);
														setValue(
															`prdInfoList.${index}.division`,
															data?.productList?.find(
																(type) =>
																	type.psize === value &&
																	type.bname === selectedbrandname,
															)?.division,
														);
													}}
													value={field.value}
													disabled={mutation.isLoading}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select size" />
													</SelectTrigger>
													<SelectContent>
														{[
															...new Set(
																data?.productList
																	?.filter((type) => type.bname === selectedbrandname)
																	.map((type) => type.psize),
															),
														].map((psize) => (
															<SelectItem key={psize} value={psize}>
																{psize}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
										{errors.prdInfoList?.[index]?.psize && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].psize.message}
											</span>
										)}
									</div>

									<div className="flex flex-col gap-y-2">
										<Label>L1Net Wt</Label>
										<Controller
											name={`prdInfoList.${index}.l1netwt`}
											control={control}
											defaultValue={product.l1netwt}
											render={({ field }) => (
												<Input
													{...field}
													placeholder="l1netwt"
													disabled={mutation.isLoading}
													readOnly
												/>
											)}
										/>
										{errors.prdInfoList?.[index]?.l1netwt && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].l1netwt.message}
											</span>
										)}
									</div>
									{/* Required Quantity */}
									<div className="flex flex-col gap-y-2">
										<Label>Class</Label>
										<Controller
											name={`prdInfoList.${index}.class`}
											control={control}
											defaultValue={product.class}
											render={({ field }) => (
												<Input
													{...field}
													type="number"
													placeholder="Class"
													readOnly
													disabled={mutation.isLoading}
												/>
											)}
										/>
										{errors.prdInfoList?.[index]?.class && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].class.message}
											</span>
										)}
									</div>

									{/* Required Divison */}
									<div className="flex flex-col gap-y-2">
										<Label>Required Division</Label>
										<Controller
											name={`prdInfoList.${index}.division`}
											control={control}
											defaultValue={product.division}
											render={({ field }) => (
												<Input
													{...field}
													type="number"
													readOnly
													placeholder="Division"
													disabled={mutation.isLoading}
												/>
											)}
										/>
										{errors.prdInfoList?.[index]?.division && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].division.message}
											</span>
										)}
									</div>

									{/* Required Weight */}
									<div className="flex flex-col gap-y-2">
										<Label>Required Weight</Label>
										<Controller
											name={`prdInfoList.${index}.reqWt`}
											control={control}
											defaultValue={product.reqWt}
											render={({ field }) => (
												<Input
													{...field}
													type="number"
													placeholder="Weight"
													disabled={mutation.isLoading}
												/>
											)}
										/>
										{errors.prdInfoList?.[index]?.reqWt && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].reqWt.message}
											</span>
										)}
									</div>

									{/* Required Unit */}
									<div className="flex flex-col gap-y-2">
										<Label>Unit</Label>
										<Controller
											name={`prdInfoList.${index}.reqUnit`}
											control={control}
											defaultValue={product.reqUnit}
											render={({ field }) => (
												<Input
													{...field}
													placeholder="Unit"
													disabled={mutation.isLoading}
													readOnly
												/>
											)}
										/>
										{errors.prdInfoList?.[index]?.reqUnit && (
											<span className="text-destructive text-sm">
												{errors.prdInfoList[index].reqUnit.message}
											</span>
										)}
									</div>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={handleAddProduct}
								disabled={mutation.isLoading}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Product
							</Button>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" onClick={() => navigate('/re11-indent-generation')}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isLoading}>
							{mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};

export default AddRE11Indent;

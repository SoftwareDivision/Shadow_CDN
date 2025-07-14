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
import {
	CalendarIcon,
	Loader2,
	Plus,
	Trash,
	ArrowRight,
	ArrowLeft,
	Save,
	SaveAllIcon,
	Dock,
	IterationCcw,
	IterationCw,
} from 'lucide-react'; // Import ArrowRight
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { createRE11Indent, getRE11CreateIndents } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Import the new tab components
import BasicInfoTab from './BasicInfoTab';
import ProductsTab from './ProductsTab';

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
	const [activeTab, setActiveTab] = useState('basic'); // Add state for active tab

	const checkIndentNumberExists = (value) => {
		if (!data?.allExistingIndentno) return false;
		return data.allExistingIndentno.includes(value);
	};

	const schema = yup.object().shape({
		custName: yup.string().required('Customer Name is required'),
		indentNo: yup
			.string()
			.min(14, 'Enter a valid indent number')
			.max(20, 'Enter a valid indent number')
			.required('Indent Number is required')
			.test('unique-indent', 'This indent number already exists', function (value) {
				// Use the checkIndentNumberExists function here
				return !checkIndentNumberExists(value);
			}),
		conName: yup.string().required('Consignee Name is required'),
		conNo: yup.string().notRequired(),
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
			.min(1, 'Add At least One Product'),
	});

	const {
		data,
		isLoading: isFetching,
		error: fetchError,
		refetch,
	} = useQuery({
		queryKey: ['re11Indents'],
		queryFn: () => getRE11CreateIndents(tokendata),
		onError: (error) => {
			enqueueSnackbar(error.message || 'Failed to fetch RE11 Indent data', { variant: 'error' });
		},
	});

	const mutation = useMutation({
		mutationFn: (data) => createRE11Indent(tokendata, data),
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
				l1netwt: '', // Initialize new fields
				class: '',
				division: '',
			},
		]);
	};

	const handleRemoveProduct = (index) => {
		const updatedList = [...productList];
		updatedList.splice(index, 1);
		setProductList(updatedList);
		// Also remove from react-hook-form state
		const currentPrdInfoList = watch('prdInfoList');
		const updatedFormList = [...currentPrdInfoList];
		updatedFormList.splice(index, 1);
		setValue('prdInfoList', updatedFormList);
	};

	const handleCustomerChange = (customerId) => {
		const selectedCustomer = data?.customerslIST?.find((customer) => customer.cName === customerId);
		if (selectedCustomer) {
			setSelectedCustomerData(selectedCustomer);
			// Reset contact person and magazine when customer changes
			setValue('conName', '');
			setValue('conNo', '');
			setValue('licenseNo', '');
		} else {
			setSelectedCustomerData(null);
			setValue('conName', '');
			setValue('conNo', '');
			setValue('licenseNo', '');
		}
		setValue('custName', customerId); // Update form state for custName
	};

	const handleContactPersonChange = (memberId) => {
		const selectedMember = selectedCustomerData?.members?.find((member) => member.name === memberId);
		if (selectedMember) {
			setValue('conNo', selectedMember.contactNo); // Assuming contactNo is available
		} else {
			setValue('conNo', '');
		}
		setValue('conName', memberId); // Update form state for conName
	};

	const handleMagazineChange = (magazineId) => {
		// Assuming magazineId is the license string itself based on SelectItem value
		setValue('licenseNo', magazineId); // Update form state for licenseNo
	};

	const onSubmit = (formdata) => {
		console.log(formdata);

		// Prepare the payload with blank data for fields not in the UI
		const payload = {
			...formdata,
			customerslIST: [], // Not available in UI
			allExistingIndentno: [], // Not available in UI
			productList: [], // Not available in UI
			clic: formdata.licenseNo, // Use licenseNo for clic
			compFlag: 0, // Not available in UI
			month: (new Date().getMonth() + 1).toString().padStart(2, '0'), //
			year: new Date().getFullYear(),
			prdInfoList: formdata.prdInfoList.map((product) => ({
				...product,
				pid: 0, // Not explicitly controlled in UI, defaulting to 0
				ptypelist: [], // Not available in UI
				ptypeCode: data.productList.find((p) => p.ptype === product.ptype)?.ptypecode, // Get ptypeCode
				bid: data.productList.find((p) => p.bname === product.bname)?.bid, // Get bid
				sizeCode: data.productList.find((p) => p.psize === product.psize)?.psizecode, // Get sizeCode
				div: product.division || 0, // Use existing division if available, otherwise 0
				l1NetWt: parseFloat(product.l1netwt) || 0.0, // Use existing l1netwt if available, convert to number, otherwise 0.0
				remWt: product.reqWt, // Not available in UI - Assuming remaining weight is initially required weight
				remUnit: product.reqUnit, // Not available in UI - Assuming remaining unit is initially required unit
				compFlag: 0, // Not available in UI
				loadWt: 0, // Not available in UI
				loadUnit: product.reqUnit, // Not available in UI
				remCase: product.reqCase, // Not available in UI
				// Keep existing fields: ptype, bname, psize, reqWt, reqUnit, class, division, l1netwt
			})),
		};

		console.log('Payload being sent:', payload);
		mutation.mutate(payload);
	};

	const onError = (errors) => {
		console.error('Form submission error:', errors);
		// Iterate through all errors and display them in snackbar
		Object.keys(errors).forEach((fieldName) => {
			const error = errors[fieldName];
			if (error && error.message) {
				enqueueSnackbar(`${fieldName}: ${error.message}`, { variant: 'error' });
			} else if (error && Array.isArray(error)) {
				// Handle array errors like prdInfoList
				error.forEach((itemError, index) => {
					if (itemError && itemError.message) {
						enqueueSnackbar(`${fieldName}[${index}]: ${itemError.message}`, { variant: 'error' });
					} else if (itemError) {
						// Handle nested errors within array items
						Object.keys(itemError).forEach((nestedFieldName) => {
							const nestedError = itemError[nestedFieldName];
							if (nestedError && nestedError.message) {
								enqueueSnackbar(`${fieldName}[${index}].${nestedFieldName}: ${nestedError.message}`, {
									variant: 'error',
								});
							}
						});
					}
				});
			}
		});
	};

	const isLoading = isFetching || mutation.isLoading;

	return (
		<Card className="shadow-md w-full">
			<CardContent className="relative">
				{isLoading && (
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
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic">Basic Information</TabsTrigger>
							<TabsTrigger value="products">Product Details</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-6">
							{/* Render BasicInfoTab component */}
							<BasicInfoTab
								control={control}
								errors={errors}
								data={data}
								selectedCustomerData={selectedCustomerData}
								handleCustomerChange={handleCustomerChange}
								handleContactPersonChange={handleContactPersonChange}
								handleMagazineChange={handleMagazineChange}
								watch={watch}
							/>
						</TabsContent>

						<TabsContent value="products" className="space-y-6">
							{/* Render ProductsTab component */}
							<ProductsTab
								control={control}
								errors={errors}
								data={data}
								productList={productList}
								handleRemoveProduct={handleRemoveProduct}
								handleAddProduct={handleAddProduct}
								selectedplanttype={selectedplanttype}
								setselectedplanttype={setselectedplanttype}
								selectedbrandname={selectedbrandname}
								setselectedbrandname={setselectedbrandname}
								selectedprodutsize={selectedprodutsize}
								setselectedprodutsize={setselectedprodutsize}
								setValue={setValue}
								watch={watch}
								mutationIsLoading={mutation.isLoading}
								enqueueSnackbar={enqueueSnackbar}
							/>
						</TabsContent>
					</Tabs>

					{/* Conditional Buttons */}
					<div className="flex justify-end gap-4">
						<Button
							type="button" // Set type to button
							variant="outline" // Use outline variant\c
							className="text-muted-foreground" // Add muted class
							onClick={() => navigate('/re11-indent-generation')} // Add navigation
							disabled={mutation.isLoading}
						>
							<IterationCw className="mr-2 h-4 w-4" /> Cancel
						</Button>
						{activeTab === 'basic' && (
							<Button
								type="button"
								onClick={() => setActiveTab('products')}
								disabled={mutation.isLoading}
							>
								Next <ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						)}
						{activeTab === 'products' && (
							<>
								<Button
									type="button"
									variant="outline"
									onClick={() => setActiveTab('basic')}
									disabled={mutation.isLoading}
								>
									<ArrowLeft className="mr-2 h-4 w-4" /> Previous
								</Button>

								<Button type="submit" disabled={mutation.isLoading}>
									{mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Create Indent <Dock className="ml-2 h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</form>
			</CardContent>
		</Card>
	);
};

export default AddRE11Indent;

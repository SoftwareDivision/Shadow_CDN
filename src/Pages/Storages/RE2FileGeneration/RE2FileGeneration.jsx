import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createRE2Generate, generateRE2File, getRE2GenData } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, AlertCircle, Search, FileSpreadsheet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enqueueSnackbar } from 'notistack';
import { Input } from '@/components/ui/input';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Form validation schema
// Update the schema to include new fields
const schema = yup.object().shape({
	mfgDt: yup.date().required('Manufacturing date is required'),
	plant: yup.string().required('Plant is required'),
	magazine: yup.string().required('Magazine is required'),
	brand: yup.string().required('Brand is required'),
	productSize: yup.string().required('Product size is required'),
});

const RE2FileGeneration = () => {
	const { token } = useAuthToken.getState();
	const [plantData, setPlantData] = useState([]);
	const [magazineData, setMagazineData] = useState([]);
	const [brandData, setBrandData] = useState([]);
	const [productSizeData, setProductSizeData] = useState([]);
	const [selectedPlantCode, setSelectedPlantCode] = useState('');
	const [selectedLicenseCode, setSelectedLicenseCode] = useState('');
	const [selectedBrandId, setSelectedBrandId] = useState('');
	const [selectedProductSize, setSelectedProductSize] = useState('');
	const [selectedProductCode, setSelectedProductCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [re2Data, setRE2Data] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);

	// Data fetching
	const {
		data: apiData,
		isLoading: isFetching,
		error: fetchError,
	} = useQuery({
		queryKey: ['re2GenerateData'],
		queryFn: () => getRE2GenData(token.data.token),
		enabled: !!token,
	});

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		reset,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			mfgDt: new Date().toISOString(),
			plant: '',
			magazine: '',
			brand: '',
			brandId: '',
			mCode: '',
			pCode: '',
			productCode: '',
			productSize: '',
		},
	});

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedRows(re2Data?.map((item) => item.l1Barcode) || []);
		} else {
			setSelectedRows([]);
		}
	};

	const handleSelectRow = (l1Barcode) => {
		setSelectedRows((prev) =>
			prev.includes(l1Barcode) ? prev.filter((id) => id !== l1Barcode) : [...prev, l1Barcode],
		);
	};

	const selectedBrand = watch('brand');
	const selectedPlant = watch('plant');

	// Update product size options when brand changes
	useEffect(() => {
		if (selectedPlant && selectedBrand && apiData?.plist) {
			const selectedBrandProducts = apiData.plist
				.filter((p) => p.ptype === selectedPlant && p.bname === selectedBrand)
				.map((p) => ({
					value: p.psize,
					text: p.psize,
					disabled: false,
				}));
			setProductSizeData(selectedBrandProducts);
		}
	}, [selectedPlant, selectedBrand, apiData]);

	const {
		mutateAsync: submitForm,
		isPending: isSubmitting,
		error: submitError,
	} = useMutation({
		mutationFn: (data) => createRE2Generate(token.data.token, data),
		onSuccess: (data) => {
			setRE2Data(data);
		},
		onError: (error) => enqueueSnackbar(error.message || 'Generation failed', { variant: 'error' }),
	});

	// Update the onSubmit function to include all form data
	const onSubmit = async (data) => {
		try {
			const formData = {
				mfgdt: format(new Date(data.mfgDt), 'yyyy-MM-dd'), // Format date as required
				plantCode: selectedPlantCode,
				brandId: selectedBrandId,
				pSizeCode: selectedProductCode,
				magname: data.magazine,
			};
			await submitForm(formData);
		} catch (error) {
			console.error('Submission error:', error);
		}
	};

	useEffect(() => {
		if (apiData) {
			// Existing plant and magazine options setup
			const plantOptions = Array.from(new Set(apiData?.plist?.map((plant) => plant.ptype))).map((ptype) => ({
				value: ptype,
				text: ptype,
				disabled: false,
			}));
			setPlantData(plantOptions);

			const magazineOptions = Array.from(new Set(apiData?.mlist?.map((mag) => mag.mcode))).map((mcode) => ({
				value: mcode,
				text: mcode,
				disabled: false,
			}));
			setMagazineData(magazineOptions);
		}
	}, [apiData]);

	// Update the useEffect for brandData
	useEffect(() => {
		if (selectedPlant && apiData?.plist) {
			const selectedPlantData = apiData.plist.find((p) => p.ptype === selectedPlant);
			if (selectedPlantData) {
				// Get unique brands for the selected plant
				const brandOptions = Array.from(
					new Set(
						apiData.plist
							.filter((item) => item.ptype === selectedPlant)
							.map((item) => ({
								name: item.bname,
								id: item.bid,
							}))
							.map(JSON.stringify),
					),
				)
					.map(JSON.parse)
					.map((brand) => ({
						value: brand.name,
						text: `${brand.name} (${brand.id})`,
						disabled: false,
					}));
				setBrandData(brandOptions);
			}
		}
	}, [selectedPlant, apiData]);

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return await generateRE2File(token.data.token, payload);
		},
		onSuccess: (data) => {
			downloadCSV(data);
			console.log('RE2 file generated successfully:', data);
			enqueueSnackbar('RE2 file generated successfully', { variant: 'success' });
			setLoading(false);
			setSelectedRows([]);
			setRE2Data([]);
			reset();
		},
		onError: (error) => {
			console.error('Error generating RE2 file:', error);
			enqueueSnackbar('Error generating RE2 file', { variant: 'error' });
			setLoading(false);
		},
	});
	function convertArrayToCSVWithoutQuotes(data) {
		const csvRows = [];

		// Loop over the rows
		for (const row of data) {
			const values = Object.values(row).map((value) => {
				return value; // Directly use the value without quotes
			});
			csvRows.push(values.join(','));
		}

		return csvRows.join('\n');
	}

	function downloadCSV(data) {
		const csvData = convertArrayToCSVWithoutQuotes(data);
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const mfgdt = format(new Date(), 'yyyyMMdd'); // Format the manufacturing date
		const brandName = selectedBrand.replace(/\s+/g, ''); // Remove spaces from brand name
		const magazineName = selectedLicenseCode.replace(/\s+/g, ''); // Remove spaces from magazine name
		const totalCases = new Set(data.map((item) => item.l1barcode)).size; // Calculate total cases
		const fileName = `${mfgdt}_${brandName}_${magazineName}_${totalCases}_CASES.csv`;
		const a = document.createElement('a');
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', fileName);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	const handleGenerateRE2 = () => {
		setLoading(true);
		const selectedL1Barcodes = selectedRows.map((l1Barcode) => ({ l1barcode: l1Barcode }));
		const payload = {
			mfgDt: new Date().toISOString(),
			plantName: selectedPlantCode,
			plist: apiData?.plist || [],
			plantCode: selectedPlantCode,
			brandName: selectedBrand,
			brandId: selectedBrandId,
			productSize: selectedProductSize,
			pSizeCode: selectedProductCode,
			magname: selectedLicenseCode,
			magLicense: selectedLicenseCode,
			mlist: apiData?.mlist || [],
			l1L2: selectedL1Barcodes,
		};
		mutation.mutate(payload, {
			onSettled: () => console.log('Mutation settled'),
		});
	};

	if (isFetching || isSubmitting || loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin" />
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}
	return (
		<>
			<Card className="p-4 shadow-md">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">RE2 File Generation</h2>
				</div>

				{/* Error Alerts */}
				{(fetchError || submitError) && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{fetchError?.message || submitError?.message}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Section 1: Date Information */}
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
							<Label>Plant</Label>
							<Controller
								name="plant"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											// Find the plant code from API data
											const selectedPlant = apiData?.plist?.find((p) => p.ptype === value);

											if (selectedPlant) {
												setSelectedPlantCode(selectedPlant.ptypecode);
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select plant" />
										</SelectTrigger>
										<SelectContent>
											{plantData.map((plant) => (
												<SelectItem
													key={plant.value}
													value={plant.value}
													disabled={plant.disabled}
												>
													{plant.text}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.plant && <span className="text-destructive text-sm">{errors.plant.message}</span>}
						</div>

						{/* Plant Code Display */}
						<div className="flex flex-col gap-y-2">
							<Label>Plant Code</Label>
							<Input value={selectedPlantCode} name="plantCode" readOnly className="bg-muted" />
						</div>
					</div>

					{/* Section Divider */}
					<div className="relative my-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-transparent px-2 text-sm font-medium">Product Details</span>
						</div>
					</div>

					{/* Brand  and Product Selection */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-5">
						{/* Brand selection */}
						<div className="flex flex-col gap-y-2">
							<Label>Brand</Label>
							<Controller
								name="brand"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											const selectedBrandData = apiData?.plist?.find(
												(p) => p.bname === value && p.ptype === selectedPlant,
											);
											if (selectedBrandData) {
												setSelectedBrandId(selectedBrandData.bid);
												setValue('productSize', ''); // Reset product size when brand changes
												setSelectedProductSize('');
												setSelectedProductCode('');
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select brand" />
										</SelectTrigger>
										<SelectContent>
											{brandData.map((brand) => (
												<SelectItem
													key={brand.value}
													value={brand.value}
													disabled={brand.disabled}
												>
													{brand.text}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.brand && <span className="text-destructive text-sm">{errors.brand.message}</span>}
						</div>

						{/* Brand ID */}
						<div className="flex flex-col gap-y-2">
							<Label>Brand ID</Label>
							<Input value={selectedBrandId} name="brandId" readOnly className="bg-muted" />
						</div>

						{/* Product Size Selection */}
						<div className="flex flex-col gap-y-2">
							<Label>Product Size</Label>
							<Controller
								name="productSize"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											const selectedProduct = apiData?.plist?.find(
												(p) =>
													p.psize === value &&
													p.bname === selectedBrand &&
													p.ptype === selectedPlant,
											);
											if (selectedProduct) {
												setSelectedProductSize(selectedProduct.psize);
												setSelectedProductCode(selectedProduct.psizecode);
											}
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select size" />
										</SelectTrigger>
										<SelectContent>
											{productSizeData.map((size) => (
												<SelectItem
													key={size.value}
													value={size.value}
													disabled={size.disabled}
												>
													{size.text}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.productSize && (
								<span className="text-destructive text-sm">{errors.productSize.message}</span>
							)}
						</div>

						{/* Product Code */}
						<div className="flex flex-col gap-y-2">
							<Label>Product Code</Label>
							<Input value={selectedProductCode} name="productCode" readOnly className="bg-muted" />
						</div>
					</div>

					{/* Section Divider */}
					<div className="relative my-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-transparent px-2 text-sm font-medium">Magzine Details</span>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						<div className="flex flex-col gap-y-2">
							<Label>Magazine Code</Label>
							<Controller
								name="magazine"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											// Find the magazine license code from API data
											const selectedMag = apiData?.mlist?.find((m) => m.mcode === value);
											if (selectedMag) {
												setSelectedLicenseCode(selectedMag.licno);
											}
										}}
										value={field.value}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select magazine" />
										</SelectTrigger>
										<SelectContent>
											{magazineData.map((magazine) => (
												<SelectItem
													key={magazine.value}
													value={magazine.value}
													disabled={magazine.disabled}
												>
													{magazine.text}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.magazine && (
								<span className="text-destructive text-sm">{errors.magazine.message}</span>
							)}
						</div>

						{/* License Code Display */}
						<div className="flex flex-col gap-y-2">
							<Label>Magzine License</Label>
							<Input name="mCode" value={selectedLicenseCode} readOnly className="bg-muted" />
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex justify-end">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<Search className="h-4 w-4" />
									Search RE2 File
								</>
							)}
						</Button>
					</div>
				</form>
			</Card>
			{/* Display RE2 Data */}
			{re2Data.length > 0 && (
				<Card className="p-4 shadow-md mt-4">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold">RE2 Data</h2>
						<div className="flex items-center gap-4">
							<div className="font-semibold">
								<Badge variant="default">
									Total Cases: {new Set(re2Data?.map((item) => item.l1Barcode)).size}
								</Badge>
							</div>
							<Button onClick={handleGenerateRE2} className="flex items-center gap-2" variant="outline">
								<FileSpreadsheet className="h-4 w-4" />
								Generate RE File
							</Button>
						</div>
					</div>
					<div className="rounded-md border">
						<div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead className="font-medium sticky top-0 z-10 border-b">
											<Checkbox
												className="border-blue-600 border-2"
												checked={re2Data?.length > 0 && selectedRows.length === re2Data?.length}
												onCheckedChange={handleSelectAll}
												aria-label="Select all"
											/>
											{'  '} Select all
										</TableHead>
										<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
											L1 Barcode
										</TableHead>
										<TableHead className="font-medium sticky top-0 z-10 border-b text-center">
											L2 Barcode
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{re2Data?.map((item, index) => (
										<TableRow key={index}>
											<TableCell className="">
												<Checkbox
													className="border-blue-600 border-2"
													checked={selectedRows.includes(item.l1Barcode)}
													onCheckedChange={() => handleSelectRow(item.l1Barcode)}
												/>
											</TableCell>
											<TableCell className="font-medium text-center">{item.l1Barcode}</TableCell>
											<TableCell className="font-medium text-center">{item.l2Barcode}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</Card>
			)}
		</>
	);
};

export default RE2FileGeneration;

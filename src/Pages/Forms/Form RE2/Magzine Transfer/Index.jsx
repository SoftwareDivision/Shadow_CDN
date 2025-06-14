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
import { Search, CirclePlus } from 'lucide-react';
import { getPlantDetails, getMagzineDetails, magazineTransfer, getProductDetails, GetMagTranfData } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore'; // Changed from import useAuthToken from '@/hooks/authStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DataTable from '@/components/DataTable';



function MagAllotManual() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        fromDate: yup.date().required('MFG Date is required'),
        plantId: yup.string().required('Plant Name is required'),
        brand: yup.string().required('Brand is required'),
        productsize: yup.string().required('Product Size is required'),
        magazine: yup.string().required('Magazine is required'),
        magazineto: yup.string().required('Magazine Transfer To is required'),
    });

    const {

        handleSubmit,
        setValue,
        reset,
        register,
        control,
        getValues, // Added getValues here
        formState: { errors },
    } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            fromDate: new Date(),
            plantId: '',
            pcode: '',
            brand: '',
            bcode: '',
            productsize: '',
            productcode: '',
            magazine: '',
            class: '',
            shift: '',

        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [plants, setPlants] = React.useState([]);
    const [magazine, setMagzine] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSizes, setProductSizes] = useState([]);
    const [reportData, setReportData] = React.useState(null); // Or initialize with [] if it's always an array
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [selectedRows, setSelectedRows] = useState([]);

    const { enqueueSnackbar } = useSnackbar();

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


    const {
        data: magazineData,
        isLoading: isShiftFetching,
        error: fetchShiftError,
    } = useQuery({
        queryKey: ['magazineData'],
        queryFn: () => getMagzineDetails(tokendata),
        enabled: !!tokendata,
    });

    const {
        data: productData,
        isLoading: isProductFetching,
        error: fetchProductError,
    } = useQuery({
        queryKey: ['productData'],
        queryFn: () => getProductDetails(tokendata),
        enabled: !!tokendata,
    });

    const handleSelectAll = (checked) => {
        if (checked) {
            // Select all l1Barcodes from the current reportData
            const allBarcodes = reportData?.map((item) => item) || [];
            setSelectedRows(allBarcodes);
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (row) => {
        setSelectedRows((prev) =>
            prev.includes(row) ? prev.filter((id) => id !== row) : [...prev, row],
        );
    };

    useEffect(() => {
        if (plantData) {
            const plantOptions = plantData?.map((plant) => ({
                value: plant.pName,
                text: plant.pName,
                disabled: false,
            }));
            setPlants(plantOptions);
        }
        if (magazineData) {
            const magOptions = [...new Set(magazineData?.map((mag) => mag.mcode))].sort().map((mag) => ({
                value: mag,
                text: mag,
                disabled: false,
            }));
            setMagzine(magOptions);
        }
    }, [reset, plantData, magazineData]);


    const handleGetRowData = async () => {

        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        const data = getValues(); // Get current form values

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const selectedPlantCode = data.pcode;
        const selectedBrandCode = data.bcode;
        const selectedProductSizeCode = data.productcode;
        const selectedMagazine = data.magazine;

        const reportParams = {
            fromDate: formattedFromDate,
            plantcode: selectedPlantCode,
            brandcode: selectedBrandCode,
            productsizecode: selectedProductSizeCode,
            magname: selectedMagazine
        };
        console.log('Report Params for Magzine Allotted:', reportParams);

        try {
            // Assuming getMagzineAllottedReport is an API function in api.js
            const result = await GetMagTranfData(tokendata, reportParams);

            enqueueSnackbar('Barcode Details fetched successfully', { variant: 'success' });

            console.log('Barcode Details Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch Barcode Details', { variant: 'error' });
            setIsLoadingReport(false); // Ensure loading state is reset on error
        }
    };

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const selectedPlant = data.plantId;
        const selectedPlantCode = data.pcode;
        const selectedBrand = data.brand;
        const selectedBrandCode = data.bcode;
        const selectedProductSize = data.productsize;
        const selectedProductSizeCode = data.productcode;
        const selectMagzine = data.magazine;
        const selectedMagazineTo = data.magazineto;

        const reportParams = {
            mfgDt: formattedFromDate,
            plantName: selectedPlant,
            pcode: selectedPlantCode,
            bname: selectedBrand,
            bid: selectedBrandCode,
            productSize: selectedProductSize,
            psize: selectedProductSizeCode,
            magname: selectMagzine,
            smallModels: selectedRows,
            MagnameTo: selectedMagazineTo

        };
        console.log('Report Params:', reportParams);


        try {
            // Make the API call using the new function
            const result = await magazineTransfer(tokendata, reportParams);
            reset();
            setSelectedRows([]);
            setReportData(null);

            enqueueSnackbar('Magazine Transfered successfully', { variant: 'success' });
            console.log('Report Data:', result);

            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Magazine Transfer Failed', { variant: 'error' });
        }
    };



    const loading = isLoadingReport || isShiftFetching || isPlantFetching || isProductFetching;
    const allerrors = fetchShiftError || fetchplantError || fetchProductError;

    if (allerrors) {
        enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    }
    if (loading) {
        return <div>Loading...</div>;
    }


    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Magazine Allotment - Manually</h1>
            </div>
            {/* Updated onSubmit handler */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* MFG Date Wise / Shift Section */}
                <div className="grid grid-cols-1 gap-5">
                    {/* MFG Date Wise */}
                    <div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* From Date */}
                            <div>
                                <label htmlFor="fromDate" className="text-sm font-medium">
                                    MFG Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !fromDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fromDate ? format(fromDate, "PPP") : format(new Date(), "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={fromDate}
                                            onSelect={(date) => { setFromDate(date); setValue("fromDate", date); }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.fromDate && (
                                    <span className="text-destructive text-sm">{errors.fromDate.message}</span>
                                )}
                            </div>

                            <Controller
                                name="plantId"
                                control={control}
                                render={({ field }) => (
                                    // plantName                           
                                    <div className="flex flex-col gap-y-2">
                                        <Label>Plant Name</Label>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Filter products by plant code or appropriate field
                                                const productOptions = [
                                                    ...new Set(
                                                        productData
                                                            ?.filter((product) => product.ptype === value)
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

                                                // Set plant code based on selected plant type
                                                const selectedPlant = productData?.find(product => product.ptype === value);
                                                if (selectedPlant) {
                                                    setValue("pcode", selectedPlant.ptypecode);
                                                } else {
                                                    setValue("pcode", "");
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
                                        {errors.plantId && (
                                            <span className="text-destructive text-sm">{errors.plantId.message}</span>
                                        )}
                                    </div>
                                )}
                            />

                            {/* Plant code */}
                            <div className="flex flex-col gap-y-2">
                                <Label>Plant Code</Label>
                                <Input
                                    {...register('pcode')}
                                    readOnly
                                    placeholder='Plant Code...'
                                    className={errors.pcode ? 'border-red-500' : ''}
                                />
                                {errors.pcode && (
                                    <span className="text-destructive text-sm">{errors.pcode.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* saprater */}
                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Product Details</span>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-5">
                    {/* brand dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="brand" // Changed from brandName to brand as per formSchema
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Brand Name</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue('productsize', '');
                                            setProductSizes([]);

                                            if (value === 'all') {
                                                setProductSizes([]);
                                                setValue('brandId', '');
                                            } else {
                                                const selected = productData?.find((p) => p.bname === value);
                                                if (selected) {
                                                    setValue('brandId', selected?.bid);
                                                    const productOptions = [
                                                        ...new Set(
                                                            productData
                                                                ?.filter((product) => product.bid === selected.bid)
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
                                                    setValue('bcode', selected?.bid);
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Brand..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {products.map((product, index) => ( // Changed 'plant' to 'product'
                                                    <SelectItem
                                                        key={`${product.value}-${index}`} // Added index for uniqueness
                                                        value={product.value}
                                                        disabled={product.disabled}
                                                    >
                                                        {product.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.brand && ( // Corrected error message key
                                        <span className="text-destructive text-sm">{errors.brand.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Brand Code</Label>
                        <Input
                            {...register('bcode')}
                            readOnly
                            placeholder='Brand Code...'
                            className={errors.bcode ? 'border-red-500' : ''}
                        />
                        {errors.bcode && (
                            <span className="text-destructive text-sm">{errors.bcode.message}</span>
                        )}
                    </div>

                    {/* Product size */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="productsize" // Changed from productSize to productsize as per formSchema
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
                                                setValue('productcode', selected.psizecode);
                                                setValue('class', selected.class);
                                                setValue('division', selected.division);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select product size..." /> {/* Changed placeholder */}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {productSizes.map((size, index) => ( // Changed 'plant' to 'size'
                                                    <SelectItem
                                                        key={`${size.value}-${index}`} // Added index for uniqueness
                                                        value={size.value}
                                                        disabled={size.disabled}
                                                    >
                                                        {size.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.productsize && ( // Corrected error message key
                                        <span className="text-destructive text-sm">
                                            {errors.productsize.message}
                                        </span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <Label>Product Code</Label>
                        <Input
                            {...register('productcode')}
                            readOnly
                            placeholder='Plant Code...'
                            className={errors.productcode ? 'border-red-500' : ''}
                        />
                        {errors.productcode && (
                            <span className="text-destructive text-sm">{errors.productcode.message}</span>
                        )}
                    </div>

                </div>

                <div className="grid grid-cols-5 gap-5">
                    {/* Magazine dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="magazine"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Magazine Name</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Magazine..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {magazine.map((mag) => (
                                                    <SelectItem
                                                        key={mag.value}
                                                        value={mag.value}
                                                        disabled={mag.disabled}
                                                    >
                                                        {mag.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.magazine && (
                                        <span className="text-destructive text-sm">{errors.magazine.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleGetRowData}
                        disabled={isLoadingReport}
                        className="bg-blue-400 text-white rounded mt-5 flex items-center gap-2 px-4 h-10 w-32"
                    >
                        <Search className="h-4 w-4" />
                        {isLoadingReport ? 'Searching...' : 'Search'}
                    </button>

                    {/* Magazine dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="magazineto"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Magazine Transfer To</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Magazine..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {magazine.map((mag) => (
                                                    <SelectItem
                                                        key={mag.value}
                                                        value={mag.value}
                                                        disabled={mag.disabled}
                                                    >
                                                        {mag.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.magazineto && (
                                        <span className="text-destructive text-sm">{errors.magazineto.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={isLoadingReport}
                        className=" rounded mt-5 flex items-center gap-2 px-4 h-10 w-40"
                    >
                        <CirclePlus className="h-4 w-4" />
                        {isLoadingReport ? 'Adding Stock...' : 'Add Stock'}
                    </Button>


                </div>

            </form >

            {/* Display RE2 Data */}
            {/* {reportData && reportData.length > 0 && ( */} {/* Ensure reportData is not null before checking length */}
            <Card className="p-4 shadow-md mt-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">RE2 Data</h2>
                    <div className="flex items-center gap-4">
                        <div className="font-semibold">
                            <Badge variant="default" className='bg-green-900'>
                                Selected Cases: {selectedRows.length}
                            </Badge>
                        </div>
                        <div className="font-semibold">
                            <Badge variant="default">
                                Total Cases: {reportData ? new Set(reportData.map((item) => item.l1Barcode)).size : 0}
                            </Badge>
                        </div>
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
                                            checked={reportData && reportData.length > 0 && selectedRows.length === reportData.length}
                                            onCheckedChange={(checked) => handleSelectAll(checked)} // Pass the checked state to the handler
                                            aria-label="Select all"
                                        />
                                        {'  '} Select all
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        L1 Barcode
                                    </TableHead>
                                    <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        L1 Net Weight
                                    </TableHead>
                                    {/* <TableHead className="font-medium sticky top-0 z-10 border-b text-center">
                                        L1 Net Unit
                                    </TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="">
                                            <Checkbox
                                                className="border-blue-600 border-2"
                                                checked={selectedRows.includes(item)} // Correctly checks if the row's barcode is in selectedRows
                                                onCheckedChange={() => handleSelectRow(item)} // Calls handleSelectRow with the item's barcode
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-center">{item.l1Barcode}</TableCell>
                                        <TableCell className="font-medium text-center">{item.l1NetWt}</TableCell>
                                        {/* <TableCell className="font-medium text-center">{item.l1NetUnit}</TableCell> */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Card>
            {/* )} */}

        </Card >
    );
}

export default MagAllotManual;
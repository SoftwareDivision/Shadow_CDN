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
import { Search } from 'lucide-react';
import { getPlantDetails, magazineAllotedforTesting, getProductDetails } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore'; // Changed from import useAuthToken from '@/hooks/authStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DataTable from '@/components/DataTable';
import Loader from '@/components/Loader';



function MagAllotForTest() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        fromDate: yup.date().required('MFG Date is required'),
        testDate: yup.date().required('Test Date is required'),
        plantId: yup.string().required('Plant Name is required'),
        brand: yup.string().required('Brand is required'),
        productsize: yup.string().required('Product Size is required'),
        l1barcode: yup.string().required('L1 Barcode is required'),
        l1netweight: yup.string().required('L1 Net Weight is required'),


    });

    const {

        handleSubmit,
        setValue,
        reset,
        register,
        control,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            fromDate: new Date(),
            testDate: new Date(),
            plantId: '',
            pcode: '',
            brand: '',
            bcode: '',
            productsize: '',
            productcode: '',
            l1barcode: '',
            l1netweight: '',

        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [testDate, setTestDate] = React.useState(null);
    const [plants, setPlants] = React.useState([]);
    const [products, setProducts] = useState([]);
    const [productSizes, setProductSizes] = useState([]);
    const [reportData, setReportData] = React.useState(null);
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
        data: productData,
        isLoading: isProductFetching,
        error: fetchProductError,
    } = useQuery({
        queryKey: ['productData'],
        queryFn: () => getProductDetails(tokendata),
        enabled: !!tokendata,
    });

    console.log('productData', productData);

    useEffect(() => {
        if (plantData) {
            const plantOptions = plantData?.map((plant) => ({
                value: plant.pName,
                text: plant.pName,
                disabled: false,
            }));
            setPlants(plantOptions);
        }

    }, [reset, plantData]);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedTestDate = data.testDate ? format(data.testDate, 'yyyy-MM-dd') : '';
        const selectedPlant = data.plantId;
        const selectedPlantCode = data.pcode;
        const selectedBrand = data.brand;
        const selectedBrandCode = data.bcode;
        const selectedProductSize = data.productsize;
        const selectedProductSizeCode = data.productcode;
        const selectedL1Barcode = data.l1barcode;
        const selectedL1NetWeight = data.l1netweight;

        const reportParams = {
            mfgDt: formattedFromDate,
            dateoftest: formattedTestDate,
            plantName: selectedPlant,
            pcode: selectedPlantCode,
            bname: selectedBrand,
            bid: selectedBrandCode,
            productSize: selectedProductSize,
            psize: selectedProductSizeCode,
            l1barcode: selectedL1Barcode,
            l1netwt: selectedL1NetWeight

        };
        console.log('Report Params:', reportParams);


        try {
            // Make the API call using the new function
            const result = await magazineAllotedforTesting(tokendata, reportParams);
            reset();
            setSelectedRows([]);
            setReportData(null);

            enqueueSnackbar('Stock Added successfully fot Testing', { variant: 'success' });
            console.log('Report Data:', result);

            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to Add Stock', { variant: 'error' });
        }
    };



    const loading = isLoadingReport || isPlantFetching || isProductFetching;
    const allerrors = fetchplantError || fetchProductError;

    if (allerrors) {
        enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }


    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Magazine Allotment for Testing</h1>
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
                                                setValue('l1netweight', selected.l1netwt);
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

                    <div className="flex flex-col gap-y-2">
                        <Label>L1 Net Weight</Label>
                        <Input
                            {...register('l1netweight')}
                            readOnly
                            placeholder='L1 Net Weight...'
                            className={errors.l1netweight ? 'border-red-500' : ''}
                        />
                        {errors.l1netweight && (
                            <span className="text-destructive text-sm">{errors.l1netweight.message}</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-5">

                    <div>
                        <label htmlFor="testDate" className="text-sm font-medium">
                            Testing Date
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !testDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {testDate ? format(testDate, "PPP") : format(new Date(), "PPP")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={testDate}
                                    onSelect={(date) => { setTestDate(date); setValue("testDate", date); }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.testDate && (
                            <span className="text-destructive text-sm">{errors.testDate.message}</span>
                        )}
                    </div>

                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-y-2">
                        <Label>L1 Barcode</Label>
                        <Input
                            {...register('l1barcode')}
                            placeholder='L1 Barcode...'
                            className={errors.l1barcode ? 'border-red-500' : ''}
                        />
                        {errors.l1barcode && (
                            <span className="text-destructive text-sm">{errors.l1barcode.message}</span>
                        )}
                    </div>
                </div>
                {/* Submit Button */}
                <Button type="submit" disabled={isLoadingReport}>
                    {isLoadingReport ? 'Adding Stock...' : 'Add Stock'}
                </Button>
            </form >

        </Card >
    );
}

export default MagAllotForTest;
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
// Assuming getPlantDetails, getShiftDetails, getBrands, and getProductSizes are available in your api.js
import { getPlantDetails, getShiftDetails, getProductionReport, getProductDetails } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore'; // Changed from import useAuthToken from '@/hooks/authStore';

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



function Production_Report() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        reportType: yup.string().required('Report type is required'),
        fromDate: yup.date().required('From date is required'),
        toDate: yup.date().required('To date is required'),
        shift: yup.string().required('Shift is required'),
        plantId: yup.string().required('Plant is required'),
        brand: yup.string().required('Brand is required'),
        productsize: yup.string().required('Product Size is required'),
    });

    const {

        handleSubmit,
        setValue,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            reportType: '',
            plantId: 'all',
            fromDate: new Date(),
            toDate: new Date(),
            shift: 'all',
            brand: 'all',
            productsize: 'all',
        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);
    const [plants, setPlants] = React.useState([]);
    const [shifts, setShifts] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSizes, setProductSizes] = useState([]);
    const [reportData, setReportData] = React.useState(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [reportType, setReportType] = React.useState('Detailed');

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

    const {
        data: productData,
        isLoading: isProductFetching,
        error: fetchProductError,
    } = useQuery({
        queryKey: ['productData'],
        queryFn: () => getProductDetails(tokendata),
        enabled: !!tokendata,
    });


    useEffect(() => {
        if (plantData) {
            const plantOptions = plantData?.map((plant) => ({
                value: plant.pName,
                text: plant.pName,
                disabled: false,
            }));
            plantOptions.unshift({ value: 'all', text: 'All', disabled: false });
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
    }, [reset, plantData, shiftData]);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

        // Handle 'all' values for shift, plant, brand and productsize
        const selectedShift = data.shift === 'all' ? '' : data.shift;
        const selectedPlant = data.plantId === 'all' ? '' : data.plantId;
        const selectedBrand = data.brand === 'all' ? '' : data.brand;
        const selectedProductSize = data.productsize === 'all' ? '' : data.productsize;
        setReportType(data.reportType);
        const reportParams = {
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            reportType: data.reportType,
            shift: selectedShift,
            plant: selectedPlant,
            brand: selectedBrand,
            productsize: selectedProductSize,
        };
        console.log('Report Params:', reportParams);

        try {
            // Make the API call using the new function
            const result = await getProductionReport(tokendata, reportParams);

            enqueueSnackbar('Report fetched successfully', { variant: 'success' });
            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    console.log('Report Data from setreportData:', reportData)

    const loading = isLoadingReport || isShiftFetching || isPlantFetching || isProductFetching;
    const allerrors = fetchShiftError || fetchplantError || fetchProductError;

    if (allerrors) {
        enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    }
    if (loading) {
        return <div>Loading...</div>;
    }

    const detailedReportColumns = [
        {
            accessorKey: 'plantname',
            header: 'Plant Name',
        },
        {
            accessorKey: 'shift',
            header: 'Shift',
        },
        {
            accessorKey: 'brandname',
            header: 'Brand Name',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'l1barcode',
            header: 'L1 Barcode',
        },
        {
            accessorKey: 'l1netqty',
            header: 'Net Wt.',
        },
        {
            accessorKey: 'l1netunit',
            header: 'Net Unit',
        }
    ];

    const summaryReportColumns = [
        {
            accessorKey: 'plantname',
            header: 'Plant Name',
        },
        {
            accessorKey: 'shift',
            header: 'Shift',
        },
        {
            accessorKey: 'brandname',
            header: 'Brand Name',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'boxcount',
            header: 'Box Qty.',
        },
        {
            accessorKey: 'l1netqty',
            header: 'Net Wt.',
        },
        {
            accessorKey: 'l1netunit',
            header: 'Net Unit',
        }
    ];


    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Production Report</h1>
            </div>
            {/* Updated onSubmit handler */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Report Type</span>
                    </div>
                </div>

                {/* Updated RadioGroup for Summary and Detailed Summary */}
                <div className="relative flex justify-center">
                    <Controller
                        name="reportType"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col gap-2">
                                <RadioGroup defaultValue="" className="flex space-x-4" onValueChange={field.onChange} value={field.value}                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Detailed" id="detailed_summary" />
                                        <label htmlFor="detailed_summary">Detailed Summary</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="summary" id="summary" />
                                        <label htmlFor="summary">Summary</label>
                                    </div>
                                </RadioGroup>
                                {errors.reportType && (
                                    <span className="text-destructive text-center text-sm">{errors.reportType.message}</span>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Hirizontal Line Separator */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        {/* <span className="bg-transparent  px-2 text-sm font-medium">MFG Date Wise / Shift Wise</span> */}
                    </div>
                </div>

                {/* MFG Date Wise / Shift Section */}
                <div className="grid grid-cols-1 gap-5">
                    {/* MFG Date Wise */}
                    <div>
                        <h6 className="mb-2 font-semibold">MFG Date Wise :</h6>
                        <div className="grid grid-cols-2 gap-4">
                            {/* From Date */}
                            <div>
                                <label htmlFor="fromDate" className="text-sm font-medium">
                                    From Date
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
                            {/* To Date */}
                            <div>
                                <label htmlFor="toDate" className="text-sm font-medium">
                                    To Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !toDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {toDate ? format(toDate, "PPP") : format(new Date(), "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={toDate}
                                            onSelect={(date) => { setToDate(date); setValue("toDate", date); }} // Update form value
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.fromDate && (
                                    <span className="text-destructive text-sm">{errors.toDate.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>



                <div className="grid grid-cols-2 gap-5">
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
                                                    ?.filter((product) => product.ptype === value) // Use pCode or correct field
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
                    {/* Shift dropdown */}
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
                                            <SelectItem value="all">All</SelectItem>
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

                <div className="grid grid-cols-2 gap-5">
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
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Brand..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
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
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select product size..." /> {/* Changed placeholder */}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
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
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={isLoadingReport}>
                    {isLoadingReport ? 'Generating Report...' : 'Generate Report'}
                </Button>
            </form >

            <div>
                {reportData ? (
                    <DataTable
                        columns={reportType === 'Detailed' ? detailedReportColumns : summaryReportColumns} // Use 'columns' for Detailed, 'summaryReportColumns' for Summary
                        data={reportData}
                    />
                ) : (
                    <p className='text-center'>No report data available.</p>
                )}

            </div>

        </Card >
    );
}

export default Production_Report;
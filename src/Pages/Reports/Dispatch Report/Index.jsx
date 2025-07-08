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
import { getMagzineDetails, getDispatchReport, getCustomerDetails, getIndentOnly } from '@/lib/api';
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
import DataTable from '@/components/DataTable';
import Loader from '@/components/Loader';



function Dispatch_Report() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        reportType: yup.string().required('Report type is required'),
        fromDate: yup.date().required('From date is required'),
        toDate: yup.date().required('To date is required'),
        magazine: yup.string().required('Magazine is required'),
        customerName: yup.string().required('Customer Name is required'),
        indentNo: yup.string().required('Indent No. is required'),
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
            fromDate: new Date(),
            toDate: new Date(),
            magazine: 'all',
            customerName: 'all',
            indentNo: 'all',
        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);
    const [magazine, setMagzine] = useState([]);
    const [customer, setcustomer] = useState([]);
    const [indent, setIndent] = useState([]);
    const [reportData, setReportData] = React.useState(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [reportType, setReportType] = React.useState('Detailed');

    const { enqueueSnackbar } = useSnackbar();


    //Magazine details
    const {
        data: magazineData,
        isLoading: isMagazineFetching,
        error: fetchMagazineError,
    } = useQuery({
        queryKey: ['magazineData'],
        queryFn: () => getMagzineDetails(tokendata),
        enabled: !!tokendata,
    });

    //Coustomer details
    const {
        data: customerData,
        isLoading: iscustomerFetching,
        error: fetchcoustomerError,
    } = useQuery({
        queryKey: ['coustomerData'],
        queryFn: () => getCustomerDetails(tokendata),
        enabled: !!tokendata,
    });
    console.log("customerData", customerData);

    //Indent details
    const {
        data: indentData,
        isLoading: isIndentFetching,
        error: fetchIndentError,
    } = useQuery({
        queryKey: ['indentData'],
        queryFn: () => getIndentOnly(tokendata),
        enabled: !!tokendata,
    });

    console.log("indentData", indentData);

    useEffect(() => {

        if (customerData) {
            const customerOptions = [...new Set(customerData?.map((customer) => customer.cName))].sort().map((customer) => ({
                value: customer,
                text: customer,
                disabled: false,
            }));
            customerOptions.unshift({ value: 'all', text: 'All', disabled: false });
            setcustomer(customerOptions);
        }

        if (magazineData) {
            const magOptions = [...new Set(magazineData?.map((mag) => mag.mcode))].sort().map((mag) => ({
                value: mag,
                text: mag,
                disabled: false,
            }));
            magOptions.unshift({ value: 'all', text: 'All', disabled: false });
            setMagzine(magOptions);
        }

        if (indentData) {
            const indentOptions = [...new Set(indentData?.map((indent) => indent))].map((indent) => ({
                value: indent,
                text: indent,
                disabled: false,
            }));
            indentOptions.unshift({ value: 'all', text: 'All', disabled: false });
            setIndent(indentOptions);
        }
    }, [reset, customerData, magazineData, indentData]);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

        // Handle 'all' values for shift, plant, brand and productsize
        const selectedMagazine = data.magazine === 'all' ? '' : data.magazine;
        const selectedCustomer = data.customerName === 'all' ? '' : data.customerName;
        const selectedIndent = data.indentNo === 'all' ? '' : data.indentNo;
        setReportType(data.reportType);
        const reportParams = {
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            reportType: data.reportType,
            magazine: selectedMagazine,
            customerName: selectedCustomer,
            indentNo: selectedIndent,
        };
        console.log('Report Params:', reportParams);

        try {
            // Make the API call using the new function
            const result = await getDispatchReport(tokendata, reportParams);

            enqueueSnackbar('Report fetched successfully', { variant: 'success' });

            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    console.log('Report Data from setreportData:', reportData)

    const loading = isLoadingReport || iscustomerFetching || isIndentFetching || isMagazineFetching;
    const allerrors = fetchcoustomerError || fetchIndentError || fetchMagazineError;

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

    const detailedReportColumns = [
        {
            accessorKey: 're11indentno',
            header: 'RE11 Indent No.',
        },
        {
            accessorKey: 'dispatchDt',
            header: 'Dispt. Dt.',
            cell: ({ row }) => {
                const date = row.getValue('dispatchDt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'truck',
            header: 'Truck No.',
        },
        {
            accessorKey: 'l1Barcode',
            header: 'L1 Bardcode',
        },
        {
            accessorKey: 'brandname',
            header: 'Brand',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'magname',
            header: 'Mag Name',
        },
        {
            accessorKey: 'netqty',
            header: 'Qty.',
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
        }

    ];

    const summaryReportColumns = [
        {
            accessorKey: 're11indentno',
            header: 'RE11 Indent No.',
        },
        {
            accessorKey: 'dispatchDt',
            header: 'Dispt. Dt.',
            cell: ({ row }) => {
                const date = row.getValue('dispatchDt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'truck',
            header: 'Truck No.',
        },
        {
            accessorKey: 'brandname',
            header: 'Brand',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'magname',
            header: 'Mag Name',
        },
        {
            accessorKey: 'l1Barcode',
            header: 'Box Count',
        },
        {
            accessorKey: 'netqty',
            header: 'Qty.',
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
        }

    ];


    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Dispatch Report</h1>
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
                        <h6 className="mb-2 font-semibold">Dispatch Date Wise :</h6>
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
                                    {errors.mag && (
                                        <span className="text-destructive text-sm">{errors.mag.message}</span>
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
                        <span className="bg-transparent  px-2 text-sm font-medium">Customer And Indent Details</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* brand dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="customerName" // Changed from brandName to brand as per formSchema
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Coustomer Name</Label>
                                    <Select
                                        value={field.value}

                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Brand..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {customer.map((cust) => ( // Changed 'plant' to 'product'
                                                    <SelectItem
                                                        key={cust.value}// Added index for uniqueness
                                                        value={cust.value}
                                                        disabled={cust.disabled}
                                                    >
                                                        {cust.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.customerName && ( // Corrected error message key
                                        <span className="text-destructive text-sm">{errors.customerName.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    {/* Product size */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="indentNo" // Changed from productSize to productsize as per formSchema
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Indent No.</Label>
                                    <Select
                                        value={field.value}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select product size..." /> {/* Changed placeholder */}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {indent.map((size, index) => ( // Changed 'plant' to 'size'
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
                                    {errors.indent && ( // Corrected error message key
                                        <span className="text-destructive text-sm">
                                            {errors.indent.message}
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

export default Dispatch_Report;
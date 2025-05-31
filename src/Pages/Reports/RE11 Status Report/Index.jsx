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
import { getRe11StatusReport, getCustomerDetails, getIndentOnly } from '@/lib/api';
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
import DataTable from '@/components/DataTable';



function RE11_Status_Report() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        fromDate: yup.date().required('From date is required'),
        toDate: yup.date().required('To date is required'),
        re11Status: yup.string().required('Re11 Status is required'),
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
            fromDate: null,
            toDate: null,
            re11Status: 'all',
            customerName: 'all',
            indentNo: 'all',
        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);
    const [customer, setcustomer] = useState([]);
    const [indent, setIndent] = useState([]);
    const [reportData, setReportData] = React.useState(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);

    const { enqueueSnackbar } = useSnackbar();


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

        if (indentData) {
            const indentOptions = [...new Set(indentData?.map((indent) => indent))].map((indent) => ({
                value: indent,
                text: indent,
                disabled: false,
            }));
            indentOptions.unshift({ value: 'all', text: 'All', disabled: false });
            setIndent(indentOptions);
        }
    }, [reset, customerData, indentData]);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

        // Handle 'all' values for shift, plant, brand and productsize
        const selectedStatus = data.re11Status === 'all' ? '' : data.re11Status;
        const selectedCustomer = data.customerName === 'all' ? '' : data.customerName;
        const selectedIndent = data.indentNo === 'all' ? '' : data.indentNo;

        const reportParams = {
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            re11Status: selectedStatus ? parseInt(selectedStatus) : selectedStatus,
            customerName: selectedCustomer,
            indentNo: selectedIndent,
        };
        console.log('Report Params:', reportParams);

        try {
            // Make the API call using the new function
            const result = await getRe11StatusReport(tokendata, reportParams);

            enqueueSnackbar('Report fetched successfully', { variant: 'success' });

            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    console.log('Report Data from setreportData:', reportData)

    const loading = isLoadingReport || iscustomerFetching || isIndentFetching;
    const allerrors = fetchcoustomerError || fetchIndentError;

    if (allerrors) {
        enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    }
    if (loading) {
        return <div>Loading...</div>;
    }

    const detailedReportColumns = [
        {
            accessorKey: 're11indentno',
            header: 'RE11 Indent No.',
        },
        {
            accessorKey: 'indentDt',
            header: 'Indent. Dt.',
            cell: ({ row }) => {
                const date = row.getValue('indentDt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'ptype',
            header: 'Product',
        },
        {
            accessorKey: 'brand',
            header: 'Brand',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'reqqty',
            header: 'Requred Qty.',
        },
        {
            accessorKey: 'requnit',
            header: 'Req. Unit',
        },
        {
            accessorKey: 'remqty',
            header: 'Remaining Qty.',
        },
        {
            accessorKey: 'remunit',
            header: 'Rem. Unit',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status');
                return (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === '1' 
                            ? 'bg-green-900 '
                            : 'bg-red-900 '
                    }`}>
                        {status === '1' ? 'Completed' : 'Pending'}
                    </div>
                );
            }
        }

    ];

    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">RE11 Status Report</h1>
            </div>

            {/* Updated onSubmit handler */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">RE11 Details</span>
                    </div>
                </div>

                {/* MFG Date Wise / Shift Section */}
                <div className="grid grid-cols-1 gap-5">
                    {/* MFG Date Wise */}
                    <div>
                        <h6 className="mb-2 font-semibold">RE11 Date :</h6>
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
                                            {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
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
                                            {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
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


                {/* saprater */}
                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Indent Details And Customer</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5">

                    {/* Magazine dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="re11Status"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>RE11 Status</Label>
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
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="0">Pending</SelectItem>
                                            <SelectItem value="1">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.mag && (
                                        <span className="text-destructive text-sm">{errors.mag.message}</span>
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
                                        onValueChange={(value) => {
                                            field.onChange(value);

                                        }}
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

                    {/* Customer dropdown */}
                    <div className="flex flex-col gap-y-2">
                        <Controller
                            name="customerName" // Changed from brandName to brand as per formSchema
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <Label>Coustomer Name</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                        }}
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

                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={isLoadingReport}>
                    {isLoadingReport ? 'Generating Report...' : 'Generate Report'}
                </Button>
            </form >

            <div>
                {reportData ? (
                    <DataTable columns={detailedReportColumns} data={reportData} className="mt-4" />
                ) : (
                    <p className='text-center'>No report data available.</p>
                )}

            </div>

        </Card >
    );
}

export default RE11_Status_Report;
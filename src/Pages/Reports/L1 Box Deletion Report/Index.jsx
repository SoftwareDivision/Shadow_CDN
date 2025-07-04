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
import { getl1BoxDeletionReport, getProductDetails } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore'; // Changed from import useAuthToken from '@/hooks/authStore';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import DataTable from '@/components/DataTable';



function L1_Box_Deletion_Report() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        reportType: yup.string().required('Report type is required'),
        fromDate: yup.date().required('From date is required'),
        toDate: yup.date().required('To date is required'),
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
        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);
    const [reportData, setReportData] = React.useState(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [reportType, setReportType] = React.useState('Detailed');

    const { enqueueSnackbar } = useSnackbar();


    const {
        data: productData,
        isLoading: isProductFetching,
        error: fetchProductError,
    } = useQuery({
        queryKey: ['productData'],
        queryFn: () => getProductDetails(tokendata),
        enabled: !!tokendata,
    });


    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

        setReportType(data.reportType);
        const reportParams = {
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            reportType: data.reportType,
        };
        console.log('Report Params:', reportParams);

        try {
            // Make the API call using the new function
            const result = await getl1BoxDeletionReport(tokendata, reportParams);

            enqueueSnackbar('Report fetched successfully', { variant: 'success' });

            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    console.log('Report Data from setreportData:', reportData)

    const loading = isLoadingReport || isProductFetching;
    const allerrors = fetchProductError;

    if (allerrors) {
        enqueueSnackbar(allerrors.message || 'Failed to fetch data', { variant: 'error' });
    }
    if (loading) {
        return <div>Loading...</div>;
    }

    const detailedReportColumns = [
        {
            accessorKey: 'plant',
            header: 'Plant Name',
        },
        {
            accessorKey: 'brand',
            header: 'Brand Name',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'mfgDt',
            header: 'MFG Date',
            cell: ({ row }) => {
                const date = row.getValue('mfgDt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'l1barcode',
            header: 'L1 Barcode',
        },
        {
            accessorKey: 'deletionDt',
            header: 'Deletion Date',
            cell: ({ row }) => {
                const date = row.getValue('deletionDt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
        }

    ];

    const summaryReportColumns = [
        {
            accessorKey: 'plant',
            header: 'Plant Name',
        },
        {
            accessorKey: 'brand',
            header: 'Brand Name',
        },
        {
            accessorKey: 'productsize',
            header: 'Product Size',
        },
        {
            accessorKey: 'l1barcode',
            header: 'Box Count',
        }
    ];


    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">L1 Box Deletion Report</h1>
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
                        <h6 className="mb-2 font-semibold">Date Wise :</h6>
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

export default L1_Box_Deletion_Report;
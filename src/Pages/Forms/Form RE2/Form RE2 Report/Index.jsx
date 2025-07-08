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
import { getPlantDetails, getFromRE2Report } from '@/lib/api';
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
import Loader from '@/components/Loader';



function FormRE2Report() {
    const { token } = useAuthToken.getState();
    const tokendata = token.data.token;

    // Form validation schema - Added brand and productSize
    const formSchema = yup.object().shape({
        fromDate: yup.date().required('From date is required'),
        toDate: yup.date().required('To date is required'),
        plantId: yup.string().required('Plant is required'),
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
            plantId: 'all',
            fromDate: new Date().toISOString(),
            toDate: new Date().toISOString(),
        },
    });


    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);
    const [plants, setPlants] = React.useState([]);
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

    useEffect(() => {
        if (plantData) {
            const plantOptions = plantData?.map((plant) => ({
                value: plant.pCode,
                text: plant.pName,
                disabled: false,
            }));
            plantOptions.unshift({ value: 'all', text: 'All', disabled: false });
            setPlants(plantOptions);
        }
        console.log('Plant Data:', plantData);

    }, [reset, plantData]);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsLoadingReport(true);
        setReportData(null); // Clear previous report data

        // Format dates to YYYY-MM-DD if they exist
        const formattedFromDate = data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '';
        const formattedToDate = data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '';

        // Handle 'all' values for shift, plant, brand and productsize      
        const selectedPlant = data.plantId === 'all' ? '' : data.plantId;

        setReportType(data.reportType);
        // Ensure parameters match API endpoint types
        const reportParams = {
            fromDate: formattedFromDate.toString(), // Ensure string type
            toDate: formattedToDate.toString(), // Ensure string type
            plant: selectedPlant?.toString() || null // Match optional string parameter
        };
        console.log('Report Params:', reportParams);

        try {
            // Make the API call using the new function
            const result = await getFromRE2Report(tokendata, reportParams);

            enqueueSnackbar('Report fetched successfully', { variant: 'success' });
            console.log('Report Data:', result);
            setReportData(result); // Store the report data
            setIsLoadingReport(false);
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to fetch report', { variant: 'error' });
        }
    };

    console.log('Report Data from setreportData:', reportData)

    const loading = isLoadingReport || isPlantFetching;
    const allerrors = fetchplantError;

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
            accessorKey: 'gendt',
            header: 'Date',
            cell: ({ row }) => {
                const date = row.getValue('gendt');
                return date ? format(new Date(date), 'dd/MM/yyyy') : '';
            }
        },
        {
            accessorKey: 'shift',
            header: 'Shitf',
        },
        {
            accessorKey: 'bname',
            header: 'Brand Name of Explosive',
        },
        {
            header: 'Class & Division',
            cell: ({ row }) => {
                const magazine = row.original.class;
                const size = row.original.div;
                return `${magazine} - ${size}`;
            },
        },
        {
            accessorKey: 'productsize',
            header: 'Dimension of Finished Product',
        },
        {
            accessorKey: 'srno_ranges',
            header: 'Batch No.',
        },
        {
            accessorKey: 'netwt',
            header: 'Quantity Manufactured',
        },
        {
            accessorKey: 'dateoftest',
            header: 'Date Of Test',
        },
        {
            accessorKey: 'srno_count',
            header: 'No.of Packages',
        },
        {
            accessorKey: 'maglic',
            header: 'Magazine and Storage House Licence No. to which the Explosive Send',
        },
        {
            accessorKey: 'test',
            header: 'Remarks',
        },
        {
            accessorKey: 'test',
            header: 'Signature of Person InCharge or License',
        },
    ];

    return (
        <Card className="p-4 shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Form RE2 Report</h1>
            </div>
            {/* Updated onSubmit handler */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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
                                            selected={fromDate || new Date()}
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

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-transparent  px-2 text-sm font-medium">Plant Details</span>
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
                </div>


                {/* Submit Button */}
                <Button type="submit" disabled={isLoadingReport}>
                    {isLoadingReport ? 'Generating Report...' : 'Generate Report'}
                </Button>
            </form >

            <div>
                {reportData ? (
                    <DataTable
                        columns={detailedReportColumns} data={reportData} />
                ) : (
                    <p className='text-center'>No report data available.</p>
                )}

            </div>

        </Card >
    );
}

export default FormRE2Report;